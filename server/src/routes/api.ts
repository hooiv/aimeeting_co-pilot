import { Router } from 'express';
import { authenticateToken, requireRole, requirePermission } from '@/middleware/auth';
import { validateCreateMeeting, validateUpdateMeeting, validateUUID } from '@/middleware/validation';

// Import controllers
import * as aiController from '@/controllers/aiController';
import * as meetingController from '@/controllers/meetingController';
import * as authController from '@/controllers/authController';
import * as userController from '@/controllers/userController';
import * as integrationController from '@/controllers/integrationController';
import * as analyticsController from '@/controllers/analyticsController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Authentication routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticateToken, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/me', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// OAuth routes
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);
router.get('/auth/microsoft', authController.microsoftAuth);
router.get('/auth/microsoft/callback', authController.microsoftCallback);

// User management routes
router.get('/users', authenticateToken, requireRole(['admin', 'moderator']), userController.getUsers);
router.get('/users/:id', authenticateToken, validateUUID('id'), userController.getUser);
router.put('/users/:id', authenticateToken, validateUUID('id'), userController.updateUser);
router.delete('/users/:id', authenticateToken, requireRole(['admin']), validateUUID('id'), userController.deleteUser);
router.post('/users/:id/invite', authenticateToken, requirePermission(['invite_users']), validateUUID('id'), userController.inviteUser);

// Meeting routes
router.get('/meetings', authenticateToken as any, meetingController.getMeetings as any);
router.post('/meetings', authenticateToken, validateCreateMeeting, meetingController.createMeeting);
router.get('/meetings/:id', authenticateToken, validateUUID('id'), meetingController.getMeeting);
router.put('/meetings/:id', authenticateToken, validateUUID('id'), validateUpdateMeeting, meetingController.updateMeeting);
router.delete('/meetings/:id', authenticateToken, validateUUID('id'), meetingController.deleteMeeting);
router.post('/meetings/:id/join', authenticateToken, validateUUID('id'), meetingController.joinMeeting);
router.post('/meetings/:id/leave', authenticateToken, validateUUID('id'), meetingController.leaveMeeting);

// Meeting participants routes
router.get('/meetings/:id/participants', authenticateToken, validateUUID('id'), meetingController.getParticipants);
router.post('/meetings/:id/participants', authenticateToken, validateUUID('id'), meetingController.addParticipant);
router.delete('/meetings/:id/participants/:userId', authenticateToken, validateUUID('id'), validateUUID('userId'), meetingController.removeParticipant);
router.put('/meetings/:id/participants/:userId', authenticateToken, validateUUID('id'), validateUUID('userId'), meetingController.updateParticipant);

// Action items routes
router.get('/meetings/:id/action-items', authenticateToken, validateUUID('id'), meetingController.getActionItems);
router.post('/meetings/:id/action-items', authenticateToken, validateUUID('id'), meetingController.createActionItem);
router.put('/action-items/:id', authenticateToken, validateUUID('id'), meetingController.updateActionItem);
router.delete('/action-items/:id', authenticateToken, validateUUID('id'), meetingController.deleteActionItem);

// AI service routes
router.post('/ai/transcribe', authenticateToken, aiController.uploadAudio, aiController.transcribeAudio);
router.post('/ai/sentiment', authenticateToken, aiController.analyzeSentiment);
router.post('/ai/summarize', authenticateToken, aiController.summarizeText);
router.post('/ai/topics', authenticateToken, aiController.detectTopics);
router.post('/ai/action-items', authenticateToken, aiController.extractActionItems);
router.post('/ai/translate', authenticateToken, aiController.translateText);
router.post('/ai/insights', authenticateToken, aiController.generateMeetingInsights);
router.post('/ai/batch', authenticateToken, aiController.batchProcess);
router.get('/ai/info', authenticateToken, aiController.getAIServiceInfo);

// Integration routes
router.get('/integrations', authenticateToken, integrationController.getIntegrations);
router.post('/integrations', authenticateToken, integrationController.createIntegration);
router.put('/integrations/:id', authenticateToken, validateUUID('id'), integrationController.updateIntegration);
router.delete('/integrations/:id', authenticateToken, validateUUID('id'), integrationController.deleteIntegration);
router.post('/integrations/:id/test', authenticateToken, validateUUID('id'), integrationController.testIntegration);

// Calendar integration routes
router.get('/integrations/calendar/events', authenticateToken, integrationController.getCalendarEvents);
router.post('/integrations/calendar/events', authenticateToken, integrationController.createCalendarEvent);

// Slack integration routes
router.post('/integrations/slack/message', authenticateToken, integrationController.sendSlackMessage);
router.post('/integrations/slack/channel', authenticateToken, integrationController.createSlackChannel);

// CRM integration routes
router.post('/integrations/crm/contact', authenticateToken, integrationController.createCRMContact);
router.put('/integrations/crm/contact/:id', authenticateToken, integrationController.updateCRMContact);

// Analytics routes
router.get('/analytics/meetings/:id', authenticateToken, validateUUID('id'), analyticsController.getMeetingAnalytics);
router.get('/analytics/user', authenticateToken, analyticsController.getUserAnalytics);
router.get('/analytics/organization', authenticateToken, requireRole(['admin', 'moderator']), analyticsController.getOrganizationAnalytics);
router.get('/analytics/dashboard', authenticateToken, analyticsController.getDashboardData);

// Real-time analytics
router.get('/analytics/meetings/:id/live', authenticateToken, validateUUID('id'), analyticsController.getLiveMeetingAnalytics);
router.post('/analytics/events', authenticateToken, analyticsController.trackEvent);

// File upload routes
router.post('/upload/avatar', authenticateToken, userController.uploadAvatar);
router.post('/upload/meeting-attachment', authenticateToken, meetingController.uploadAttachment);
router.get('/upload/:filename', userController.getUploadedFile);

// Search routes
router.get('/search/meetings', authenticateToken, meetingController.searchMeetings);
router.get('/search/transcripts', authenticateToken, meetingController.searchTranscripts);
router.get('/search/users', authenticateToken, userController.searchUsers);

// Notification routes
router.get('/notifications', authenticateToken, userController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, validateUUID('id'), userController.markNotificationRead);
router.delete('/notifications/:id', authenticateToken, validateUUID('id'), userController.deleteNotification);
router.post('/notifications/mark-all-read', authenticateToken, userController.markAllNotificationsRead);

// Settings routes
router.get('/settings', authenticateToken, userController.getSettings);
router.put('/settings', authenticateToken, userController.updateSettings);
router.get('/settings/organization', authenticateToken, requireRole(['admin']), userController.getOrganizationSettings);
router.put('/settings/organization', authenticateToken, requireRole(['admin']), userController.updateOrganizationSettings);

// Webhook routes
router.post('/webhooks/slack', integrationController.handleSlackWebhook);
router.post('/webhooks/google', integrationController.handleGoogleWebhook);
router.post('/webhooks/microsoft', integrationController.handleMicrosoftWebhook);
router.post('/webhooks/zoom', integrationController.handleZoomWebhook);

// Admin routes
router.get('/admin/stats', authenticateToken, requireRole(['admin']), analyticsController.getAdminStats);
router.get('/admin/users', authenticateToken, requireRole(['admin']), userController.getAdminUsers);
router.get('/admin/meetings', authenticateToken, requireRole(['admin']), meetingController.getAdminMeetings);
router.get('/admin/system-health', authenticateToken, requireRole(['admin']), analyticsController.getSystemHealth);
router.post('/admin/maintenance', authenticateToken, requireRole(['admin']), analyticsController.triggerMaintenance);

// Export routes
router.get('/export/meetings/:id/transcript', authenticateToken, validateUUID('id'), meetingController.exportTranscript);
router.get('/export/meetings/:id/summary', authenticateToken, validateUUID('id'), meetingController.exportSummary);
router.get('/export/meetings/:id/action-items', authenticateToken, validateUUID('id'), meetingController.exportActionItems);
router.get('/export/analytics/user', authenticateToken, analyticsController.exportUserAnalytics);

// Metrics endpoint for Prometheus
router.get('/metrics', (req, res) => {
  // This would typically be handled by a metrics library like prom-client
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP ai_meeting_copilot_requests_total Total number of requests
# TYPE ai_meeting_copilot_requests_total counter
ai_meeting_copilot_requests_total{method="GET",route="/api/health"} 1

# HELP ai_meeting_copilot_active_meetings Current number of active meetings
# TYPE ai_meeting_copilot_active_meetings gauge
ai_meeting_copilot_active_meetings 5

# HELP ai_meeting_copilot_connected_users Current number of connected users
# TYPE ai_meeting_copilot_connected_users gauge
ai_meeting_copilot_connected_users 23

# HELP ai_meeting_copilot_ai_requests_total Total number of AI service requests
# TYPE ai_meeting_copilot_ai_requests_total counter
ai_meeting_copilot_ai_requests_total{service="transcription"} 150
ai_meeting_copilot_ai_requests_total{service="sentiment"} 89
ai_meeting_copilot_ai_requests_total{service="summarization"} 45

# HELP ai_meeting_copilot_response_time_seconds Response time in seconds
# TYPE ai_meeting_copilot_response_time_seconds histogram
ai_meeting_copilot_response_time_seconds_bucket{le="0.1"} 100
ai_meeting_copilot_response_time_seconds_bucket{le="0.5"} 200
ai_meeting_copilot_response_time_seconds_bucket{le="1.0"} 250
ai_meeting_copilot_response_time_seconds_bucket{le="+Inf"} 300
ai_meeting_copilot_response_time_seconds_sum 45.5
ai_meeting_copilot_response_time_seconds_count 300
  `);
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'AI Meeting Co-Pilot API',
      version: '2.0.0',
      description: 'Enterprise-grade AI-powered meeting platform API',
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      documentation: `${req.protocol}://${req.get('host')}/docs`,
      endpoints: {
        authentication: '/auth/*',
        meetings: '/meetings/*',
        ai: '/ai/*',
        integrations: '/integrations/*',
        analytics: '/analytics/*',
        users: '/users/*',
        admin: '/admin/*',
      },
      websocket: {
        url: `${req.protocol === 'https' ? 'wss' : 'ws'}://${req.get('host')}`,
        events: [
          'join-meeting',
          'leave-meeting',
          'chat-message',
          'audio-data',
          'webrtc-offer',
          'webrtc-answer',
          'webrtc-ice-candidate',
          'participant-update',
          'screen-share-start',
          'screen-share-stop',
          'recording-start',
          'recording-stop',
          'reaction',
          'whiteboard-draw',
          'poll-create',
          'poll-vote',
        ],
      },
      rateLimit: {
        windowMs: 900000, // 15 minutes
        max: 100, // requests per window
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
      },
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export default router;
