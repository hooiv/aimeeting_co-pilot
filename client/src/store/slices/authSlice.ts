import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'moderator' | 'participant';
  permissions: string[];
  organizationId?: string;
  lastActive: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  loading: false,
  error: null,
  token: null,
  refreshToken: null,
  sessionExpiry: null,
};

// Async thunk actions
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Simulate an error for testing error handling
      if (credentials.email === 'error@test.com') {
        throw new Error('Invalid credentials');
      }

      // This would normally make an API call
      // For now, return mock data
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        displayName: 'Test User',
        role: 'participant',
        permissions: [],
        lastActive: new Date().toISOString(),
      };

      return {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  // This would normally make an API call to invalidate the token
  return;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string; expiresIn: number }>
    ) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.sessionExpiry = Date.now() + action.payload.expiresIn * 1000;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.sessionExpiry = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.sessionExpiry = null;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    refreshTokenSuccess: (state, action: PayloadAction<{ token: string; expiresIn: number }>) => {
      state.token = action.payload.token;
      state.sessionExpiry = Date.now() + action.payload.expiresIn * 1000;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = Date.now() + action.payload.expiresIn * 1000;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.sessionExpiry = null;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : action.error?.message || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.sessionExpiry = null;
        state.error = null;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  refreshTokenSuccess,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
