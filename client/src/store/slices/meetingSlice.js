import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchMeetings = createAsyncThunk(
  'meeting/fetchMeetings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/meetings`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error);
      }

      return data.data.meetings;
    } catch (error) {
      return rejectWithValue({ message: 'Network error' });
    }
  }
);

export const createMeeting = createAsyncThunk(
  'meeting/createMeeting',
  async (meetingData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/meetings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error);
      }

      return data.data.meeting;
    } catch (error) {
      return rejectWithValue({ message: 'Network error' });
    }
  }
);

export const fetchMeetingById = createAsyncThunk(
  'meeting/fetchMeetingById',
  async (meetingId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error);
      }

      return data.data.meeting;
    } catch (error) {
      return rejectWithValue({ message: 'Network error' });
    }
  }
);

const initialState = {
  meetings: [],
  currentMeeting: null,
  participants: [],
  messages: [],
  transcript: [],
  aiInsights: [],
  loading: false,
  error: null,
  isInMeeting: false,
  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  isRecording: false,
  whiteboardData: null,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    joinMeeting: (state, action) => {
      state.isInMeeting = true;
      state.currentMeeting = action.payload;
    },
    leaveMeeting: (state) => {
      state.isInMeeting = false;
      state.currentMeeting = null;
      state.participants = [];
      state.messages = [];
      state.transcript = [];
      state.aiInsights = [];
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOn = !state.isVideoOn;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    toggleRecording: (state) => {
      state.isRecording = !state.isRecording;
    },
    addParticipant: (state, action) => {
      state.participants.push(action.payload);
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter((p) => p.id !== action.payload);
    },
    updateParticipant: (state, action) => {
      const index = state.participants.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.participants[index] = { ...state.participants[index], ...action.payload };
      }
    },
    addTranscriptEntry: (state, action) => {
      state.transcript.push(action.payload);
    },
    updateTranscriptEntry: (state, action) => {
      const index = state.transcript.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.transcript[index] = { ...state.transcript[index], ...action.payload };
      }
    },
    addAIInsight: (state, action) => {
      state.aiInsights.push(action.payload);
    },
    updateWhiteboard: (state, action) => {
      state.whiteboardData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch meetings
      .addCase(fetchMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload;
        state.error = null;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create meeting
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings.push(action.payload);
        state.error = null;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch meeting by ID
      .addCase(fetchMeetingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload;
        state.error = null;
      })
      .addCase(fetchMeetingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentMeeting,
  joinMeeting,
  leaveMeeting,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  toggleRecording,
  addParticipant,
  addMessage,
  removeParticipant,
  updateParticipant,
  addTranscriptEntry,
  updateTranscriptEntry,
  addAIInsight,
  updateWhiteboard,
} = meetingSlice.actions;

export default meetingSlice.reducer;
