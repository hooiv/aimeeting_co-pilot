import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
      },
    });
  }
  next();
};

// Meeting validation rules
export const validateCreateMeeting = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('agenda')
    .optional()
    .isArray()
    .withMessage('Agenda must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors,
];

export const validateUpdateMeeting = [
  param('id')
    .isUUID()
    .withMessage('Meeting ID must be a valid UUID'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('status')
    .optional()
    .isIn(['scheduled', 'active', 'ended', 'cancelled'])
    .withMessage('Status must be one of: scheduled, active, ended, cancelled'),
  handleValidationErrors,
];

// Action item validation rules
export const validateCreateActionItem = [
  body('meetingId')
    .isUUID()
    .withMessage('Meeting ID must be a valid UUID'),
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('assignedTo')
    .isUUID()
    .withMessage('Assigned to must be a valid UUID'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  handleValidationErrors,
];

// User validation rules
export const validateUpdateUser = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Display name must be between 1 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid'),
  body('role')
    .optional()
    .isIn(['admin', 'moderator', 'participant'])
    .withMessage('Role must be one of: admin, moderator, participant'),
  handleValidationErrors,
];

// Query validation rules
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

// AI service validation rules
export const validateTranscription = [
  body('audio')
    .notEmpty()
    .withMessage('Audio data is required'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters'),
  handleValidationErrors,
];

export const validateSummarization = [
  body('text')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Text must be between 10 and 10000 characters'),
  body('maxLength')
    .optional()
    .isInt({ min: 50, max: 500 })
    .withMessage('Max length must be between 50 and 500'),
  handleValidationErrors,
];

export const validateTranslation = [
  body('text')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  body('targetLanguage')
    .isLength({ min: 2, max: 5 })
    .withMessage('Target language code must be 2-5 characters'),
  body('sourceLanguage')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Source language code must be 2-5 characters'),
  handleValidationErrors,
];

// Integration validation rules
export const validateIntegration = [
  body('provider')
    .isIn(['google', 'microsoft', 'slack', 'salesforce', 'hubspot'])
    .withMessage('Provider must be one of: google, microsoft, slack, salesforce, hubspot'),
  body('config')
    .isObject()
    .withMessage('Config must be an object'),
  handleValidationErrors,
];

// Common parameter validation
export const validateUUID = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors,
];
