import { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Database connection (this should be injected in a real app)
let db: Pool;

export const setDatabase = (database: Pool) => {
  db = database;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user!.userId;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadAvatarMiddleware = upload.single('avatar');

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    // Get user basic info
    const userQuery = await db.query(`
      SELECT
        u.*,
        up.avatar_url,
        up.cover_image_url,
        up.social_links,
        up.skills,
        up.interests,
        up.location,
        up.website,
        up.linkedin_url,
        up.twitter_url,
        up.github_url,
        up.notification_preferences,
        up.privacy_settings
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const user = userQuery.rows[0];

    // Get user analytics summary
    const analyticsQuery = await db.query(
      'SELECT * FROM user_analytics WHERE user_id = $1',
      [userId]
    );

    const analytics = analyticsQuery.rows[0] || {};

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          firstName: user.first_name,
          lastName: user.last_name,
          photoUrl: user.photo_url,
          bio: user.bio,
          title: user.title,
          company: user.company,
          department: user.department,
          phone: user.phone,
          timezone: user.timezone,
          language: user.language,
          role: user.role,
          permissions: user.permissions,
          organizationId: user.organization_id,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          lastActive: user.last_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        profile: {
          avatarUrl: user.avatar_url,
          coverImageUrl: user.cover_image_url,
          socialLinks: user.social_links || {},
          skills: user.skills || [],
          interests: user.interests || [],
          location: user.location,
          website: user.website,
          linkedinUrl: user.linkedin_url,
          twitterUrl: user.twitter_url,
          githubUrl: user.github_url,
          notificationPreferences: user.notification_preferences || {},
          privacySettings: user.privacy_settings || {},
        },
        analytics: {
          totalMeetings: analytics.total_meetings || 0,
          totalMeetingTime: analytics.total_meeting_time || 0,
          meetingsHosted: analytics.meetings_hosted || 0,
          meetingsAttended: analytics.meetings_attended || 0,
          productivityScore: analytics.productivity_score,
          engagementScore: analytics.engagement_score,
          streakDays: analytics.streak_days || 0,
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user profile',
      },
    });
  }
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const {
    displayName,
    firstName,
    lastName,
    bio,
    title,
    company,
    department,
    phone,
    timezone,
    language,
    skills,
    interests,
    location,
    website,
    linkedinUrl,
    twitterUrl,
    githubUrl,
    socialLinks,
    notificationPreferences,
    privacySettings,
  } = req.body;

  try {
    // Start transaction
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Update users table
      await client.query(`
        UPDATE users
        SET
          display_name = COALESCE($1, display_name),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          bio = COALESCE($4, bio),
          title = COALESCE($5, title),
          company = COALESCE($6, company),
          department = COALESCE($7, department),
          phone = COALESCE($8, phone),
          timezone = COALESCE($9, timezone),
          language = COALESCE($10, language),
          updated_at = NOW()
        WHERE id = $11
      `, [
        displayName, firstName, lastName, bio, title, company,
        department, phone, timezone, language, userId
      ]);

      // Update or insert user_profiles
      await client.query(`
        INSERT INTO user_profiles (
          user_id, skills, interests, location, website,
          linkedin_url, twitter_url, github_url, social_links,
          notification_preferences, privacy_settings, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          skills = COALESCE($2, user_profiles.skills),
          interests = COALESCE($3, user_profiles.interests),
          location = COALESCE($4, user_profiles.location),
          website = COALESCE($5, user_profiles.website),
          linkedin_url = COALESCE($6, user_profiles.linkedin_url),
          twitter_url = COALESCE($7, user_profiles.twitter_url),
          github_url = COALESCE($8, user_profiles.github_url),
          social_links = COALESCE($9, user_profiles.social_links),
          notification_preferences = COALESCE($10, user_profiles.notification_preferences),
          privacy_settings = COALESCE($11, user_profiles.privacy_settings),
          updated_at = NOW()
      `, [
        userId, skills, interests, location, website,
        linkedinUrl, twitterUrl, githubUrl,
        JSON.stringify(socialLinks || {}),
        JSON.stringify(notificationPreferences || {}),
        JSON.stringify(privacySettings || {})
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          message: 'Profile updated successfully',
        },
        meta: {
          timestamp: new Date(),
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update profile',
      },
    });
  }
});

export const uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No avatar file uploaded',
      },
    });
  }

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar URL in database
    await db.query(`
      INSERT INTO user_profiles (user_id, avatar_url, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET avatar_url = $2, updated_at = NOW()
    `, [userId, avatarUrl]);

    // Also update the photo_url in users table for backward compatibility
    await db.query(
      'UPDATE users SET photo_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      success: true,
      data: {
        avatarUrl,
        message: 'Avatar uploaded successfully',
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to upload avatar',
      },
    });
  }
});

export const getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    // Get user settings
    const settingsQuery = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    // Get user profile settings
    const profileQuery = await db.query(`
      SELECT
        notification_preferences,
        privacy_settings
      FROM user_profiles
      WHERE user_id = $1
    `, [userId]);

    const settings = settingsQuery.rows[0] || {};
    const profile = profileQuery.rows[0] || {};

    res.json({
      success: true,
      data: {
        settings: {
          audio: settings.audio_settings || {
            inputDevice: 'default',
            outputDevice: 'default',
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: settings.video_settings || {
            camera: 'default',
            resolution: '720p',
            frameRate: 30,
            backgroundBlur: false,
            virtualBackground: null,
          },
          ai: settings.ai_settings || {
            transcriptionEnabled: true,
            summaryEnabled: true,
            actionItemsEnabled: true,
            sentimentAnalysis: false,
            languageDetection: true,
          },
          privacy: settings.privacy_settings || profile.privacy_settings || {
            profileVisibility: 'organization',
            showOnlineStatus: true,
            allowDirectMessages: true,
            shareAnalytics: false,
          },
          notifications: settings.notification_settings || profile.notification_preferences || {
            email: {
              meetingInvites: true,
              meetingReminders: true,
              summaries: true,
              actionItems: true,
            },
            push: {
              meetingStarted: true,
              mentionedInChat: true,
              actionItemAssigned: true,
            },
            inApp: {
              allNotifications: true,
              soundEnabled: true,
            },
          },
          integrations: settings.integration_settings || {
            calendar: {
              provider: null,
              syncEnabled: false,
            },
            storage: {
              provider: null,
              autoUpload: false,
            },
            productivity: {
              slackEnabled: false,
              teamsEnabled: false,
              notionEnabled: false,
            },
          },
          theme: settings.theme || 'light',
        },
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch settings',
      },
    });
  }
});

export const updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const {
    audio,
    video,
    ai,
    privacy,
    notifications,
    integrations,
    theme,
  } = req.body;

  try {
    // Start transaction
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Update user_settings table
      await client.query(`
        INSERT INTO user_settings (
          user_id, audio_settings, video_settings, ai_settings,
          privacy_settings, notification_settings, integration_settings,
          theme, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          audio_settings = COALESCE($2, user_settings.audio_settings),
          video_settings = COALESCE($3, user_settings.video_settings),
          ai_settings = COALESCE($4, user_settings.ai_settings),
          privacy_settings = COALESCE($5, user_settings.privacy_settings),
          notification_settings = COALESCE($6, user_settings.notification_settings),
          integration_settings = COALESCE($7, user_settings.integration_settings),
          theme = COALESCE($8, user_settings.theme),
          updated_at = NOW()
      `, [
        userId,
        JSON.stringify(audio),
        JSON.stringify(video),
        JSON.stringify(ai),
        JSON.stringify(privacy),
        JSON.stringify(notifications),
        JSON.stringify(integrations),
        theme
      ]);

      // Also update profile table for privacy and notification preferences
      if (privacy || notifications) {
        await client.query(`
          INSERT INTO user_profiles (
            user_id, privacy_settings, notification_preferences, updated_at
          ) VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            privacy_settings = COALESCE($2, user_profiles.privacy_settings),
            notification_preferences = COALESCE($3, user_profiles.notification_preferences),
            updated_at = NOW()
        `, [
          userId,
          JSON.stringify(privacy),
          JSON.stringify(notifications)
        ]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          message: 'Settings updated successfully',
        },
        meta: {
          timestamp: new Date(),
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update settings',
      },
    });
  }
});

export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }

    // Get notifications
    const notificationsQuery = await db.query(`
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, Number(limit), offset]);

    // Get total count
    const countQuery = await db.query(`
      SELECT COUNT(*) as total FROM notifications ${whereClause}
    `, params);

    // Get unread count
    const unreadCountQuery = await db.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    const notifications = notificationsQuery.rows;
    const total = parseInt(countQuery.rows[0].total);
    const unreadCount = parseInt(unreadCountQuery.rows[0].unread);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        unreadCount,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch notifications',
      },
    });
  }
});

export const markNotificationRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id: notificationId } = req.params;

  try {
    const result = await db.query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        notification: result.rows[0],
        message: 'Notification marked as read',
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to mark notification as read',
      },
    });
  }
});

export const markAllNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const result = await db.query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      data: {
        message: `${result.rowCount} notifications marked as read`,
        count: result.rowCount,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to mark all notifications as read',
      },
    });
  }
});