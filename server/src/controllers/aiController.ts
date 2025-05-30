import { Request, Response } from 'express';
import multer from 'multer';
import { aiService } from '@/services/aiService';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

export const uploadAudio = upload.single('audio');

// Transcribe audio to text
export const transcribeAudio = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'Audio file is required',
      },
    });
  }

  const { language = 'en' } = req.body;
  const audioBuffer = req.file.buffer;

  try {
    const result = await aiService.transcribeAudio(audioBuffer, language);

    res.json({
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        segments: result.segments,
        language,
        processingTime: Date.now(),
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPTION_FAILED',
        message: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Analyze sentiment of text
export const analyzeSentiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEXT',
        message: 'Text is required and must be a string',
      },
    });
  }

  if (text.length > 5000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TEXT_TOO_LONG',
        message: 'Text must be less than 5000 characters',
      },
    });
  }

  try {
    const result = await aiService.analyzeSentiment(text);

    res.json({
      success: true,
      data: {
        sentiment: result.sentiment,
        confidence: result.confidence,
        emotions: result.emotions,
        textLength: text.length,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SENTIMENT_ANALYSIS_FAILED',
        message: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Summarize text
export const summarizeText = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { text, maxLength = 150 } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEXT',
        message: 'Text is required and must be a string',
      },
    });
  }

  if (text.length < 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TEXT_TOO_SHORT',
        message: 'Text must be at least 100 characters for summarization',
      },
    });
  }

  if (maxLength < 30 || maxLength > 500) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MAX_LENGTH',
        message: 'Max length must be between 30 and 500 characters',
      },
    });
  }

  try {
    const result = await aiService.summarizeText(text, maxLength);

    res.json({
      success: true,
      data: {
        summary: result.summary,
        confidence: result.confidence,
        originalLength: text.length,
        summaryLength: result.summary.length,
        compressionRatio: result.summary.length / text.length,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SUMMARIZATION_FAILED',
        message: 'Failed to summarize text',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Detect topics in text
export const detectTopics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEXT',
        message: 'Text is required and must be a string',
      },
    });
  }

  if (text.length < 50) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TEXT_TOO_SHORT',
        message: 'Text must be at least 50 characters for topic detection',
      },
    });
  }

  try {
    const result = await aiService.detectTopics(text);

    res.json({
      success: true,
      data: {
        topics: result.topics,
        confidence: result.confidence,
        textLength: text.length,
        topicCount: result.topics.length,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TOPIC_DETECTION_FAILED',
        message: 'Failed to detect topics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Extract action items from text
export const extractActionItems = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEXT',
        message: 'Text is required and must be a string',
      },
    });
  }

  try {
    const result = await aiService.extractActionItems(text);

    res.json({
      success: true,
      data: {
        actionItems: result.actionItems,
        confidence: result.confidence,
        textLength: text.length,
        actionItemCount: result.actionItems.length,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTION_ITEM_EXTRACTION_FAILED',
        message: 'Failed to extract action items',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Translate text
export const translateText = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEXT',
        message: 'Text is required and must be a string',
      },
    });
  }

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TARGET_LANGUAGE',
        message: 'Target language is required and must be a string',
      },
    });
  }

  if (text.length > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TEXT_TOO_LONG',
        message: 'Text must be less than 1000 characters for translation',
      },
    });
  }

  try {
    const result = await aiService.translateText(text, targetLanguage, sourceLanguage);

    res.json({
      success: true,
      data: {
        translatedText: result.translatedText,
        confidence: result.confidence,
        sourceLanguage,
        targetLanguage,
        originalLength: text.length,
        translatedLength: result.translatedText.length,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSLATION_FAILED',
        message: 'Failed to translate text',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Generate comprehensive insights for a meeting
export const generateMeetingInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { meetingId, transcriptText, meetingContext } = req.body;

  if (!meetingId || !transcriptText) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Meeting ID and transcript text are required',
      },
    });
  }

  if (typeof transcriptText !== 'string' || transcriptText.length < 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TRANSCRIPT',
        message: 'Transcript text must be a string with at least 100 characters',
      },
    });
  }

  try {
    const insights = await aiService.generateInsights(transcriptText, meetingContext);

    res.json({
      success: true,
      data: {
        meetingId,
        insights,
        transcriptLength: transcriptText.length,
        insightCount: insights.length,
        generatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INSIGHT_GENERATION_FAILED',
        message: 'Failed to generate meeting insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// Batch process multiple AI operations
export const batchProcess = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { operations } = req.body;

  if (!Array.isArray(operations) || operations.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OPERATIONS',
        message: 'Operations must be a non-empty array',
      },
    });
  }

  if (operations.length > 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_OPERATIONS',
        message: 'Maximum 10 operations allowed per batch',
      },
    });
  }

  const results = [];

  for (const operation of operations) {
    try {
      let result;
      
      switch (operation.type) {
        case 'sentiment':
          result = await aiService.analyzeSentiment(operation.text);
          break;
        case 'summarize':
          result = await aiService.summarizeText(operation.text, operation.maxLength);
          break;
        case 'topics':
          result = await aiService.detectTopics(operation.text);
          break;
        case 'actionItems':
          result = await aiService.extractActionItems(operation.text);
          break;
        case 'translate':
          result = await aiService.translateText(
            operation.text,
            operation.targetLanguage,
            operation.sourceLanguage
          );
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      results.push({
        id: operation.id,
        type: operation.type,
        success: true,
        data: result,
      });
    } catch (error) {
      results.push({
        id: operation.id,
        type: operation.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.json({
    success: true,
    data: {
      results,
      totalOperations: operations.length,
      successfulOperations: results.filter(r => r.success).length,
      failedOperations: results.filter(r => !r.success).length,
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Get AI service health and capabilities
export const getAIServiceInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      capabilities: {
        transcription: {
          supported: true,
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          maxFileSize: '10MB',
          supportedFormats: ['wav', 'mp3', 'webm', 'ogg'],
        },
        sentiment: {
          supported: true,
          maxTextLength: 5000,
          emotions: true,
        },
        summarization: {
          supported: true,
          minTextLength: 100,
          maxTextLength: 10000,
          maxSummaryLength: 500,
        },
        topicDetection: {
          supported: true,
          minTextLength: 50,
          categories: [
            'Project Management',
            'Finance',
            'Marketing',
            'Technology',
            'Strategy',
            'Team',
            'Product',
            'Operations',
          ],
        },
        actionItemExtraction: {
          supported: true,
          maxActionItems: 10,
          priorityLevels: ['low', 'medium', 'high'],
        },
        translation: {
          supported: true,
          maxTextLength: 1000,
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        },
        insights: {
          supported: true,
          minTranscriptLength: 100,
          types: ['decision', 'action_item', 'risk', 'opportunity', 'next_step', 'effectiveness'],
        },
      },
      status: 'healthy',
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
    },
    meta: {
      timestamp: new Date(),
    },
  });
});
