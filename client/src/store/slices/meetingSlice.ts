import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'host' | 'moderator' | 'participant';
  isOnline: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
  lastActive: string;
  isSpeaking?: boolean;
  isHandRaised?: boolean;
  speakingTime?: number;
  networkQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  photoUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'ai_response' | 'system' | 'file' | 'action_item';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TranscriptEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  content: string;
  timestamp: string;
  confidence: number;
  isFinal: boolean;
}

export interface AIInsight {
  id: string;
  type: 'sentiment' | 'topic' | 'summary' | 'action_item' | 'key_point' | 'recommendation';
  title: string;
  content: string;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  participants: Participant[];
  agenda: string[];
  tags: string[];
  isRecording: boolean;
  recordingUrl?: string;
  transcriptUrl?: string;
  summary?: string;
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

interface MeetingState {
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  messages: Message[];
  transcript: TranscriptEntry[];
  insights: AIInsight[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  audioLevel: number;
  isRecording: boolean;
  transcriptionEnabled: boolean;
  aiInsights: {
    sentiment: { label: string; score: number } | null;
    topics: string[];
    summary: string | null;
    keyPoints: string[];
    nextSteps: string[];
  };
  realTimeAnalytics: {
    speakingTime: Record<string, number>;
    messageCount: Record<string, number>;
    engagementScore: number;
    participationRate: number;
  };
}

const initialState: MeetingState = {
  currentMeeting: null,
  meetings: [],
  messages: [],
  transcript: [],
  insights: [],
  isConnected: false,
  isLoading: false,
  error: null,
  audioLevel: 0,
  isRecording: false,
  transcriptionEnabled: true,
  aiInsights: {
    sentiment: null,
    topics: [],
    summary: null,
    keyPoints: [],
    nextSteps: [],
  },
  realTimeAnalytics: {
    speakingTime: {},
    messageCount: {},
    engagementScore: 0,
    participationRate: 0,
  },
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action: PayloadAction<Meeting>) => {
      state.currentMeeting = action.payload;
    },
    updateMeeting: (state, action: PayloadAction<Partial<Meeting>>) => {
      if (state.currentMeeting) {
        state.currentMeeting = { ...state.currentMeeting, ...action.payload };
      }
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      if (state.currentMeeting) {
        state.currentMeeting.participants.push(action.payload);
      }
    },
    updateParticipant: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Participant> }>
    ) => {
      if (state.currentMeeting) {
        const index = state.currentMeeting.participants.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.currentMeeting.participants[index] = {
            ...state.currentMeeting.participants[index],
            ...action.payload.updates,
          };
        }
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      if (state.currentMeeting) {
        state.currentMeeting.participants = state.currentMeeting.participants.filter(
          (p) => p.id !== action.payload
        );
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<Message> }>) => {
      const index = state.messages.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload.updates };
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = action.payload;
    },
    setRecordingStatus: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setTranscriptionEnabled: (state, action: PayloadAction<boolean>) => {
      state.transcriptionEnabled = action.payload;
    },
    updateAiInsights: (state, action: PayloadAction<Partial<MeetingState['aiInsights']>>) => {
      state.aiInsights = { ...state.aiInsights, ...action.payload };
    },
    updateRealTimeAnalytics: (
      state,
      action: PayloadAction<Partial<MeetingState['realTimeAnalytics']>>
    ) => {
      state.realTimeAnalytics = { ...state.realTimeAnalytics, ...action.payload };
    },
    addActionItem: (state, action: PayloadAction<ActionItem>) => {
      if (state.currentMeeting) {
        state.currentMeeting.actionItems.push(action.payload);
      }
    },
    updateActionItem: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ActionItem> }>
    ) => {
      if (state.currentMeeting) {
        const index = state.currentMeeting.actionItems.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.currentMeeting.actionItems[index] = {
            ...state.currentMeeting.actionItems[index],
            ...action.payload.updates,
          };
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addTranscriptEntry: (state, action: PayloadAction<TranscriptEntry>) => {
      state.transcript.push(action.payload);
    },
    updateTranscriptEntry: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TranscriptEntry> }>
    ) => {
      const index = state.transcript.findIndex((entry) => entry.id === action.payload.id);
      if (index !== -1) {
        state.transcript[index] = { ...state.transcript[index], ...action.payload.updates };
      }
    },
    clearTranscript: (state) => {
      state.transcript = [];
    },
    addAIInsight: (state, action: PayloadAction<AIInsight>) => {
      state.insights.push(action.payload);
    },
    updateAIInsight: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<AIInsight> }>
    ) => {
      const index = state.insights.findIndex((insight) => insight.id === action.payload.id);
      if (index !== -1) {
        state.insights[index] = { ...state.insights[index], ...action.payload.updates };
      }
    },
    clearAIInsights: (state) => {
      state.insights = [];
    },
  },
});

export const {
  setCurrentMeeting,
  updateMeeting,
  addParticipant,
  updateParticipant,
  removeParticipant,
  addMessage,
  updateMessage,
  clearMessages,
  setConnectionStatus,
  setAudioLevel,
  setRecordingStatus,
  setTranscriptionEnabled,
  updateAiInsights,
  updateRealTimeAnalytics,
  addActionItem,
  updateActionItem,
  setLoading,
  setError,
  addTranscriptEntry,
  updateTranscriptEntry,
  clearTranscript,
  addAIInsight,
  updateAIInsight,
  clearAIInsights,
} = meetingSlice.actions;

export default meetingSlice.reducer;
