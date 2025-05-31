import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Google,
  Microsoft,
  Apple,
  CalendarToday,
  Sync,
  Settings,
  Delete,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { calendarService, CalendarIntegration } from '../services/calendar';

const CalendarIntegrationComponent: React.FC = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [appleDialogOpen, setAppleDialogOpen] = useState(false);
  const [appleCredentials, setAppleCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getCalendarIntegrations();
      setIntegrations(data);
    } catch (error) {
      setError('Failed to load calendar integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setError(null);
      const result = await calendarService.connectGoogleCalendar();
      if (result.success) {
        setSuccess('Google Calendar connected successfully');
        loadIntegrations();
      } else {
        setError(result.error || 'Failed to connect Google Calendar');
      }
    } catch (error) {
      setError('Failed to connect Google Calendar');
    }
  };

  const handleOutlookConnect = async () => {
    try {
      setError(null);
      const result = await calendarService.connectOutlookCalendar();
      if (result.success) {
        setSuccess('Outlook Calendar connected successfully');
        loadIntegrations();
      } else {
        setError(result.error || 'Failed to connect Outlook Calendar');
      }
    } catch (error) {
      setError('Failed to connect Outlook Calendar');
    }
  };

  const handleAppleConnect = async () => {
    try {
      setError(null);
      const result = await calendarService.connectAppleCalendar(appleCredentials);
      if (result.success) {
        setSuccess('Apple Calendar connected successfully');
        setAppleDialogOpen(false);
        setAppleCredentials({ username: '', password: '' });
        loadIntegrations();
      } else {
        setError(result.error || 'Failed to connect Apple Calendar');
      }
    } catch (error) {
      setError('Failed to connect Apple Calendar');
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      setError(null);
      const success = await calendarService.disconnectCalendar(provider);
      if (success) {
        setSuccess(`${provider} Calendar disconnected successfully`);
        loadIntegrations();
      } else {
        setError(`Failed to disconnect ${provider} Calendar`);
      }
    } catch (error) {
      setError(`Failed to disconnect ${provider} Calendar`);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const success = await calendarService.syncCalendars();
      if (success) {
        setSuccess('Calendars synced successfully');
        loadIntegrations();
      } else {
        setError('Failed to sync calendars');
      }
    } catch (error) {
      setError('Failed to sync calendars');
    } finally {
      setSyncing(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Google />;
      case 'outlook':
        return <Microsoft />;
      case 'apple':
        return <Apple />;
      default:
        return <CalendarToday />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return '#4285f4';
      case 'outlook':
        return '#0078d4';
      case 'apple':
        return '#000000';
      default:
        return '#666666';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Calendar Integrations</Typography>
        <Button
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync All'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Google Calendar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: getProviderColor('google'), mr: 2 }}>
                  <Google />
                </Avatar>
                <Box>
                  <Typography variant="h6">Google Calendar</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sync with Google Calendar
                  </Typography>
                </Box>
              </Box>
              {integrations.find(i => i.provider === 'google')?.isConnected ? (
                <Box>
                  <Chip
                    icon={<CheckCircle />}
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {integrations.find(i => i.provider === 'google')?.email}
                  </Typography>
                </Box>
              ) : (
                <Chip
                  icon={<Error />}
                  label="Not Connected"
                  color="error"
                  size="small"
                />
              )}
            </CardContent>
            <CardActions>
              {integrations.find(i => i.provider === 'google')?.isConnected ? (
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDisconnect('google')}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleGoogleConnect}
                >
                  Connect
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Outlook Calendar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: getProviderColor('outlook'), mr: 2 }}>
                  <Microsoft />
                </Avatar>
                <Box>
                  <Typography variant="h6">Outlook Calendar</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sync with Microsoft Outlook
                  </Typography>
                </Box>
              </Box>
              {integrations.find(i => i.provider === 'outlook')?.isConnected ? (
                <Box>
                  <Chip
                    icon={<CheckCircle />}
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {integrations.find(i => i.provider === 'outlook')?.email}
                  </Typography>
                </Box>
              ) : (
                <Chip
                  icon={<Error />}
                  label="Not Connected"
                  color="error"
                  size="small"
                />
              )}
            </CardContent>
            <CardActions>
              {integrations.find(i => i.provider === 'outlook')?.isConnected ? (
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDisconnect('outlook')}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleOutlookConnect}
                >
                  Connect
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Apple Calendar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: getProviderColor('apple'), mr: 2 }}>
                  <Apple />
                </Avatar>
                <Box>
                  <Typography variant="h6">Apple Calendar</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sync with iCloud Calendar
                  </Typography>
                </Box>
              </Box>
              {integrations.find(i => i.provider === 'apple')?.isConnected ? (
                <Box>
                  <Chip
                    icon={<CheckCircle />}
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {integrations.find(i => i.provider === 'apple')?.email}
                  </Typography>
                </Box>
              ) : (
                <Chip
                  icon={<Error />}
                  label="Not Connected"
                  color="error"
                  size="small"
                />
              )}
            </CardContent>
            <CardActions>
              {integrations.find(i => i.provider === 'apple')?.isConnected ? (
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDisconnect('apple')}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setAppleDialogOpen(true)}
                >
                  Connect
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Apple Calendar Connection Dialog */}
      <Dialog open={appleDialogOpen} onClose={() => setAppleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Apple Calendar</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Enter your iCloud credentials to connect your Apple Calendar. Your credentials are encrypted and stored securely.
          </Typography>
          <TextField
            fullWidth
            label="iCloud Email"
            type="email"
            value={appleCredentials.username}
            onChange={(e) => setAppleCredentials(prev => ({ ...prev, username: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="App-Specific Password"
            type="password"
            value={appleCredentials.password}
            onChange={(e) => setAppleCredentials(prev => ({ ...prev, password: e.target.value }))}
            helperText="Generate an app-specific password in your Apple ID settings"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAppleConnect}
            disabled={!appleCredentials.username || !appleCredentials.password}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarIntegrationComponent;
