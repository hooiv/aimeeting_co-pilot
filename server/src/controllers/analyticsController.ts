import { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

// Database connection (this should be injected in a real app)
let db: Pool;

export const setDatabase = (database: Pool) => {
  db = database;
};

export const getMeetingAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: meetingId } = req.params;
  const userId = req.user!.userId;

  try {
    // Get meeting basic info
    const meetingQuery = await db.query(
      'SELECT * FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (meetingQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEETING_NOT_FOUND',
          message: 'Meeting not found',
        },
      });
    }

    const meeting = meetingQuery.rows[0];

    // Get meeting analytics
    const analyticsQuery = await db.query(
      'SELECT * FROM meeting_analytics WHERE meeting_id = $1',
      [meetingId]
    );

    // Get participants data
    const participantsQuery = await db.query(`
      SELECT
        p.*,
        u.display_name,
        u.email
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.meeting_id = $1
    `, [meetingId]);

    // Get AI insights
    const insightsQuery = await db.query(
      'SELECT * FROM ai_insights WHERE meeting_id = $1 ORDER BY created_at DESC',
      [meetingId]
    );

    // Get action items
    const actionItemsQuery = await db.query(`
      SELECT
        ai.*,
        u.display_name as assigned_to_name
      FROM action_items ai
      LEFT JOIN users u ON ai.assigned_to = u.id
      WHERE ai.meeting_id = $1
      ORDER BY ai.created_at DESC
    `, [meetingId]);

    const analytics = analyticsQuery.rows[0] || {};

    res.json({
      success: true,
      data: {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          duration: meeting.actual_duration || meeting.scheduled_duration,
          status: meeting.status,
        },
        analytics: {
          totalParticipants: analytics.total_participants || participantsQuery.rows.length,
          peakParticipants: analytics.peak_participants || participantsQuery.rows.length,
          averageDuration: analytics.average_duration || 0,
          totalMessages: analytics.total_messages || 0,
          totalReactions: analytics.total_reactions || 0,
          screenShareDuration: analytics.screen_share_duration || 0,
          recordingDuration: analytics.recording_duration || 0,
          sentimentScore: analytics.sentiment_score || null,
          engagementScore: analytics.engagement_score || null,
          qualityScore: analytics.quality_score || null,
        },
        participants: participantsQuery.rows,
        insights: insightsQuery.rows,
        actionItems: actionItemsQuery.rows,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching meeting analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch meeting analytics',
      },
    });
  }
});

export const getUserAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { timeframe = '30d' } = req.query;

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get user analytics summary
    const userAnalyticsQuery = await db.query(
      'SELECT * FROM user_analytics WHERE user_id = $1',
      [userId]
    );

    // Get meetings data for the timeframe
    const meetingsQuery = await db.query(`
      SELECT
        m.*,
        p.duration as participation_duration,
        p.role as participant_role
      FROM meetings m
      JOIN participants p ON m.id = p.meeting_id
      WHERE p.user_id = $1
        AND m.start_time >= $2
        AND m.start_time <= $3
      ORDER BY m.start_time DESC
    `, [userId, startDate, endDate]);

    // Get analytics events for the timeframe
    const eventsQuery = await db.query(`
      SELECT
        event_type,
        event_category,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM analytics_events
      WHERE user_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
      GROUP BY event_type, event_category, DATE_TRUNC('day', timestamp)
      ORDER BY date DESC
    `, [userId, startDate, endDate]);

    const userAnalytics = userAnalyticsQuery.rows[0] || {};
    const meetings = meetingsQuery.rows;
    const events = eventsQuery.rows;

    // Calculate additional metrics
    const hostedMeetings = meetings.filter(m => m.host_id === userId);
    const attendedMeetings = meetings.filter(m => m.host_id !== userId);
    const totalMeetingTime = meetings.reduce((sum, m) => sum + (m.participation_duration || 0), 0);
    const averageMeetingDuration = meetings.length > 0 ? totalMeetingTime / meetings.length : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalMeetings: userAnalytics.total_meetings || meetings.length,
          totalMeetingTime: userAnalytics.total_meeting_time || totalMeetingTime,
          meetingsHosted: userAnalytics.meetings_hosted || hostedMeetings.length,
          meetingsAttended: userAnalytics.meetings_attended || attendedMeetings.length,
          averageMeetingDuration: userAnalytics.average_meeting_duration || averageMeetingDuration,
          productivityScore: userAnalytics.productivity_score || null,
          engagementScore: userAnalytics.engagement_score || null,
          streakDays: userAnalytics.streak_days || 0,
        },
        timeframe: {
          start: startDate,
          end: endDate,
          meetings: meetings.length,
          totalTime: totalMeetingTime,
        },
        meetings: meetings.slice(0, 10), // Latest 10 meetings
        events: events,
        trends: {
          meetingsPerWeek: calculateWeeklyTrend(meetings),
          engagementTrend: calculateEngagementTrend(events),
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user analytics',
      },
    });
  }
});

// Helper functions for trend calculations
const calculateWeeklyTrend = (meetings: any[]) => {
  const weeks = {};
  meetings.forEach(meeting => {
    const week = new Date(meeting.start_time);
    week.setDate(week.getDate() - week.getDay()); // Start of week
    const weekKey = week.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });
  return Object.entries(weeks).map(([date, count]) => ({ date, count }));
};

const calculateEngagementTrend = (events: any[]) => {
  const engagement = {};
  events.forEach(event => {
    const date = event.date.toISOString().split('T')[0];
    if (!engagement[date]) engagement[date] = 0;
    engagement[date] += event.count;
  });
  return Object.entries(engagement).map(([date, score]) => ({ date, score }));
};

export const getOrganizationAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { timeframe = '30d' } = req.query;

  try {
    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]?.organization_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User is not part of an organization',
        },
      });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get organization users
    const usersQuery = await db.query(
      'SELECT COUNT(*) as total_users, COUNT(CASE WHEN is_active THEN 1 END) as active_users FROM users WHERE organization_id = $1',
      [organizationId]
    );

    // Get organization meetings
    const meetingsQuery = await db.query(`
      SELECT
        m.*,
        COUNT(p.id) as participant_count
      FROM meetings m
      LEFT JOIN participants p ON m.id = p.meeting_id
      WHERE m.organization_id = $1
        AND m.start_time >= $2
        AND m.start_time <= $3
      GROUP BY m.id
      ORDER BY m.start_time DESC
    `, [organizationId, startDate, endDate]);

    // Get system analytics for the organization
    const systemAnalyticsQuery = await db.query(`
      SELECT
        date,
        total_users,
        active_users,
        total_meetings,
        total_meeting_minutes,
        average_meeting_duration
      FROM system_analytics
      WHERE date >= $1 AND date <= $2
      ORDER BY date DESC
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    const users = usersQuery.rows[0];
    const meetings = meetingsQuery.rows;
    const systemAnalytics = systemAnalyticsQuery.rows;

    // Calculate metrics
    const totalMeetings = meetings.length;
    const totalMeetingTime = meetings.reduce((sum, m) => sum + (m.actual_duration || m.scheduled_duration || 0), 0);
    const averageMeetingDuration = totalMeetings > 0 ? totalMeetingTime / totalMeetings : 0;
    const averageParticipants = totalMeetings > 0 ? meetings.reduce((sum, m) => sum + (m.participant_count || 0), 0) / totalMeetings : 0;

    res.json({
      success: true,
      data: {
        organization: {
          id: organizationId,
          totalUsers: users.total_users,
          activeUsers: users.active_users,
        },
        summary: {
          totalMeetings,
          totalMeetingTime,
          averageMeetingDuration,
          averageParticipants,
        },
        timeframe: {
          start: startDate,
          end: endDate,
        },
        meetings: meetings.slice(0, 20), // Latest 20 meetings
        trends: {
          daily: systemAnalytics,
          meetingsPerDay: calculateDailyMeetingTrend(meetings),
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch organization analytics',
      },
    });
  }
});

const calculateDailyMeetingTrend = (meetings: any[]) => {
  const days = {};
  meetings.forEach(meeting => {
    const day = new Date(meeting.start_time).toISOString().split('T')[0];
    days[day] = (days[day] || 0) + 1;
  });
  return Object.entries(days).map(([date, count]) => ({ date, count }));
};

export const getDashboardData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    // Get recent meetings
    const recentMeetingsQuery = await db.query(`
      SELECT
        m.*,
        COUNT(p.id) as participant_count
      FROM meetings m
      LEFT JOIN participants p ON m.id = p.meeting_id
      WHERE m.host_id = $1 OR p.user_id = $1
      GROUP BY m.id
      ORDER BY m.start_time DESC
      LIMIT 5
    `, [userId]);

    // Get upcoming meetings
    const upcomingMeetingsQuery = await db.query(`
      SELECT
        m.*,
        COUNT(p.id) as participant_count
      FROM meetings m
      LEFT JOIN participants p ON m.id = p.meeting_id
      WHERE (m.host_id = $1 OR p.user_id = $1)
        AND m.start_time > NOW()
        AND m.status = 'scheduled'
      GROUP BY m.id
      ORDER BY m.start_time ASC
      LIMIT 5
    `, [userId]);

    // Get user analytics summary
    const userAnalyticsQuery = await db.query(
      'SELECT * FROM user_analytics WHERE user_id = $1',
      [userId]
    );

    // Get recent notifications
    const notificationsQuery = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Get quick stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const quickStatsQuery = await db.query(`
      SELECT
        COUNT(DISTINCT m.id) as meetings_count,
        SUM(COALESCE(p.duration, 0)) as total_time,
        COUNT(DISTINCT CASE WHEN m.host_id = $1 THEN m.id END) as hosted_count
      FROM meetings m
      LEFT JOIN participants p ON m.id = p.meeting_id AND p.user_id = $1
      WHERE (m.host_id = $1 OR p.user_id = $1)
        AND m.start_time >= $2
    `, [userId, thirtyDaysAgo]);

    const userAnalytics = userAnalyticsQuery.rows[0] || {};
    const quickStats = quickStatsQuery.rows[0] || {};

    res.json({
      success: true,
      data: {
        quickStats: {
          meetingsThisMonth: quickStats.meetings_count || 0,
          totalTimeThisMonth: quickStats.total_time || 0,
          meetingsHosted: quickStats.hosted_count || 0,
          productivityScore: userAnalytics.productivity_score || null,
        },
        recentMeetings: recentMeetingsQuery.rows,
        upcomingMeetings: upcomingMeetingsQuery.rows,
        notifications: notificationsQuery.rows.filter(n => !n.is_read).slice(0, 5),
        analytics: {
          totalMeetings: userAnalytics.total_meetings || 0,
          totalMeetingTime: userAnalytics.total_meeting_time || 0,
          streakDays: userAnalytics.streak_days || 0,
          engagementScore: userAnalytics.engagement_score || null,
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch dashboard data',
      },
    });
  }
});

export const getLiveMeetingAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: meetingId } = req.params;
  const userId = req.user!.userId;

  try {
    // Get current meeting status
    const meetingQuery = await db.query(
      'SELECT * FROM meetings WHERE id = $1 AND status = $2',
      [meetingId, 'in_progress']
    );

    if (meetingQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEETING_NOT_FOUND_OR_NOT_LIVE',
          message: 'Meeting not found or not currently in progress',
        },
      });
    }

    // Get current participants
    const participantsQuery = await db.query(`
      SELECT
        p.*,
        u.display_name,
        u.email
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.meeting_id = $1 AND p.status = 'joined'
    `, [meetingId]);

    // Get recent analytics events (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEventsQuery = await db.query(`
      SELECT
        event_type,
        event_category,
        COUNT(*) as count
      FROM analytics_events
      WHERE meeting_id = $1 AND timestamp >= $2
      GROUP BY event_type, event_category
    `, [meetingId, fiveMinutesAgo]);

    const meeting = meetingQuery.rows[0];
    const participants = participantsQuery.rows;
    const recentEvents = recentEventsQuery.rows;

    // Calculate live metrics
    const currentParticipants = participants.length;
    const speakingParticipants = participants.filter(p => !p.is_muted).length;
    const videoEnabledParticipants = participants.filter(p => p.is_video_enabled).length;
    const screenSharingParticipants = participants.filter(p => p.is_screen_sharing).length;

    res.json({
      success: true,
      data: {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          startTime: meeting.start_time,
          duration: Math.floor((Date.now() - new Date(meeting.start_time).getTime()) / 1000 / 60), // minutes
          status: meeting.status,
        },
        liveMetrics: {
          currentParticipants,
          speakingParticipants,
          videoEnabledParticipants,
          screenSharingParticipants,
          connectionQuality: calculateAverageConnectionQuality(participants),
        },
        participants: participants.map(p => ({
          id: p.user_id,
          name: p.display_name,
          email: p.email,
          role: p.role,
          joinedAt: p.joined_at,
          isMuted: p.is_muted,
          isVideoEnabled: p.is_video_enabled,
          isScreenSharing: p.is_screen_sharing,
          connectionQuality: p.connection_quality,
        })),
        recentActivity: recentEvents,
      },
      meta: {
        timestamp: new Date(),
        refreshInterval: 5000, // Suggest refresh every 5 seconds
      },
    });
  } catch (error) {
    console.error('Error fetching live meeting analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch live meeting analytics',
      },
    });
  }
});

const calculateAverageConnectionQuality = (participants: any[]) => {
  if (participants.length === 0) return 'unknown';

  const qualityScores = {
    'excellent': 4,
    'good': 3,
    'fair': 2,
    'poor': 1,
    'unknown': 0
  };

  const totalScore = participants.reduce((sum, p) => sum + (qualityScores[p.connection_quality] || 0), 0);
  const averageScore = totalScore / participants.length;

  if (averageScore >= 3.5) return 'excellent';
  if (averageScore >= 2.5) return 'good';
  if (averageScore >= 1.5) return 'fair';
  if (averageScore >= 0.5) return 'poor';
  return 'unknown';
};

export const trackEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { eventType, eventCategory, eventData, meetingId, sessionId } = req.body;

  try {
    // Insert analytics event
    await db.query(`
      INSERT INTO analytics_events (
        user_id, meeting_id, event_type, event_category, event_data,
        session_id, ip_address, user_agent, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      userId,
      meetingId || null,
      eventType,
      eventCategory,
      JSON.stringify(eventData || {}),
      sessionId || null,
      req.ip,
      req.get('User-Agent') || null
    ]);

    res.json({
      success: true,
      data: {
        message: 'Event tracked successfully',
        eventType,
        eventCategory,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to track event',
      },
    });
  }
});

export const getAdminStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  // Check if user has admin permissions
  const userQuery = await db.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );

  if (!userQuery.rows[0] || userQuery.rows[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin access required',
      },
    });
  }

  try {
    // Get system-wide statistics
    const statsQuery = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM meetings) as total_meetings,
        (SELECT COUNT(*) FROM meetings WHERE status = 'in_progress') as active_meetings,
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT SUM(actual_duration) FROM meetings WHERE actual_duration IS NOT NULL) as total_meeting_minutes
    `);

    // Get recent system analytics
    const recentAnalyticsQuery = await db.query(`
      SELECT * FROM system_analytics
      ORDER BY date DESC
      LIMIT 30
    `);

    // Get top users by meeting activity
    const topUsersQuery = await db.query(`
      SELECT
        u.id,
        u.display_name,
        u.email,
        ua.total_meetings,
        ua.total_meeting_time,
        ua.productivity_score
      FROM users u
      LEFT JOIN user_analytics ua ON u.id = ua.user_id
      WHERE u.is_active = true
      ORDER BY ua.total_meetings DESC NULLS LAST
      LIMIT 10
    `);

    // Get error rates and performance metrics
    const performanceQuery = await db.query(`
      SELECT
        event_type,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM analytics_events
      WHERE timestamp >= NOW() - INTERVAL '7 days'
        AND event_category = 'error'
      GROUP BY event_type, DATE_TRUNC('day', timestamp)
      ORDER BY date DESC
    `);

    const stats = statsQuery.rows[0];
    const recentAnalytics = recentAnalyticsQuery.rows;
    const topUsers = topUsersQuery.rows;
    const performance = performanceQuery.rows;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: parseInt(stats.total_users),
          activeUsers: parseInt(stats.active_users),
          totalMeetings: parseInt(stats.total_meetings),
          activeMeetings: parseInt(stats.active_meetings),
          totalOrganizations: parseInt(stats.total_organizations),
          totalMeetingMinutes: parseInt(stats.total_meeting_minutes || 0),
        },
        trends: recentAnalytics,
        topUsers,
        performance,
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date(),
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch admin statistics',
      },
    });
  }
});

export const getSystemHealth = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Test database connection
    const dbHealthQuery = await db.query('SELECT NOW() as timestamp');
    const dbHealth = dbHealthQuery.rows.length > 0;

    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Calculate health score based on various factors
    const healthScore = calculateSystemHealthScore(memoryUsage, uptime);

    res.json({
      success: true,
      data: {
        status: healthScore >= 0.8 ? 'healthy' : healthScore >= 0.6 ? 'warning' : 'critical',
        score: healthScore,
        components: {
          database: {
            status: dbHealth ? 'healthy' : 'critical',
            responseTime: dbHealth ? 'normal' : 'timeout',
          },
          memory: {
            status: memoryUsage.heapUsed / memoryUsage.heapTotal < 0.8 ? 'healthy' : 'warning',
            used: memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal * 100).toFixed(2),
          },
          uptime: {
            seconds: uptime,
            formatted: formatUptime(uptime),
          },
        },
        timestamp: new Date(),
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      data: {
        status: 'critical',
        error: 'Health check failed',
      },
      meta: {
        timestamp: new Date(),
      },
    });
  }
});

const calculateSystemHealthScore = (memory: NodeJS.MemoryUsage, uptime: number): number => {
  let score = 1.0;

  // Memory usage factor (reduce score if memory usage is high)
  const memoryUsageRatio = memory.heapUsed / memory.heapTotal;
  if (memoryUsageRatio > 0.9) score -= 0.3;
  else if (memoryUsageRatio > 0.8) score -= 0.2;
  else if (memoryUsageRatio > 0.7) score -= 0.1;

  // Uptime factor (reduce score if uptime is very low, indicating recent restarts)
  if (uptime < 300) score -= 0.2; // Less than 5 minutes
  else if (uptime < 3600) score -= 0.1; // Less than 1 hour

  return Math.max(0, Math.min(1, score));
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
