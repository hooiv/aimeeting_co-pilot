import { Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { Meeting, Participant, ActionItem } from '@/types';
import { websocketService } from '@/services/websocketService';
import { integrationService } from '@/services/integrationService';

// This would be injected in a real application
let db: Pool;

export const setDatabase = (database: Pool) => {
  db = database;
};

// Get all meetings for the authenticated user
export const getMeetings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT m.*,
           COUNT(p.id) as participant_count,
           COUNT(ai.id) as insight_count
    FROM meetings m
    LEFT JOIN participants p ON m.id = p.meeting_id
    LEFT JOIN ai_insights ai ON m.id = ai.meeting_id
    WHERE m.host_id = $1
  `;

  const queryParams: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    query += ` AND m.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND m.start_time >= $${paramIndex}`;
    queryParams.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND m.start_time <= $${paramIndex}`;
    queryParams.push(endDate);
    paramIndex++;
  }

  query += `
    GROUP BY m.id
    ORDER BY m.start_time DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(DISTINCT m.id) as total
    FROM meetings m
    WHERE m.host_id = $1
  `;

  const countParams = [userId];
  let countParamIndex = 2;

  if (status) {
    countQuery += ` AND m.status = $${countParamIndex}`;
    countParams.push(status);
    countParamIndex++;
  }

  if (startDate) {
    countQuery += ` AND m.start_time >= $${countParamIndex}`;
    countParams.push(startDate);
    countParamIndex++;
  }

  if (endDate) {
    countQuery += ` AND m.start_time <= $${countParamIndex}`;
    countParams.push(endDate);
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total);

  res.json({
    success: true,
    data: {
      meetings: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Get a specific meeting by ID
export const getMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Get meeting details
  const meetingQuery = `
    SELECT m.*, u.display_name as host_name
    FROM meetings m
    JOIN users u ON m.host_id = u.id
    WHERE m.id = $1
  `;

  const meetingResult = await db.query(meetingQuery, [id]);

  if (meetingResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MEETING_NOT_FOUND',
        message: 'Meeting not found',
      },
    });
  }

  const meeting = meetingResult.rows[0];

  // Check if user has access to this meeting
  const participantQuery = `
    SELECT * FROM participants
    WHERE meeting_id = $1 AND user_id = $2
  `;

  const participantResult = await db.query(participantQuery, [id, userId]);
  const isHost = meeting.host_id === userId;
  const isParticipant = participantResult.rows.length > 0;

  if (!isHost && !isParticipant) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You do not have access to this meeting',
      },
    });
  }

  // Get participants
  const participantsQuery = `
    SELECT p.*, u.display_name, u.email, u.photo_url
    FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE p.meeting_id = $1
    ORDER BY p.joined_at
  `;

  const participantsResult = await db.query(participantsQuery, [id]);

  // Get action items
  const actionItemsQuery = `
    SELECT ai.*,
           u1.display_name as assigned_to_name,
           u2.display_name as assigned_by_name
    FROM action_items ai
    JOIN users u1 ON ai.assigned_to = u1.id
    JOIN users u2 ON ai.assigned_by = u2.id
    WHERE ai.meeting_id = $1
    ORDER BY ai.created_at
  `;

  const actionItemsResult = await db.query(actionItemsQuery, [id]);

  // Get AI insights
  const insightsQuery = `
    SELECT * FROM ai_insights
    WHERE meeting_id = $1
    ORDER BY created_at
  `;

  const insightsResult = await db.query(insightsQuery, [id]);

  // Get transcripts
  const transcriptsQuery = `
    SELECT t.*, u.display_name as speaker_name
    FROM transcripts t
    JOIN users u ON t.user_id = u.id
    WHERE t.meeting_id = $1
    ORDER BY t.created_at
  `;

  const transcriptsResult = await db.query(transcriptsQuery, [id]);

  res.json({
    success: true,
    data: {
      meeting: {
        ...meeting,
        participants: participantsResult.rows,
        actionItems: actionItemsResult.rows,
        insights: insightsResult.rows,
        transcripts: transcriptsResult.rows,
      },
      userRole: isHost ? 'host' : 'participant',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Create a new meeting
export const createMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const {
    title,
    description,
    startTime,
    agenda = [],
    tags = [],
    inviteEmails = [],
    integrations = {},
  } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Create the meeting
    const meetingQuery = `
      INSERT INTO meetings (title, description, host_id, start_time, agenda, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const meetingResult = await client.query(meetingQuery, [
      title,
      description,
      userId,
      startTime,
      agenda,
      tags,
    ]);

    const meeting = meetingResult.rows[0];

    // Add host as participant
    const hostParticipantQuery = `
      INSERT INTO participants (user_id, meeting_id, role)
      VALUES ($1, $2, 'host')
      RETURNING *
    `;

    await client.query(hostParticipantQuery, [userId, meeting.id]);

    // Invite participants if emails provided
    if (inviteEmails.length > 0) {
      for (const email of inviteEmails) {
        // Check if user exists
        const userQuery = `SELECT id FROM users WHERE email = $1`;
        const userResult = await client.query(userQuery, [email]);

        if (userResult.rows.length > 0) {
          const participantUserId = userResult.rows[0].id;

          // Add as participant
          const participantQuery = `
            INSERT INTO participants (user_id, meeting_id, role)
            VALUES ($1, $2, 'participant')
            ON CONFLICT (user_id, meeting_id) DO NOTHING
          `;

          await client.query(participantQuery, [participantUserId, meeting.id]);
        }
      }
    }

    // Handle integrations
    if (integrations.calendar && integrations.calendar.enabled) {
      try {
        await handleCalendarIntegration(meeting, integrations.calendar);
      } catch (error) {
        console.error('Calendar integration failed:', error);
        // Don't fail the meeting creation if integration fails
      }
    }

    if (integrations.slack && integrations.slack.enabled) {
      try {
        await handleSlackIntegration(meeting, integrations.slack);
      } catch (error) {
        console.error('Slack integration failed:', error);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        meeting,
        joinUrl: `${req.protocol}://${req.get('host')}/meeting/${meeting.id}`,
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
});

// Update a meeting
export const updateMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const updates = req.body;

  // Check if user is the host
  const hostQuery = `SELECT * FROM meetings WHERE id = $1 AND host_id = $2`;
  const hostResult = await db.query(hostQuery, [id, userId]);

  if (hostResult.rows.length === 0) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Only the meeting host can update the meeting',
      },
    });
  }

  // Build update query dynamically
  const allowedFields = ['title', 'description', 'start_time', 'end_time', 'status', 'agenda', 'tags'];
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex}`);
      updateValues.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_VALID_UPDATES',
        message: 'No valid fields to update',
      },
    });
  }

  updateFields.push(`updated_at = $${paramIndex}`);
  updateValues.push(new Date());
  updateValues.push(id);

  const updateQuery = `
    UPDATE meetings
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await db.query(updateQuery, updateValues);

  // Notify participants of the update
  if (websocketService) {
    websocketService.sendToMeeting(id, 'meeting-updated', {
      meeting: result.rows[0],
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: {
      meeting: result.rows[0],
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Delete a meeting
export const deleteMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if user is the host
  const hostQuery = `SELECT * FROM meetings WHERE id = $1 AND host_id = $2`;
  const hostResult = await db.query(hostQuery, [id, userId]);

  if (hostResult.rows.length === 0) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Only the meeting host can delete the meeting',
      },
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Delete related records first (due to foreign key constraints)
    await client.query('DELETE FROM ai_insights WHERE meeting_id = $1', [id]);
    await client.query('DELETE FROM transcripts WHERE meeting_id = $1', [id]);
    await client.query('DELETE FROM action_items WHERE meeting_id = $1', [id]);
    await client.query('DELETE FROM participants WHERE meeting_id = $1', [id]);

    // Delete the meeting
    await client.query('DELETE FROM meetings WHERE id = $1', [id]);

    await client.query('COMMIT');

    // Notify participants that the meeting was deleted
    if (websocketService) {
      websocketService.sendToMeeting(id, 'meeting-deleted', {
        meetingId: id,
        deletedBy: userId,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Meeting deleted successfully',
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
});

// Join a meeting
export const joinMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check if meeting exists and is active
  const meetingQuery = `
    SELECT * FROM meetings
    WHERE id = $1 AND status IN ('scheduled', 'active')
  `;

  const meetingResult = await db.query(meetingQuery, [id]);

  if (meetingResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MEETING_NOT_FOUND_OR_INACTIVE',
        message: 'Meeting not found or not active',
      },
    });
  }

  // Add user as participant if not already
  const participantQuery = `
    INSERT INTO participants (user_id, meeting_id, role, is_online)
    VALUES ($1, $2, 'participant', true)
    ON CONFLICT (user_id, meeting_id)
    DO UPDATE SET is_online = true, last_active = NOW()
    RETURNING *
  `;

  const participantResult = await db.query(participantQuery, [userId, id]);

  // Update meeting status to active if it was scheduled
  if (meetingResult.rows[0].status === 'scheduled') {
    await db.query(
      'UPDATE meetings SET status = $1 WHERE id = $2',
      ['active', id]
    );
  }

  res.json({
    success: true,
    data: {
      meeting: meetingResult.rows[0],
      participant: participantResult.rows[0],
      joinUrl: `${req.protocol}://${req.get('host')}/meeting/${id}`,
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Leave a meeting
export const leaveMeeting = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Update participant status
  const updateQuery = `
    UPDATE participants
    SET is_online = false, left_at = NOW()
    WHERE meeting_id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(updateQuery, [id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PARTICIPANT_NOT_FOUND',
        message: 'You are not a participant in this meeting',
      },
    });
  }

  res.json({
    success: true,
    data: {
      message: 'Left meeting successfully',
      participant: result.rows[0],
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Additional meeting methods
export const getParticipants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      participants: [],
      message: 'Participants management not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const addParticipant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Add participant not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const removeParticipant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Remove participant not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const updateParticipant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Update participant not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const getActionItems = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      actionItems: [],
      message: 'Action items not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const createActionItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Create action item not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const updateActionItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Update action item not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const deleteActionItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Delete action item not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const searchMeetings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      meetings: [],
      message: 'Meeting search not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const searchTranscripts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      transcripts: [],
      message: 'Transcript search not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const uploadAttachment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'File upload not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const getAdminMeetings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      meetings: [],
      message: 'Admin meetings not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const exportTranscript = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Transcript export not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const exportSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Summary export not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

export const exportActionItems = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Action items export not implemented yet',
    },
    meta: {
      timestamp: new Date(),
    },
  });
});

// Helper functions for integrations
async function handleCalendarIntegration(meeting: any, calendarConfig: any) {
  if (calendarConfig.provider === 'google' && calendarConfig.accessToken) {
    await integrationService.createGoogleCalendarEvent(calendarConfig.accessToken, {
      title: meeting.title,
      description: meeting.description,
      startTime: new Date(meeting.start_time),
      endTime: new Date(meeting.end_time || new Date(meeting.start_time).getTime() + 3600000), // 1 hour default
      attendees: [], // Would be populated from inviteEmails
    });
  }
}

async function handleSlackIntegration(meeting: any, slackConfig: any) {
  if (slackConfig.accessToken && slackConfig.channel) {
    await integrationService.sendSlackMessage(slackConfig.accessToken, {
      channel: slackConfig.channel,
      text: `📅 New meeting scheduled: *${meeting.title}*\n🕐 ${new Date(meeting.start_time).toLocaleString()}\n🔗 Join: ${process.env.CLIENT_URL}/meeting/${meeting.id}`,
    });
  }
}
