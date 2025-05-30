export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'moderator' | 'participant';
  permissions: string[];
  organizationId?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  participants: Participant[];
  agenda: string[];
  tags: string[];
  isRecording: boolean;
  recordingUrl?: string;
  transcriptUrl?: string;
  summary?: string;
  actionItems: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  userId: string;
  meetingId: string;
  name: string;
  email: string;
  role: 'host' | 'moderator' | 'participant';
  isOnline: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
  leftAt?: Date;
  lastActive: Date;
}

export interface Message {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'ai_response' | 'system' | 'file' | 'action_item';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transcript {
  id: string;
  meetingId: string;
  userId: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  speakerId?: string;
  language: string;
  createdAt: Date;
}

export interface AIInsight {
  id: string;
  meetingId: string;
  type: 'sentiment' | 'topic' | 'summary' | 'action_item' | 'key_point';
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Integration {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft' | 'slack' | 'salesforce' | 'hubspot';
  isEnabled: boolean;
  config: Record<string, any>;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'meeting_reminder' | 'action_item_due' | 'system' | 'integration';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface Analytics {
  id: string;
  meetingId?: string;
  userId?: string;
  organizationId?: string;
  metric: string;
  value: number;
  dimensions: Record<string, any>;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'message' | 'audio' | 'video' | 'screen_share' | 'ai_response';
  payload: any;
  timestamp: Date;
  userId: string;
  meetingId: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: Date;
  };
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  organizationId?: string;
  iat: number;
  exp: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface AIConfig {
  huggingface: {
    apiKey: string;
    models: {
      transcription: string;
      summarization: string;
      sentiment: string;
      translation: string;
    };
  };
  openai?: {
    apiKey: string;
    model: string;
  };
}

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwtSecret: string;
  jwtExpiresIn: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIConfig;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}
