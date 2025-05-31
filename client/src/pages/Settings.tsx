import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,

  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Slider,

  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Mic,
  Videocam,
  SmartToy,
  Security,
  Notifications,
  Extension,
  Palette,
  VolumeUp,
  VolumeOff,

  Save,
  RestoreFromTrash,
  Warning,
} from '@mui/icons-material';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../store/api/apiSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // API hooks
  const {
    data: settingsData,
    isLoading,
    error,
    refetch,
  } = useGetSettingsQuery(undefined);

  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  // Settings state
  const [settings, setSettings] = useState({
    audio: {
      inputDevice: 'default',
      outputDevice: 'default',
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      inputVolume: 80,
      outputVolume: 80,
    },
    video: {
      camera: 'default',
      resolution: '720p',
      frameRate: 30,
      backgroundBlur: false,
      virtualBackground: null,
      mirrorVideo: true,
    },
    ai: {
      transcriptionEnabled: true,
      summaryEnabled: true,
      actionItemsEnabled: true,
      sentimentAnalysis: false,
      languageDetection: true,
      autoTranslation: false,
      preferredLanguage: 'en',
    },
    privacy: {
      profileVisibility: 'organization',
      showOnlineStatus: true,
      allowDirectMessages: true,
      shareAnalytics: false,
      dataRetention: '1year',
    },
    notifications: {
      email: {
        meetingInvites: true,
        meetingReminders: true,
        summaries: true,
        actionItems: true,
        weeklyReports: false,
      },
      push: {
        meetingStarted: true,
        mentionedInChat: true,
        actionItemAssigned: true,
        newMessage: true,
      },
      inApp: {
        allNotifications: true,
        soundEnabled: true,
        desktopNotifications: true,
      },
    },
    integrations: {
      calendar: {
        provider: null,
        syncEnabled: false,
        autoJoin: false,
      },
      storage: {
        provider: null,
        autoUpload: false,
        uploadQuality: 'high',
      },
      productivity: {
        slackEnabled: false,
        teamsEnabled: false,
        notionEnabled: false,
        asanaEnabled: false,
      },
    },
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
  });

  React.useEffect(() => {
    if (settingsData?.data?.settings) {
      setSettings(settingsData.data.settings);
    }
  }, [settingsData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [setting]: value,
      },
    }));
  };



  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap();
      refetch();
    } catch (error) {
      // Handle error silently or show user notification
    }
  };

  const handleReset = async () => {
    // Reset to default settings
    const defaultSettings = {
      audio: {
        inputDevice: 'default',
        outputDevice: 'default',
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        inputVolume: 80,
        outputVolume: 80,
      },
      video: {
        camera: 'default',
        resolution: '720p',
        frameRate: 30,
        backgroundBlur: false,
        virtualBackground: null,
        mirrorVideo: true,
      },
      ai: {
        transcriptionEnabled: true,
        summaryEnabled: true,
        actionItemsEnabled: true,
        sentimentAnalysis: false,
        languageDetection: true,
        autoTranslation: false,
        preferredLanguage: 'en',
      },
      privacy: {
        profileVisibility: 'organization',
        showOnlineStatus: true,
        allowDirectMessages: true,
        shareAnalytics: false,
        dataRetention: '1year',
      },
      notifications: {
        email: {
          meetingInvites: true,
          meetingReminders: true,
          summaries: true,
          actionItems: true,
          weeklyReports: false,
        },
        push: {
          meetingStarted: true,
          mentionedInChat: true,
          actionItemAssigned: true,
          newMessage: true,
        },
        inApp: {
          allNotifications: true,
          soundEnabled: true,
          desktopNotifications: true,
        },
      },
      integrations: {
        calendar: {
          provider: null,
          syncEnabled: false,
          autoJoin: false,
        },
        storage: {
          provider: null,
          autoUpload: false,
          uploadQuality: 'high',
        },
        productivity: {
          slackEnabled: false,
          teamsEnabled: false,
          notionEnabled: false,
          asanaEnabled: false,
        },
      },
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
    };

    setSettings(defaultSettings);
    setResetDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load settings</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RestoreFromTrash />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Tabs Section */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab icon={<Mic />} label="Audio" />
          <Tab icon={<Videocam />} label="Video" />
          <Tab icon={<SmartToy />} label="AI Features" />
          <Tab icon={<Security />} label="Privacy" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Extension />} label="Integrations" />
          <Tab icon={<Palette />} label="Appearance" />
        </Tabs>

        {/* Audio Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Audio Devices" />
                <CardContent>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Microphone</InputLabel>
                    <Select
                      value={settings.audio.inputDevice}
                      label="Microphone"
                      onChange={(e) => handleSettingChange('audio', 'inputDevice', e.target.value)}
                    >
                      <MenuItem value="default">Default Microphone</MenuItem>
                      <MenuItem value="built-in">Built-in Microphone</MenuItem>
                      <MenuItem value="external">External Microphone</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Speaker</InputLabel>
                    <Select
                      value={settings.audio.outputDevice}
                      label="Speaker"
                      onChange={(e) => handleSettingChange('audio', 'outputDevice', e.target.value)}
                    >
                      <MenuItem value="default">Default Speaker</MenuItem>
                      <MenuItem value="built-in">Built-in Speaker</MenuItem>
                      <MenuItem value="headphones">Headphones</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Audio Processing" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Echo Cancellation"
                        secondary="Reduces echo and feedback"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.audio.echoCancellation}
                          onChange={(e) => handleSettingChange('audio', 'echoCancellation', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Noise Suppression"
                        secondary="Filters background noise"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.audio.noiseSuppression}
                          onChange={(e) => handleSettingChange('audio', 'noiseSuppression', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Auto Gain Control"
                        secondary="Automatically adjusts microphone volume"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.audio.autoGainControl}
                          onChange={(e) => handleSettingChange('audio', 'autoGainControl', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Volume Controls" />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>Microphone Volume</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VolumeOff />
                        <Slider
                          value={settings.audio.inputVolume}
                          onChange={(_, value) => handleSettingChange('audio', 'inputVolume', value)}
                          aria-labelledby="input-volume-slider"
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                        />
                        <VolumeUp />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>Speaker Volume</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VolumeOff />
                        <Slider
                          value={settings.audio.outputVolume}
                          onChange={(_, value) => handleSettingChange('audio', 'outputVolume', value)}
                          aria-labelledby="output-volume-slider"
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                        />
                        <VolumeUp />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Video Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Camera Settings" />
                <CardContent>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Camera</InputLabel>
                    <Select
                      value={settings.video.camera}
                      label="Camera"
                      onChange={(e) => handleSettingChange('video', 'camera', e.target.value)}
                    >
                      <MenuItem value="default">Default Camera</MenuItem>
                      <MenuItem value="built-in">Built-in Camera</MenuItem>
                      <MenuItem value="external">External Camera</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Resolution</InputLabel>
                    <Select
                      value={settings.video.resolution}
                      label="Resolution"
                      onChange={(e) => handleSettingChange('video', 'resolution', e.target.value)}
                    >
                      <MenuItem value="480p">480p (SD)</MenuItem>
                      <MenuItem value="720p">720p (HD)</MenuItem>
                      <MenuItem value="1080p">1080p (Full HD)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Frame Rate</InputLabel>
                    <Select
                      value={settings.video.frameRate}
                      label="Frame Rate"
                      onChange={(e) => handleSettingChange('video', 'frameRate', e.target.value)}
                    >
                      <MenuItem value={15}>15 FPS</MenuItem>
                      <MenuItem value={24}>24 FPS</MenuItem>
                      <MenuItem value={30}>30 FPS</MenuItem>
                      <MenuItem value={60}>60 FPS</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Video Effects" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Background Blur"
                        secondary="Blur your background during video calls"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.video.backgroundBlur}
                          onChange={(e) => handleSettingChange('video', 'backgroundBlur', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Mirror Video"
                        secondary="Show your video mirrored like a mirror"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.video.mirrorVideo}
                          onChange={(e) => handleSettingChange('video', 'mirrorVideo', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Virtual Background
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="None"
                      variant={settings.video.virtualBackground === null ? "filled" : "outlined"}
                      onClick={() => handleSettingChange('video', 'virtualBackground', null)}
                    />
                    <Chip
                      label="Office"
                      variant={settings.video.virtualBackground === 'office' ? "filled" : "outlined"}
                      onClick={() => handleSettingChange('video', 'virtualBackground', 'office')}
                    />
                    <Chip
                      label="Home"
                      variant={settings.video.virtualBackground === 'home' ? "filled" : "outlined"}
                      onClick={() => handleSettingChange('video', 'virtualBackground', 'home')}
                    />
                    <Chip
                      label="Nature"
                      variant={settings.video.virtualBackground === 'nature' ? "filled" : "outlined"}
                      onClick={() => handleSettingChange('video', 'virtualBackground', 'nature')}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI Features Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Transcription & Recording" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Real-time Transcription"
                        secondary="Generate live transcripts during meetings"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.transcriptionEnabled}
                          onChange={(e) => handleSettingChange('ai', 'transcriptionEnabled', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Auto Summary"
                        secondary="Generate meeting summaries automatically"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.summaryEnabled}
                          onChange={(e) => handleSettingChange('ai', 'summaryEnabled', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Action Items Detection"
                        secondary="Automatically detect and extract action items"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.actionItemsEnabled}
                          onChange={(e) => handleSettingChange('ai', 'actionItemsEnabled', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Advanced AI Features" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Sentiment Analysis"
                        secondary="Analyze emotional tone of conversations"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.sentimentAnalysis}
                          onChange={(e) => handleSettingChange('ai', 'sentimentAnalysis', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Language Detection"
                        secondary="Automatically detect spoken languages"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.languageDetection}
                          onChange={(e) => handleSettingChange('ai', 'languageDetection', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Auto Translation"
                        secondary="Translate conversations in real-time"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.ai.autoTranslation}
                          onChange={(e) => handleSettingChange('ai', 'autoTranslation', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Preferred Language</InputLabel>
                    <Select
                      value={settings.ai.preferredLanguage}
                      label="Preferred Language"
                      onChange={(e) => handleSettingChange('ai', 'preferredLanguage', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                      <MenuItem value="zh">Chinese</MenuItem>
                      <MenuItem value="ja">Japanese</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Profile Privacy" />
                <CardContent>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Profile Visibility</InputLabel>
                    <Select
                      value={settings.privacy.profileVisibility}
                      label="Profile Visibility"
                      onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="organization">Organization Only</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                    </Select>
                  </FormControl>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Show Online Status"
                        secondary="Let others see when you're online"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.privacy.showOnlineStatus}
                          onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Allow Direct Messages"
                        secondary="Allow others to send you direct messages"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.privacy.allowDirectMessages}
                          onChange={(e) => handleSettingChange('privacy', 'allowDirectMessages', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Data & Analytics" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Share Analytics"
                        secondary="Share anonymized usage data to improve the service"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.privacy.shareAnalytics}
                          onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Retention</InputLabel>
                    <Select
                      value={settings.privacy.dataRetention}
                      label="Data Retention"
                      onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
                    >
                      <MenuItem value="30days">30 Days</MenuItem>
                      <MenuItem value="90days">90 Days</MenuItem>
                      <MenuItem value="1year">1 Year</MenuItem>
                      <MenuItem value="forever">Forever</MenuItem>
                    </Select>
                  </FormControl>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Meeting recordings and transcripts will be automatically deleted after the selected period.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Reset Settings
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} color="warning" variant="contained">
            Reset All Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;