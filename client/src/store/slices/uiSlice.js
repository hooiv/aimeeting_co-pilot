import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'en',
  sidebarOpen: true,
  notifications: [],
  loading: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  modal: {
    open: false,
    type: null,
    data: null,
  },
  drawer: {
    open: false,
    type: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    openModal: (state, action) => {
      state.modal = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = {
        open: false,
        type: null,
        data: null,
      };
    },
    openDrawer: (state, action) => {
      state.drawer = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeDrawer: (state) => {
      state.drawer = {
        open: false,
        type: null,
        data: null,
      };
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setTheme,
  setLanguage,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  showSnackbar,
  hideSnackbar,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer,
  addNotification,
  removeNotification,
  markNotificationRead,
  clearAllNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
