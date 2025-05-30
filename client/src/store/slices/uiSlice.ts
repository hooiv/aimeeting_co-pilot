import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  timestamp: string;
}

interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  participantsPanelOpen: boolean;
  settingsModalOpen: boolean;
  fullscreenMode: boolean;
  notifications: Notification[];
  loading: {
    global: boolean;
    components: Record<string, boolean>;
  };
  modals: {
    createMeeting: boolean;
    joinMeeting: boolean;
    settings: boolean;
    profile: boolean;
    feedback: boolean;
    help: boolean;
  };
  layout: {
    chatWidth: number;
    participantsWidth: number;
    videoGridCols: number;
    videoGridRows: number;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
    screenReaderEnabled: boolean;
  };
  preferences: {
    autoJoinAudio: boolean;
    autoJoinVideo: boolean;
    showCaptions: boolean;
    showTranscript: boolean;
    enableNotifications: boolean;
    soundEnabled: boolean;
    keyboardShortcuts: boolean;
  };
}

const initialState: UIState = {
  theme: 'auto',
  language: 'en',
  sidebarOpen: true,
  chatPanelOpen: true,
  participantsPanelOpen: false,
  settingsModalOpen: false,
  fullscreenMode: false,
  notifications: [],
  loading: {
    global: false,
    components: {},
  },
  modals: {
    createMeeting: false,
    joinMeeting: false,
    settings: false,
    profile: false,
    feedback: false,
    help: false,
  },
  layout: {
    chatWidth: 320,
    participantsWidth: 280,
    videoGridCols: 2,
    videoGridRows: 2,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    screenReaderEnabled: false,
  },
  preferences: {
    autoJoinAudio: true,
    autoJoinVideo: true,
    showCaptions: true,
    showTranscript: true,
    enableNotifications: true,
    soundEnabled: true,
    keyboardShortcuts: true,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleChatPanel: (state) => {
      state.chatPanelOpen = !state.chatPanelOpen;
    },
    setChatPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.chatPanelOpen = action.payload;
    },
    toggleParticipantsPanel: (state) => {
      state.participantsPanelOpen = !state.participantsPanelOpen;
    },
    setParticipantsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.participantsPanelOpen = action.payload;
    },
    toggleFullscreen: (state) => {
      state.fullscreenMode = !state.fullscreenMode;
    },
    setFullscreenMode: (state, action: PayloadAction<boolean>) => {
      state.fullscreenMode = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setComponentLoading: (
      state,
      action: PayloadAction<{ component: string; loading: boolean }>
    ) => {
      state.loading.components[action.payload.component] = action.payload.loading;
    },
    updateLayout: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload };
    },
    updateAccessibility: (state, action: PayloadAction<Partial<UIState['accessibility']>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
    updatePreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
  },
});

export const {
  setTheme,
  setLanguage,
  toggleSidebar,
  setSidebarOpen,
  toggleChatPanel,
  setChatPanelOpen,
  toggleParticipantsPanel,
  setParticipantsPanelOpen,
  toggleFullscreen,
  setFullscreenMode,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setComponentLoading,
  updateLayout,
  updateAccessibility,
  updatePreferences,
} = uiSlice.actions;

export default uiSlice.reducer;
