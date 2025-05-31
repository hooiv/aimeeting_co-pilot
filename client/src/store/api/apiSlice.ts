import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new token
      api.dispatch({
        type: 'auth/refreshTokenSuccess',
        payload: refreshResult.data,
      });

      // Retry the original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Meeting',
    'User',
    'Transcript',
    'ActionItem',
    'Analytics',
    'Settings',
    'Integration',
    'Notification',
    'Recordings',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    refreshToken: builder.mutation({
      query: (refreshToken) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),

    // Meeting endpoints
    getMeetings: builder.query({
      query: (params = {}) => ({
        url: '/meetings',
        params,
      }),
      providesTags: ['Meeting'],
    }),
    getMeeting: builder.query({
      query: (id) => `/meetings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),
    createMeeting: builder.mutation({
      query: (meeting) => ({
        url: '/meetings',
        method: 'POST',
        body: meeting,
      }),
      invalidatesTags: ['Meeting'],
    }),
    updateMeeting: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/meetings/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id }],
    }),
    deleteMeeting: builder.mutation({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Meeting'],
    }),
    joinMeeting: builder.mutation({
      query: ({ id, ...params }) => ({
        url: `/meetings/${id}/join`,
        method: 'POST',
        body: params,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id }],
    }),
    leaveMeeting: builder.mutation({
      query: (id) => ({
        url: `/meetings/${id}/leave`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),

    // Transcript endpoints
    getTranscript: builder.query({
      query: (meetingId) => `/meetings/${meetingId}/transcript`,
      providesTags: (result, error, meetingId) => [{ type: 'Transcript', id: meetingId }],
    }),
    exportTranscript: builder.mutation({
      query: ({ meetingId, format }) => ({
        url: `/meetings/${meetingId}/transcript/export`,
        method: 'POST',
        body: { format },
      }),
    }),

    // AI endpoints
    summarizeMeeting: builder.mutation({
      query: (meetingId) => ({
        url: `/ai/summarize`,
        method: 'POST',
        body: { meetingId },
      }),
    }),
    extractActionItems: builder.mutation({
      query: (meetingId) => ({
        url: `/ai/action-items`,
        method: 'POST',
        body: { meetingId },
      }),
      invalidatesTags: ['ActionItem'],
    }),
    analyzeSentiment: builder.mutation({
      query: ({ text, meetingId }) => ({
        url: `/ai/sentiment`,
        method: 'POST',
        body: { text, meetingId },
      }),
    }),
    detectTopics: builder.mutation({
      query: ({ text, meetingId }) => ({
        url: `/ai/topics`,
        method: 'POST',
        body: { text, meetingId },
      }),
    }),
    translateText: builder.mutation({
      query: ({ text, targetLanguage }) => ({
        url: `/ai/translate`,
        method: 'POST',
        body: { text, targetLanguage },
      }),
    }),

    // Analytics endpoints
    getMeetingAnalytics: builder.query({
      query: (meetingId) => `/analytics/meetings/${meetingId}`,
      providesTags: (result, error, meetingId) => [{ type: 'Analytics', id: meetingId }],
    }),
    getUserAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/analytics/user',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getOrganizationAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/analytics/organization',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getDashboardData: builder.query({
      query: () => '/analytics/dashboard',
      providesTags: ['Analytics'],
    }),
    getLiveMeetingAnalytics: builder.query({
      query: (meetingId) => `/analytics/meetings/${meetingId}/live`,
      providesTags: (result, error, meetingId) => [{ type: 'Analytics', id: `live-${meetingId}` }],
    }),
    trackEvent: builder.mutation({
      query: (eventData) => ({
        url: '/analytics/events',
        method: 'POST',
        body: eventData,
      }),
    }),
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Analytics'],
    }),
    getSystemHealth: builder.query({
      query: () => '/admin/system-health',
      providesTags: ['Analytics'],
    }),
    exportUserAnalytics: builder.mutation({
      query: (params = {}) => ({
        url: '/export/analytics/user',
        method: 'GET',
        params,
      }),
    }),

    // AI Insights endpoints
    getAIInsights: builder.query({
      query: (params = {}) => ({
        url: '/ai/insights',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    generateInsights: builder.mutation({
      query: (data) => ({
        url: '/ai/insights/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Analytics'],
    }),
    getSentimentTrends: builder.query({
      query: (params = {}) => ({
        url: '/ai/sentiment/trends',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getTopicInsights: builder.query({
      query: (params = {}) => ({
        url: '/ai/topics/insights',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Recordings endpoints
    getRecordings: builder.query({
      query: (params = {}) => ({
        url: '/recordings',
        params,
      }),
      providesTags: ['Recordings'],
    }),
    getRecording: builder.query({
      query: (id) => `/recordings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Recordings', id }],
    }),
    uploadRecording: builder.mutation({
      query: (formData) => ({
        url: '/recordings/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Recordings'],
    }),
    deleteRecording: builder.mutation({
      query: (id) => ({
        url: `/recordings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Recordings'],
    }),
    shareRecording: builder.mutation({
      query: ({ id, shareData }) => ({
        url: `/recordings/${id}/share`,
        method: 'POST',
        body: shareData,
      }),
    }),
    getRecordingTranscript: builder.query({
      query: (id) => `/recordings/${id}/transcript`,
      providesTags: (result, error, id) => [{ type: 'Recordings', id: `transcript-${id}` }],
    }),
    getRecordingFolders: builder.query({
      query: () => '/recordings/folders',
      providesTags: ['Recordings'],
    }),

    // Meeting scheduling endpoints
    createMeeting: builder.mutation({
      query: (meetingData) => ({
        url: '/meetings',
        method: 'POST',
        body: meetingData,
      }),
      invalidatesTags: ['Meeting'],
    }),
    updateMeeting: builder.mutation({
      query: ({ id, ...meetingData }) => ({
        url: `/meetings/${id}`,
        method: 'PUT',
        body: meetingData,
      }),
      invalidatesTags: ['Meeting'],
    }),
    deleteMeeting: builder.mutation({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Meeting'],
    }),
    joinMeeting: builder.mutation({
      query: (id) => ({
        url: `/meetings/${id}/join`,
        method: 'POST',
      }),
    }),
    leaveMeeting: builder.mutation({
      query: (id) => ({
        url: `/meetings/${id}/leave`,
        method: 'POST',
      }),
    }),

    // Help and support endpoints
    getHelpArticles: builder.query({
      query: (params = {}) => ({
        url: '/help/articles',
        params,
      }),
    }),
    searchHelp: builder.query({
      query: (query) => ({
        url: '/help/search',
        params: { q: query },
      }),
    }),
    submitFeedback: builder.mutation({
      query: (feedbackData) => ({
        url: '/support/feedback',
        method: 'POST',
        body: feedbackData,
      }),
    }),
    contactSupport: builder.mutation({
      query: (contactData) => ({
        url: '/support/contact',
        method: 'POST',
        body: contactData,
      }),
    }),

    // Action Items endpoints
    getActionItems: builder.query({
      query: (params = {}) => ({
        url: '/action-items',
        params,
      }),
      providesTags: ['ActionItem'],
    }),
    createActionItem: builder.mutation({
      query: (actionItem) => ({
        url: '/action-items',
        method: 'POST',
        body: actionItem,
      }),
      invalidatesTags: ['ActionItem'],
    }),
    updateActionItem: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/action-items/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['ActionItem'],
    }),
    deleteActionItem: builder.mutation({
      query: (id) => ({
        url: `/action-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ActionItem'],
    }),

    // Profile endpoints
    getProfile: builder.query({
      query: () => '/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),
    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: '/profile/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    // Settings endpoints
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Integration endpoints
    getIntegrations: builder.query({
      query: () => '/integrations',
      providesTags: ['Integration'],
    }),
    connectIntegration: builder.mutation({
      query: ({ provider, config }) => ({
        url: `/integrations/${provider}/connect`,
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['Integration'],
    }),
    disconnectIntegration: builder.mutation({
      query: (provider) => ({
        url: `/integrations/${provider}/disconnect`,
        method: 'POST',
      }),
      invalidatesTags: ['Integration'],
    }),

    // Notification endpoints
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useJoinMeetingMutation,
  useLeaveMeetingMutation,
  useGetTranscriptQuery,
  useExportTranscriptMutation,
  useSummarizeMeetingMutation,
  useExtractActionItemsMutation,
  useAnalyzeSentimentMutation,
  useDetectTopicsMutation,
  useTranslateTextMutation,
  useGetMeetingAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrganizationAnalyticsQuery,
  useGetDashboardDataQuery,
  useGetLiveMeetingAnalyticsQuery,
  useTrackEventMutation,
  useGetAdminStatsQuery,
  useGetSystemHealthQuery,
  useExportUserAnalyticsMutation,
  useGetAIInsightsQuery,
  useGenerateInsightsMutation,
  useGetSentimentTrendsQuery,
  useGetTopicInsightsQuery,
  useGetRecordingsQuery,
  useGetRecordingQuery,
  useUploadRecordingMutation,
  useDeleteRecordingMutation,
  useShareRecordingMutation,
  useGetRecordingTranscriptQuery,
  useGetRecordingFoldersQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useJoinMeetingMutation,
  useLeaveMeetingMutation,
  useGetHelpArticlesQuery,
  useSearchHelpQuery,
  useSubmitFeedbackMutation,
  useContactSupportMutation,
  useGetActionItemsQuery,
  useCreateActionItemMutation,
  useUpdateActionItemMutation,
  useDeleteActionItemMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetIntegrationsQuery,
  useConnectIntegrationMutation,
  useDisconnectIntegrationMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = apiSlice;
