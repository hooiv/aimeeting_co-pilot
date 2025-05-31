import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VideoCall,
  Sync,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Launch,
  CloudDownload,
  People,
  Schedule,
  RecordVoiceOver,
  ScreenShare,
  Chat,
  Security,
} from '@mui/icons-material';
import { meetingPlatformsService, MeetingPlatform, ExternalMeeting, MeetingRecording } from '../services/meetingPlatforms';

const MeetingPlatformsIntegration: React.FC = () => {
  const [platforms, setPlatforms] = useState<MeetingPlatform[]>([]);
  const [meetings, setMeetings] = useState<ExternalMeeting[]>([]);
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<MeetingPlatform | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [platformsData, meetingsData, recordingsData] = await Promise.all([
        meetingPlatformsService.getPlatforms(),
        meetingPlatformsService.getMeetings(),
        meetingPlatformsService.getRecordings(),
      ]);
      setPlatforms(platformsData);
      setMeetings(meetingsData);
      setRecordings(recordingsData);
    } catch (error) {
      setError('Failed to load meeting platforms data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: MeetingPlatform) => {
    try {
      setError(null);
      let result;

      switch (platform.type) {
        case 'zoom':
          // Redirect to Zoom OAuth
          window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.REACT_APP_ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/integrations/zoom/callback')}`;
          return;
        
        case 'teams':
          result = await meetingPlatformsService.connectTeams();
          break;
        
        case 'googlemeet':
          result = await meetingPlatformsService.connectGoogleMeet();
          break;
        
        default:
          setConfigDialogOpen(true);
          setSelectedPlatform(platform);
          return;
      }

      if (result?.success) {
        setSuccess(`${platform.name} connected successfully`);
        loadData();
      } else {
        setError(result?.error || `Failed to connect ${platform.name}`);
      }
    } catch (error) {
      setError(`Failed to connect ${platform.name}`);
    }
  };

  const handleDisconnect = async (platform: MeetingPlatform) => {
    try {
      setError(null);
      const success = await meetingPlatformsService.disconnectPlatform(platform.id);
      if (success) {
        setSuccess(`${platform.name} disconnected successfully`);
        loadData();
      } else {
        setError(`Failed to disconnect ${platform.name}`);
      }
    } catch (error) {
      setError(`Failed to disconnect ${platform.name}`);
    }
  };

  const handleSync = async (platformId?: string) => {
    try {
      setSyncing(true);
      setError(null);
      const success = await meetingPlatformsService.syncMeetings(platformId);
      if (success) {
        setSuccess('Meetings synced successfully');
        loadData();
      } else {
        setError('Failed to sync meetings');
      }
    } catch (error) {
      setError('Failed to sync meetings');
    } finally {
      setSyncing(false);
    }
  };

  const getPlatformIcon = (type: string) => {
    const iconProps = { sx: { width: 40, height: 40 } };
    switch (type) {
      case 'zoom':
        return <Avatar sx={{ bgcolor: '#2D8CFF', ...iconProps }}>Z</Avatar>;
      case 'teams':
        return <Avatar sx={{ bgcolor: '#6264A7', ...iconProps }}>T</Avatar>;
      case 'googlemeet':
        return <Avatar sx={{ bgcolor: '#4285F4', ...iconProps }}>G</Avatar>;
      case 'webex':
        return <Avatar sx={{ bgcolor: '#00BCF2', ...iconProps }}>W</Avatar>;
      default:
        return <Avatar sx={{ bgcolor: '#666', ...iconProps }}><VideoCall /></Avatar>;
    }
  };

  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'success' : 'error';
  };

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? <CheckCircle /> : <Error />;
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
        <Typography variant="h6">Meeting Platform Integrations</Typography>
        <Button
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
          onClick={() => handleSync()}
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

      {/* Platform Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {platforms.map((platform) => (
          <Grid item xs={12} md={6} lg={4} key={platform.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getPlatformIcon(platform.type)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6">{platform.name}</Typography>
                    <Chip
                      icon={getStatusIcon(platform.isConnected)}
                      label={platform.isConnected ? 'Connected' : 'Not Connected'}
                      color={getStatusColor(platform.isConnected)}
                      size="small"
                    />
                  </Box>
                  <IconButton onClick={() => handleSync(platform.id)} disabled={!platform.isConnected}>
                    <Sync />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="textSecondary" paragraph>
                  {platform.type.charAt(0).toUpperCase() + platform.type.slice(1)} integration for meetings and recordings
                </Typography>

                {/* Features */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Features:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {platform.features.createMeeting && <Chip size="small" label="Create" />}
                    {platform.features.recording && <Chip size="small" label="Recording" />}
                    {platform.features.transcription && <Chip size="small" label="Transcription" />}
                    {platform.features.breakoutRooms && <Chip size="small" label="Breakouts" />}
                    {platform.features.waitingRoom && <Chip size="small" label="Waiting Room" />}
                  </Box>
                </Box>

                {/* Limits */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Limits:</Typography>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon><People fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={`${platform.limits.maxParticipants} participants`}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon><Schedule fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={`${platform.limits.maxDuration} minutes`}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon><CloudDownload fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={`${platform.limits.recordingStorage} GB storage`}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
              <CardActions>
                {platform.isConnected ? (
                  <>
                    <Button size="small" onClick={() => handleDisconnect(platform)}>
                      Disconnect
                    </Button>
                    <Button size="small" startIcon={<Settings />}>
                      Configure
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={() => handleConnect(platform)}
                  >
                    Connect
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Meetings */}
      {meetings.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent External Meetings
            </Typography>
            <List>
              {meetings.slice(0, 5).map((meeting) => (
                <ListItem key={meeting.id} divider>
                  <ListItemIcon>
                    {getPlatformIcon(platforms.find(p => p.id === meeting.platformId)?.type || '')}
                  </ListItemIcon>
                  <ListItemText
                    primary={meeting.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {new Date(meeting.startTime).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {meeting.participants.length} participants
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Join Meeting">
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(meeting.joinUrl, '_blank')}
                      >
                        <Launch />
                      </IconButton>
                    </Tooltip>
                    {meeting.recording.enabled && (
                      <Tooltip title="Recording Enabled">
                        <IconButton size="small">
                          <RecordVoiceOver color="success" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Recent Recordings */}
      {recordings.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Recordings
            </Typography>
            <List>
              {recordings.slice(0, 5).map((recording) => (
                <ListItem key={recording.id} divider>
                  <ListItemIcon>
                    {getPlatformIcon(platforms.find(p => p.id === recording.platformId)?.type || '')}
                  </ListItemIcon>
                  <ListItemText
                    primary={recording.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {new Date(recording.startTime).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Duration: {Math.round(recording.duration / 60)} minutes • Size: {(recording.fileSize / 1024 / 1024).toFixed(1)} MB
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      label={recording.status}
                      color={recording.status === 'completed' ? 'success' : recording.status === 'processing' ? 'warning' : 'error'}
                    />
                    {recording.status === 'completed' && (
                      <>
                        <Tooltip title="Download">
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(recording.downloadUrl, '_blank')}
                          >
                            <CloudDownload />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Play">
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(recording.playbackUrl, '_blank')}
                          >
                            <Launch />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure {selectedPlatform?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Enter your {selectedPlatform?.name} API credentials to enable integration.
          </Typography>
          <TextField
            fullWidth
            label="Client ID"
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Client Secret"
            type="password"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="API Key (if required)"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable automatic meeting sync"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingPlatformsIntegration;
