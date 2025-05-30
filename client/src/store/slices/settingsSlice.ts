import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  volume: number;
  microphoneGain: number;
}

interface VideoSettings {
  cameraDeviceId: string;
  resolution: '720p' | '1080p' | '4k';
  frameRate: 15 | 30 | 60;
  mirrorVideo: boolean;
  backgroundBlur: boolean;
  virtualBackground: string | null;
}

interface AISettings {
  transcriptionEnabled: boolean;
  translationEnabled: boolean;
  targetLanguage: string;
  sentimentAnalysis: boolean;
  topicDetection: boolean;
  actionItemExtraction: boolean;
  meetingSummary: boolean;
  realTimeInsights: boolean;
  confidenceThreshold: number;
}

interface PrivacySettings {
  shareAnalytics: boolean;
  recordingConsent: boolean;
  dataRetention: '30days' | '90days' | '1year' | 'forever';
  anonymizeTranscripts: boolean;
  shareWithTeam: boolean;
  exportPermissions: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  meetingReminders: boolean;
  actionItemReminders: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

interface IntegrationSettings {
  calendar: {
    enabled: boolean;
    provider: 'google' | 'outlook' | 'apple' | null;
    syncMeetings: boolean;
    createEvents: boolean;
  };
  crm: {
    enabled: boolean;
    provider: 'salesforce' | 'hubspot' | 'pipedrive' | null;
    autoSync: boolean;
    syncContacts: boolean;
  };
  storage: {
    enabled: boolean;
    provider: 'gdrive' | 'onedrive' | 'dropbox' | 's3' | null;
    autoBackup: boolean;
    retentionPeriod: string;
  };
  slack: {
    enabled: boolean;
    workspace: string | null;
    channelNotifications: boolean;
    summaryPosts: boolean;
  };
}

interface SettingsState {
  audio: AudioSettings;
  video: VideoSettings;
  ai: AISettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  isLoading: boolean;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
}

const initialState: SettingsState = {
  audio: {
    inputDeviceId: 'default',
    outputDeviceId: 'default',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    volume: 80,
    microphoneGain: 50,
  },
  video: {
    cameraDeviceId: 'default',
    resolution: '720p',
    frameRate: 30,
    mirrorVideo: true,
    backgroundBlur: false,
    virtualBackground: null,
  },
  ai: {
    transcriptionEnabled: true,
    translationEnabled: false,
    targetLanguage: 'en',
    sentimentAnalysis: true,
    topicDetection: true,
    actionItemExtraction: true,
    meetingSummary: true,
    realTimeInsights: true,
    confidenceThreshold: 0.8,
  },
  privacy: {
    shareAnalytics: true,
    recordingConsent: true,
    dataRetention: '1year',
    anonymizeTranscripts: false,
    shareWithTeam: true,
    exportPermissions: true,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    soundNotifications: true,
    meetingReminders: true,
    actionItemReminders: true,
    weeklyDigest: true,
    securityAlerts: true,
  },
  integrations: {
    calendar: {
      enabled: false,
      provider: null,
      syncMeetings: false,
      createEvents: false,
    },
    crm: {
      enabled: false,
      provider: null,
      autoSync: false,
      syncContacts: false,
    },
    storage: {
      enabled: false,
      provider: null,
      autoBackup: false,
      retentionPeriod: '1year',
    },
    slack: {
      enabled: false,
      workspace: null,
      channelNotifications: false,
      summaryPosts: false,
    },
  },
  isLoading: false,
  lastSaved: null,
  hasUnsavedChanges: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateAudioSettings: (state, action: PayloadAction<Partial<AudioSettings>>) => {
      state.audio = { ...state.audio, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateVideoSettings: (state, action: PayloadAction<Partial<VideoSettings>>) => {
      state.video = { ...state.video, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateAISettings: (state, action: PayloadAction<Partial<AISettings>>) => {
      state.ai = { ...state.ai, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<PrivacySettings>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateIntegrationSettings: (state, action: PayloadAction<Partial<IntegrationSettings>>) => {
      state.integrations = { ...state.integrations, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    saveSettingsStart: (state) => {
      state.isLoading = true;
    },
    saveSettingsSuccess: (state) => {
      state.isLoading = false;
      state.hasUnsavedChanges = false;
      state.lastSaved = new Date().toISOString();
    },
    saveSettingsFailure: (state) => {
      state.isLoading = false;
    },
    resetSettings: (state) => {
      return { ...initialState };
    },
    loadSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload, isLoading: false, hasUnsavedChanges: false };
    },
  },
});

export const {
  updateAudioSettings,
  updateVideoSettings,
  updateAISettings,
  updatePrivacySettings,
  updateNotificationSettings,
  updateIntegrationSettings,
  saveSettingsStart,
  saveSettingsSuccess,
  saveSettingsFailure,
  resetSettings,
  loadSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
