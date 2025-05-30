import { Pool } from 'pg';
import { DatabaseConfig } from '@/types';

export const createDatabasePool = (config: DatabaseConfig): Pool => {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    min: config.pool?.min || 2,
    max: config.pool?.max || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
};

export const initializeDatabase = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        photo_url TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'participant',
        permissions TEXT[] DEFAULT '{}',
        organization_id UUID,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        agenda TEXT[],
        tags TEXT[],
        is_recording BOOLEAN DEFAULT FALSE,
        recording_url TEXT,
        transcript_url TEXT,
        summary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        meeting_id UUID NOT NULL REFERENCES meetings(id),
        role VARCHAR(50) NOT NULL DEFAULT 'participant',
        is_online BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        is_video_on BOOLEAN DEFAULT FALSE,
        is_screen_sharing BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        left_at TIMESTAMP WITH TIME ZONE,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, meeting_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id),
        user_id UUID NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        confidence DECIMAL(3,2),
        start_time INTEGER,
        end_time INTEGER,
        speaker_id UUID,
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS action_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to UUID NOT NULL REFERENCES users(id),
        assigned_by UUID NOT NULL REFERENCES users(id),
        due_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id),
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        confidence DECIMAL(3,2),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        provider VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        config JSONB NOT NULL,
        last_sync TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, provider)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID REFERENCES meetings(id),
        user_id UUID REFERENCES users(id),
        organization_id UUID,
        metric VARCHAR(100) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        dimensions JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
      CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_meeting_id ON ai_insights(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_meeting_id ON analytics(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};
