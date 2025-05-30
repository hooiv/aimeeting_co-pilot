import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { addAIInsight, AIInsight } from '../store/slices/meetingSlice';

interface AIInsightsConfig {
  enableSentimentAnalysis?: boolean;
  enableTopicDetection?: boolean;
  enableSummarization?: boolean;
  enableActionItemExtraction?: boolean;
  enableKeyPointExtraction?: boolean;
  enableRecommendations?: boolean;
  analysisInterval?: number;
  minTextLength?: number;
  apiEndpoint?: string;
}

interface UseAIInsightsReturn {
  insights: AIInsight[];
  isProcessing: boolean;
  processText: (text: string) => Promise<void>;
  generateSummary: () => Promise<string>;
  extractActionItems: () => Promise<string[]>;
  analyzeSentiment: (text: string) => Promise<SentimentResult>;
  detectTopics: (text: string) => Promise<string[]>;
  getRecommendations: () => Promise<string[]>;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
}

const defaultConfig: AIInsightsConfig = {
  enableSentimentAnalysis: true,
  enableTopicDetection: true,
  enableSummarization: true,
  enableActionItemExtraction: true,
  enableKeyPointExtraction: true,
  enableRecommendations: true,
  analysisInterval: 30000, // 30 seconds
  minTextLength: 50,
  apiEndpoint: '/api/ai',
};

export const useAIInsights = (
  transcriptEntries: any[],
  config: AIInsightsConfig = defaultConfig
): UseAIInsightsReturn => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // State
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedIndexRef = useRef(0);
  const accumulatedTextRef = useRef('');

  // API call helper
  const callAIAPI = useCallback(
    async (endpoint: string, data: any) => {
      try {
        const response = await fetch(`${config.apiEndpoint}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error(`Error calling AI API ${endpoint}:`, error);
        throw error;
      }
    },
    [config.apiEndpoint]
  );

  // Process text for insights
  const processText = useCallback(
    async (text: string) => {
      if (!text || text.length < (config.minTextLength || 50)) return;

      setIsProcessing(true);

      try {
        const promises: Promise<any>[] = [];

        // Sentiment Analysis
        if (config.enableSentimentAnalysis) {
          promises.push(
            analyzeSentiment(text).then((sentiment) => ({
              type: 'sentiment',
              data: sentiment,
            }))
          );
        }

        // Topic Detection
        if (config.enableTopicDetection) {
          promises.push(
            detectTopics(text).then((topics) => ({
              type: 'topics',
              data: topics,
            }))
          );
        }

        // Key Point Extraction
        if (config.enableKeyPointExtraction) {
          promises.push(
            extractKeyPoints(text).then((keyPoints) => ({
              type: 'key_points',
              data: keyPoints,
            }))
          );
        }

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { type, data } = result.value;

            switch (type) {
              case 'sentiment':
                addInsight({
                  type: 'sentiment',
                  title: `Sentiment: ${data.sentiment}`,
                  content: `Current sentiment is ${data.sentiment} with ${Math.round(data.confidence * 100)}% confidence`,
                  confidence: data.confidence,
                  metadata: { sentiment: data.sentiment, emotions: data.emotions },
                });
                break;

              case 'topics':
                data.forEach((topic: string) => {
                  addInsight({
                    type: 'topic',
                    title: topic,
                    content: `Discussing: ${topic}`,
                    confidence: 0.8,
                    metadata: { topic },
                  });
                });
                break;

              case 'key_points':
                data.forEach((point: string) => {
                  addInsight({
                    type: 'key_point',
                    title: 'Key Point',
                    content: point,
                    confidence: 0.7,
                    metadata: { keyPoint: point },
                  });
                });
                break;
            }
          }
        });
      } catch (error) {
        console.error('Error processing text for insights:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [config]
  );

  // Add insight helper
  const addInsight = useCallback(
    (insight: Omit<AIInsight, 'id' | 'timestamp'>) => {
      const newInsight: AIInsight = {
        ...insight,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };

      setInsights((prev) => [...prev, newInsight]);
      dispatch(addAIInsight(newInsight));
    },
    [dispatch]
  );

  // Analyze sentiment
  const analyzeSentiment = useCallback(
    async (text: string): Promise<SentimentResult> => {
      try {
        const result = await callAIAPI('/sentiment', { text });
        return {
          sentiment: result.sentiment,
          confidence: result.confidence,
          emotions: result.emotions,
        };
      } catch (error) {
        // Fallback to simple sentiment analysis
        return simpleSentimentAnalysis(text);
      }
    },
    [callAIAPI]
  );

  // Simple sentiment analysis fallback
  const simpleSentimentAnalysis = (text: string): SentimentResult => {
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'fantastic',
      'love',
      'like',
      'happy',
      'pleased',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'hate',
      'dislike',
      'angry',
      'frustrated',
      'disappointed',
      'sad',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const positiveRatio = positiveCount / total;
    if (positiveRatio > 0.6) {
      return { sentiment: 'positive', confidence: positiveRatio };
    } else if (positiveRatio < 0.4) {
      return { sentiment: 'negative', confidence: 1 - positiveRatio };
    } else {
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  };

  // Detect topics
  const detectTopics = useCallback(
    async (text: string): Promise<string[]> => {
      try {
        const result = await callAIAPI('/topics', { text });
        return result.topics || [];
      } catch (error) {
        // Fallback to simple topic detection
        return simpleTopicDetection(text);
      }
    },
    [callAIAPI]
  );

  // Simple topic detection fallback
  const simpleTopicDetection = (text: string): string[] => {
    const topicKeywords = {
      'Project Management': ['project', 'deadline', 'milestone', 'task', 'deliverable'],
      Finance: ['budget', 'cost', 'revenue', 'profit', 'expense', 'financial'],
      Marketing: ['campaign', 'brand', 'customer', 'market', 'promotion'],
      Technology: ['software', 'system', 'development', 'code', 'technical'],
      Strategy: ['strategy', 'plan', 'goal', 'objective', 'vision'],
      Team: ['team', 'collaboration', 'meeting', 'discussion', 'communication'],
    };

    const detectedTopics: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter((keyword) => lowerText.includes(keyword));
      if (matches.length >= 2) {
        detectedTopics.push(topic);
      }
    });

    return detectedTopics;
  };

  // Extract key points
  const extractKeyPoints = useCallback(
    async (text: string): Promise<string[]> => {
      try {
        const result = await callAIAPI('/key-points', { text });
        return result.keyPoints || [];
      } catch (error) {
        // Fallback to simple key point extraction
        return simpleKeyPointExtraction(text);
      }
    },
    [callAIAPI]
  );

  // Simple key point extraction fallback
  const simpleKeyPointExtraction = (text: string): string[] => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const keyPhrases = [
      'important',
      'key',
      'main',
      'primary',
      'essential',
      'critical',
      'significant',
    ];

    return sentences
      .filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();
        return keyPhrases.some((phrase) => lowerSentence.includes(phrase));
      })
      .slice(0, 3); // Limit to 3 key points
  };

  // Generate summary
  const generateSummary = useCallback(async (): Promise<string> => {
    const allText = transcriptEntries.map((entry) => entry.text).join(' ');

    try {
      const result = await callAIAPI('/summarize', {
        text: allText,
        maxLength: 200,
      });

      addInsight({
        type: 'summary',
        title: 'Meeting Summary',
        content: result.summary,
        confidence: result.confidence || 0.8,
        metadata: { wordCount: allText.split(' ').length },
      });

      return result.summary;
    } catch (error) {
      // Fallback to simple summarization
      const summary = simpleSummarization(allText);
      addInsight({
        type: 'summary',
        title: 'Meeting Summary',
        content: summary,
        confidence: 0.6,
        metadata: { wordCount: allText.split(' ').length },
      });
      return summary;
    }
  }, [transcriptEntries, callAIAPI, addInsight]);

  // Simple summarization fallback
  const simpleSummarization = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const topSentences = sentences.slice(0, Math.min(3, sentences.length));
    return topSentences.join('. ') + '.';
  };

  // Extract action items
  const extractActionItems = useCallback(async (): Promise<string[]> => {
    const allText = transcriptEntries.map((entry) => entry.text).join(' ');

    try {
      const result = await callAIAPI('/action-items', { text: allText });

      result.actionItems?.forEach((item: string) => {
        addInsight({
          type: 'action_item',
          title: 'Action Item',
          content: item,
          confidence: 0.8,
          metadata: { actionItem: item },
        });
      });

      return result.actionItems || [];
    } catch (error) {
      // Fallback to simple action item extraction
      const actionItems = simpleActionItemExtraction(allText);
      actionItems.forEach((item) => {
        addInsight({
          type: 'action_item',
          title: 'Action Item',
          content: item,
          confidence: 0.6,
          metadata: { actionItem: item },
        });
      });
      return actionItems;
    }
  }, [transcriptEntries, callAIAPI, addInsight]);

  // Simple action item extraction fallback
  const simpleActionItemExtraction = (text: string): string[] => {
    const actionPhrases = [
      'need to',
      'should',
      'will',
      'must',
      'have to',
      'going to',
      'action item',
      'todo',
      'follow up',
      'next step',
    ];

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    return sentences
      .filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();
        return actionPhrases.some((phrase) => lowerSentence.includes(phrase));
      })
      .slice(0, 5); // Limit to 5 action items
  };

  // Get recommendations
  const getRecommendations = useCallback(async (): Promise<string[]> => {
    const allText = transcriptEntries.map((entry) => entry.text).join(' ');

    try {
      const result = await callAIAPI('/recommendations', {
        text: allText,
        insights: insights,
      });

      result.recommendations?.forEach((rec: string) => {
        addInsight({
          type: 'recommendation',
          title: 'AI Recommendation',
          content: rec,
          confidence: 0.7,
          metadata: { recommendation: rec },
        });
      });

      return result.recommendations || [];
    } catch (error) {
      // Fallback to simple recommendations
      const recommendations = simpleRecommendations();
      recommendations.forEach((rec) => {
        addInsight({
          type: 'recommendation',
          title: 'AI Recommendation',
          content: rec,
          confidence: 0.5,
          metadata: { recommendation: rec },
        });
      });
      return recommendations;
    }
  }, [transcriptEntries, insights, callAIAPI, addInsight]);

  // Simple recommendations fallback
  const simpleRecommendations = (): string[] => {
    const recommendations = [];

    if (insights.filter((i) => i.type === 'action_item').length > 5) {
      recommendations.push('Consider prioritizing action items to avoid overwhelming the team.');
    }

    if (insights.some((i) => i.type === 'sentiment' && i.metadata?.sentiment === 'negative')) {
      recommendations.push('Address concerns raised during the meeting to improve team morale.');
    }

    if (transcriptEntries.length > 100) {
      recommendations.push('Consider breaking down long meetings into shorter, focused sessions.');
    }

    return recommendations;
  };

  // Auto-analysis effect
  useEffect(() => {
    if (transcriptEntries.length === 0) return;

    const newEntries = transcriptEntries.slice(lastAnalyzedIndexRef.current);
    if (newEntries.length === 0) return;

    const newText = newEntries.map((entry) => entry.text).join(' ');
    accumulatedTextRef.current += ' ' + newText;
    lastAnalyzedIndexRef.current = transcriptEntries.length;

    // Clear existing interval
    if (analysisIntervalRef.current) {
      clearTimeout(analysisIntervalRef.current);
    }

    // Set new interval for analysis
    analysisIntervalRef.current = setTimeout(() => {
      if (accumulatedTextRef.current.length >= (config.minTextLength || 50)) {
        processText(accumulatedTextRef.current);
        accumulatedTextRef.current = '';
      }
    }, config.analysisInterval || 30000);
  }, [transcriptEntries, processText, config]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearTimeout(analysisIntervalRef.current);
      }
    };
  }, []);

  return {
    insights,
    isProcessing,
    processText,
    generateSummary,
    extractActionItems,
    analyzeSentiment,
    detectTopics,
    getRecommendations,
  };
};
