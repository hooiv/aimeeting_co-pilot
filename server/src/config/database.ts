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
    // Create extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Create users table with enhanced profile fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        photo_url TEXT,
        bio TEXT,
        title VARCHAR(255),
        company VARCHAR(255),
        department VARCHAR(255),
        phone VARCHAR(50),
        timezone VARCHAR(100) DEFAULT 'UTC',
        language VARCHAR(10) DEFAULT 'en',
        role VARCHAR(50) NOT NULL DEFAULT 'participant',
        permissions TEXT[] DEFAULT '{}',
        organization_id UUID,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP WITH TIME ZONE,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_profiles table for extended profile information
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avatar_url TEXT,
        cover_image_url TEXT,
        social_links JSONB DEFAULT '{}',
        skills TEXT[],
        interests TEXT[],
        location VARCHAR(255),
        website VARCHAR(255),
        linkedin_url VARCHAR(255),
        twitter_url VARCHAR(255),
        github_url VARCHAR(255),
        notification_preferences JSONB DEFAULT '{}',
        privacy_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Create user_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        audio_settings JSONB DEFAULT '{}',
        video_settings JSONB DEFAULT '{}',
        ai_settings JSONB DEFAULT '{}',
        privacy_settings JSONB DEFAULT '{}',
        notification_settings JSONB DEFAULT '{}',
        integration_settings JSONB DEFAULT '{}',
        theme VARCHAR(20) DEFAULT 'light',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Create organizations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255),
        logo_url TEXT,
        description TEXT,
        settings JSONB DEFAULT '{}',
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'active',
        max_users INTEGER DEFAULT 10,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create meetings table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id UUID NOT NULL REFERENCES users(id),
        organization_id UUID REFERENCES organizations(id),
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        type VARCHAR(50) DEFAULT 'video_call',
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        scheduled_duration INTEGER,
        actual_duration INTEGER,
        timezone VARCHAR(100) DEFAULT 'UTC',
        agenda TEXT[],
        tags TEXT[],
        is_recording BOOLEAN DEFAULT FALSE,
        recording_url TEXT,
        transcript_url TEXT,
        summary TEXT,
        ai_insights JSONB DEFAULT '{}',
        participant_count INTEGER DEFAULT 0,
        max_participants INTEGER DEFAULT 100,
        meeting_url VARCHAR(500),
        password VARCHAR(255),
        waiting_room BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        role VARCHAR(50) DEFAULT 'participant',
        status VARCHAR(50) DEFAULT 'invited',
        joined_at TIMESTAMP WITH TIME ZONE,
        left_at TIMESTAMP WITH TIME ZONE,
        duration INTEGER DEFAULT 0,
        is_muted BOOLEAN DEFAULT FALSE,
        is_video_enabled BOOLEAN DEFAULT TRUE,
        is_screen_sharing BOOLEAN DEFAULT FALSE,
        connection_quality VARCHAR(20) DEFAULT 'good',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(meeting_id, user_id)
      );
    `);

    // Create analytics_events table for tracking user interactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        meeting_id UUID REFERENCES meetings(id),
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(50) NOT NULL,
        event_data JSONB DEFAULT '{}',
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create meeting_analytics table for aggregated meeting data
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        total_participants INTEGER DEFAULT 0,
        peak_participants INTEGER DEFAULT 0,
        average_duration INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        total_reactions INTEGER DEFAULT 0,
        screen_share_duration INTEGER DEFAULT 0,
        recording_duration INTEGER DEFAULT 0,
        ai_insights_generated INTEGER DEFAULT 0,
        sentiment_score DECIMAL(3,2),
        engagement_score DECIMAL(3,2),
        quality_score DECIMAL(3,2),
        technical_issues INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(meeting_id)
      );
    `);

    // Create user_analytics table for aggregated user data
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_meetings INTEGER DEFAULT 0,
        total_meeting_time INTEGER DEFAULT 0,
        meetings_hosted INTEGER DEFAULT 0,
        meetings_attended INTEGER DEFAULT 0,
        average_meeting_duration INTEGER DEFAULT 0,
        total_messages_sent INTEGER DEFAULT 0,
        total_reactions_given INTEGER DEFAULT 0,
        screen_shares_initiated INTEGER DEFAULT 0,
        recordings_created INTEGER DEFAULT 0,
        ai_features_used INTEGER DEFAULT 0,
        last_activity_date DATE,
        streak_days INTEGER DEFAULT 0,
        productivity_score DECIMAL(3,2),
        engagement_score DECIMAL(3,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Create system_analytics table for overall platform metrics
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        total_users INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        new_users INTEGER DEFAULT 0,
        total_meetings INTEGER DEFAULT 0,
        total_meeting_minutes INTEGER DEFAULT 0,
        total_recordings INTEGER DEFAULT 0,
        total_ai_requests INTEGER DEFAULT 0,
        average_meeting_duration INTEGER DEFAULT 0,
        system_uptime DECIMAL(5,2),
        error_rate DECIMAL(5,4),
        response_time_avg INTEGER,
        storage_used BIGINT DEFAULT 0,
        bandwidth_used BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(date)
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
      CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
      CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_meeting ON analytics_events(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date);
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};
