import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import meetingSlice from './slices/meetingSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    meeting: meetingSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// TypeScript types are exported from index.ts
