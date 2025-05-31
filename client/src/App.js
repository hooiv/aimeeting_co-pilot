import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import { useAppSelector } from './hooks/redux';
import { initializeI18n } from './i18n/index.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';

import Navbar from './components/Layout/Navbar.tsx';
import Sidebar from './components/Layout/Sidebar.tsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.tsx';

// Pages
import Dashboard from './pages/Dashboard.tsx';
import MeetingRoom from './pages/MeetingRoom.tsx';
import MeetingHistory from './pages/MeetingHistory.tsx';
import Analytics from './pages/Analytics.tsx';
import AIInsights from './pages/AIInsights.tsx';
import Recordings from './pages/Recordings.tsx';
import ScheduleMeeting from './pages/ScheduleMeeting.tsx';
import Help from './pages/Help.tsx';
import Integrations from './pages/Integrations.tsx';
import Settings from './pages/Settings.tsx';
import Profile from './pages/Profile.tsx';
import Login from './pages/Login.tsx';
import NotFound from './pages/NotFound.tsx';

// Styles
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Initialize i18n
initializeI18n();

const AppContent = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  const muiTheme = createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: theme === 'dark' ? '#121212' : '#fafafa',
        paper: theme === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ErrorBoundary>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {isAuthenticated && <Navbar />}
            {isAuthenticated && sidebarOpen && <Sidebar />}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                marginLeft: isAuthenticated && sidebarOpen ? '280px' : 0,
                marginTop: isAuthenticated ? '64px' : 0,
                transition: 'margin-left 0.3s ease',
              }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meeting/:id"
                  element={
                    <ProtectedRoute>
                      <MeetingRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings"
                  element={
                    <ProtectedRoute>
                      <MeetingHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/schedule"
                  element={
                    <ProtectedRoute>
                      <ScheduleMeeting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/history"
                  element={
                    <ProtectedRoute>
                      <MeetingHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-insights"
                  element={
                    <ProtectedRoute>
                      <AIInsights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recordings"
                  element={
                    <ProtectedRoute>
                      <Recordings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetings/recordings"
                  element={
                    <ProtectedRoute>
                      <Recordings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/integrations"
                  element={
                    <ProtectedRoute>
                      <Integrations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <ProtectedRoute>
                      <Help />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Box>
          </Box>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
