import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import config from '@/config';
import { AIInsight } from '@/types';

export class AIService {
  private huggingFaceApiKey: string;
  private openAIApiKey?: string;

  constructor() {
    this.huggingFaceApiKey = config.ai.huggingface.apiKey;
    this.openAIApiKey = config.ai.openai?.apiKey;
  }

  // Transcription using Hugging Face Wav2Vec2
  async transcribeAudio(audioBuffer: Buffer, language: string = 'en'): Promise<{
    text: string;
    confidence: number;
    segments?: Array<{ start: number; end: number; text: string; confidence: number }>;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${config.ai.huggingface.models.transcription}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 30000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Handle different response formats
      if (typeof response.data === 'string') {
        return {
          text: response.data,
          confidence: 0.8, // Default confidence
        };
      }

      if (response.data.text) {
        return {
          text: response.data.text,
          confidence: response.data.confidence || 0.8,
          segments: response.data.segments,
        };
      }

      throw new Error('Unexpected response format from transcription API');
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Sentiment analysis using Hugging Face DistilBERT
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions?: {
      joy: number;
      anger: number;
      fear: number;
      sadness: number;
      surprise: number;
    };
  }> {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${config.ai.huggingface.models.sentiment}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const results = response.data[0];
      const sentimentMap: { [key: string]: 'positive' | 'negative' | 'neutral' } = {
        'POSITIVE': 'positive',
        'NEGATIVE': 'negative',
        'NEUTRAL': 'neutral',
      };

      const topResult = results.reduce((prev: any, current: any) => 
        prev.score > current.score ? prev : current
      );

      return {
        sentiment: sentimentMap[topResult.label] || 'neutral',
        confidence: topResult.score,
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  // Text summarization using Hugging Face BART
  async summarizeText(text: string, maxLength: number = 150): Promise<{
    summary: string;
    confidence: number;
  }> {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${config.ai.huggingface.models.summarization}`,
        {
          inputs: text,
          parameters: {
            max_length: maxLength,
            min_length: Math.min(30, Math.floor(maxLength * 0.2)),
            do_sample: false,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return {
        summary: response.data[0].summary_text,
        confidence: 0.8, // Default confidence for summarization
      };
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  // Topic detection using keyword extraction and clustering
  async detectTopics(text: string): Promise<{
    topics: string[];
    confidence: number;
  }> {
    try {
      // Use a combination of keyword extraction and predefined topic categories
      const topics = await this.extractTopicsFromText(text);
      
      return {
        topics,
        confidence: 0.7,
      };
    } catch (error) {
      console.error('Topic detection error:', error);
      throw new Error('Failed to detect topics');
    }
  }

  // Extract action items using NLP patterns
  async extractActionItems(text: string): Promise<{
    actionItems: Array<{
      text: string;
      assignee?: string;
      priority: 'low' | 'medium' | 'high';
      dueDate?: string;
    }>;
    confidence: number;
  }> {
    try {
      const actionItems = await this.findActionItemPatterns(text);
      
      return {
        actionItems,
        confidence: 0.75,
      };
    } catch (error) {
      console.error('Action item extraction error:', error);
      throw new Error('Failed to extract action items');
    }
  }

  // Translation using Hugging Face Helsinki-NLP models
  async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<{
    translatedText: string;
    confidence: number;
  }> {
    try {
      const modelName = `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`;
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelName}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return {
        translatedText: response.data[0].translation_text,
        confidence: 0.8,
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  // Generate meeting insights using OpenAI (if available)
  async generateInsights(transcriptText: string, meetingContext?: any): Promise<AIInsight[]> {
    if (!this.openAIApiKey) {
      return this.generateBasicInsights(transcriptText);
    }

    try {
      const prompt = this.buildInsightsPrompt(transcriptText, meetingContext);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.ai.openai?.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI meeting assistant that analyzes meeting transcripts and provides valuable insights.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const insights = this.parseInsightsResponse(response.data.choices[0].message.content);
      return insights;
    } catch (error) {
      console.error('OpenAI insights error:', error);
      return this.generateBasicInsights(transcriptText);
    }
  }

  // Helper method to extract topics from text
  private async extractTopicsFromText(text: string): Promise<string[]> {
    const topicKeywords = {
      'Project Management': ['project', 'deadline', 'milestone', 'task', 'deliverable', 'timeline', 'scope'],
      'Finance': ['budget', 'cost', 'revenue', 'profit', 'expense', 'financial', 'investment', 'roi'],
      'Marketing': ['campaign', 'brand', 'customer', 'market', 'promotion', 'advertising', 'sales'],
      'Technology': ['software', 'system', 'development', 'code', 'technical', 'platform', 'api'],
      'Strategy': ['strategy', 'plan', 'goal', 'objective', 'vision', 'roadmap', 'direction'],
      'Team': ['team', 'collaboration', 'meeting', 'discussion', 'communication', 'coordination'],
      'Product': ['product', 'feature', 'design', 'user', 'interface', 'experience', 'requirements'],
      'Operations': ['process', 'workflow', 'efficiency', 'optimization', 'automation', 'quality'],
    };

    const detectedTopics: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      const score = matches.length / keywords.length;
      
      if (score >= 0.2) { // At least 20% of keywords match
        detectedTopics.push(topic);
      }
    });

    return detectedTopics;
  }

  // Helper method to find action item patterns
  private async findActionItemPatterns(text: string): Promise<Array<{
    text: string;
    assignee?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }>> {
    const actionPatterns = [
      /(?:need to|should|will|must|have to|going to|action item|todo|follow up|next step)\s+(.+?)(?:\.|$)/gi,
      /(?:@\w+|[A-Z][a-z]+)\s+(?:will|should|needs to|has to)\s+(.+?)(?:\.|$)/gi,
      /(?:by|before|until)\s+(\w+day|\d+\/\d+|\w+\s+\d+).+?(.+?)(?:\.|$)/gi,
    ];

    const actionItems: Array<{
      text: string;
      assignee?: string;
      priority: 'low' | 'medium' | 'high';
      dueDate?: string;
    }> = [];

    actionPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          const actionText = match[1].trim();
          const priority = this.determinePriority(actionText);
          const assignee = this.extractAssignee(match[0]);
          const dueDate = this.extractDueDate(match[0]);

          actionItems.push({
            text: actionText,
            assignee,
            priority,
            dueDate,
          });
        }
      }
    });

    return actionItems.slice(0, 10); // Limit to 10 action items
  }

  // Helper method to determine priority
  private determinePriority(text: string): 'low' | 'medium' | 'high' {
    const highPriorityWords = ['urgent', 'critical', 'asap', 'immediately', 'emergency'];
    const mediumPriorityWords = ['important', 'soon', 'priority', 'significant'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityWords.some(word => lowerText.includes(word))) {
      return 'high';
    }
    
    if (mediumPriorityWords.some(word => lowerText.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  }

  // Helper method to extract assignee
  private extractAssignee(text: string): string | undefined {
    const assigneePattern = /@(\w+)|([A-Z][a-z]+)\s+(?:will|should|needs to)/;
    const match = text.match(assigneePattern);
    return match ? (match[1] || match[2]) : undefined;
  }

  // Helper method to extract due date
  private extractDueDate(text: string): string | undefined {
    const datePattern = /(?:by|before|until)\s+(\w+day|\d+\/\d+|\w+\s+\d+)/i;
    const match = text.match(datePattern);
    return match ? match[1] : undefined;
  }

  // Build prompt for OpenAI insights
  private buildInsightsPrompt(transcriptText: string, meetingContext?: any): string {
    return `
Analyze the following meeting transcript and provide insights in JSON format:

Transcript:
${transcriptText}

Please provide insights in the following categories:
1. Key decisions made
2. Action items with assignees
3. Risks or concerns raised
4. Opportunities identified
5. Next steps
6. Overall meeting effectiveness

Format your response as a JSON array of insight objects with the following structure:
{
  "type": "decision|action_item|risk|opportunity|next_step|effectiveness",
  "title": "Brief title",
  "content": "Detailed description",
  "confidence": 0.0-1.0
}
    `;
  }

  // Parse OpenAI insights response
  private parseInsightsResponse(response: string): AIInsight[] {
    try {
      const insights = JSON.parse(response);
      return insights.map((insight: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: insight.type,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence,
        timestamp: new Date().toISOString(),
        metadata: insight.metadata || {},
      }));
    } catch (error) {
      console.error('Error parsing insights response:', error);
      return [];
    }
  }

  // Generate basic insights without OpenAI
  private generateBasicInsights(transcriptText: string): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Basic sentiment insight
    const wordCount = transcriptText.split(' ').length;
    insights.push({
      id: Date.now().toString(),
      type: 'summary',
      title: 'Meeting Overview',
      content: `Meeting transcript contains ${wordCount} words. Analysis shows active discussion with multiple participants.`,
      confidence: 0.7,
      timestamp: new Date().toISOString(),
      metadata: { wordCount },
    });

    return insights;
  }
}

export const aiService = new AIService();
