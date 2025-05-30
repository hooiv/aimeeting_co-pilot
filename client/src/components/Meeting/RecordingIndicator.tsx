import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  FiberManualRecord,
  Stop,
  Pause,
  PlayArrow,
  Settings,
  CloudUpload,
  Storage,
  VideoFile,
  AudioFile,
  MoreVert,
  Warning,
  CheckCircle,
  Schedule,
  Download,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RecordingIndicatorProps {
  isRecording?: boolean;
  isPaused?: boolean;
  duration?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  storageUsed?: number;
  storageLimit?: number;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onSettings?: () => void;
  recordingType?: 'local' | 'cloud';
  autoUpload?: boolean;
  includeAudio?: boolean;
  includeVideo?: boolean;
  includeScreenShare?: boolean;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording = false,
  isPaused = false,
  duration = 0,
  quality = 'medium',
  storageUsed = 0,
  storageLimit = 1000,
  onStop,
  onPause,
  onResume,
  onSettings,
  recordingType = 'cloud',
  autoUpload = true,
  includeAudio = true,
  includeVideo = true,
  includeScreenShare = true,
}) => {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Calculate estimated file size based on duration and quality
  useEffect(() => {
    const qualityMultipliers = {
      low: 0.5,
      medium: 1,
      high: 2,
      ultra: 4,
    };

    // Rough estimation: 1MB per minute for medium quality
    const baseSizePerMinute = 1; // MB
    const multiplier = qualityMultipliers[quality];
    const minutes = duration / 60;

    let size = minutes * baseSizePerMinute * multiplier;

    // Adjust based on what's being recorded
    if (includeVideo) size *= 1.5;
    if (includeScreenShare) size *= 1.2;
    if (!includeAudio) size *= 0.8;

    setEstimatedSize(size);
  }, [duration, quality, includeAudio, includeVideo, includeScreenShare]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (mb: number) => {
    if (mb < 1) {
      return `${Math.round(mb * 1024)} KB`;
    }
    if (mb < 1024) {
      return `${Math.round(mb * 10) / 10} MB`;
    }
    return `${Math.round((mb / 1024) * 10) / 10} GB`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'low':
        return 'warning';
      case 'medium':
        return 'info';
      case 'high':
        return 'success';
      case 'ultra':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStorageWarning = () => {
    const usagePercent = (storageUsed / storageLimit) * 100;
    if (usagePercent > 90) return 'error';
    if (usagePercent > 75) return 'warning';
    return 'success';
  };

  if (!isRecording) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: isPaused ? 'warning.main' : 'error.main',
            color: 'white',
            borderRadius: 3,
            cursor: 'pointer',
          }}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Recording Icon with Animation */}
          <motion.div
            animate={{
              scale: isPaused ? 1 : [1, 1.2, 1],
              opacity: isPaused ? 0.7 : [1, 0.7, 1],
            }}
            transition={{
              duration: isPaused ? 0 : 1.5,
              repeat: isPaused ? 0 : Infinity,
              ease: 'easeInOut',
            }}
          >
            {isPaused ? <Pause fontSize="small" /> : <FiberManualRecord fontSize="small" />}
          </motion.div>

          {/* Status Text */}
          <Typography variant="body2" fontWeight={600}>
            {isPaused ? 'PAUSED' : 'REC'}
          </Typography>

          {/* Duration */}
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {formatDuration(duration)}
          </Typography>

          {/* Quality Indicator */}
          <Chip
            label={quality.toUpperCase()}
            size="small"
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              fontSize: '0.6rem',
              height: 20,
            }}
          />

          {/* Storage Type */}
          <Tooltip title={recordingType === 'cloud' ? 'Cloud Recording' : 'Local Recording'}>
            {recordingType === 'cloud' ? (
              <CloudUpload fontSize="small" />
            ) : (
              <Storage fontSize="small" />
            )}
          </Tooltip>

          {/* More Options */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor(e.currentTarget);
            }}
            sx={{ color: 'white', ml: 0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Paper>

        {/* Detailed View */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 8,
                zIndex: 1000,
              }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 2,
                  minWidth: 280,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" color="text.primary">
                    Recording Details
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!isPaused && (
                      <Tooltip title="Pause recording">
                        <IconButton size="small" onClick={onPause} color="warning">
                          <Pause />
                        </IconButton>
                      </Tooltip>
                    )}
                    {isPaused && (
                      <Tooltip title="Resume recording">
                        <IconButton size="small" onClick={onResume} color="success">
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Stop recording">
                      <IconButton size="small" onClick={onStop} color="error">
                        <Stop />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Duration" secondary={formatDuration(duration)} />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <VideoFile color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Estimated Size"
                      secondary={formatFileSize(estimatedSize)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      {recordingType === 'cloud' ? (
                        <CloudUpload color="primary" />
                      ) : (
                        <Storage color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Storage"
                      secondary={`${recordingType === 'cloud' ? 'Cloud' : 'Local'} Recording`}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color={getQualityColor(quality) as any} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Quality"
                      secondary={`${quality.charAt(0).toUpperCase() + quality.slice(1)} Quality`}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Recording Includes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {includeAudio && (
                    <Chip
                      icon={<AudioFile />}
                      label="Audio"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {includeVideo && (
                    <Chip
                      icon={<VideoFile />}
                      label="Video"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {includeScreenShare && (
                    <Chip
                      icon={<VideoFile />}
                      label="Screen"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>

                {recordingType === 'cloud' && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Storage Usage:
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">
                          {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
                        </Typography>
                        <Typography variant="caption">
                          {Math.round((storageUsed / storageLimit) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(storageUsed / storageLimit) * 100}
                        color={getStorageWarning() as any}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<Settings />}
                    onClick={() => setSettingsOpen(true)}
                  >
                    Settings
                  </Button>
                  {autoUpload && recordingType === 'cloud' && (
                    <Chip
                      icon={<CloudUpload />}
                      label="Auto-upload"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          {!isPaused ? (
            <MenuItem
              onClick={() => {
                onPause?.();
                setMenuAnchor(null);
              }}
            >
              <Pause sx={{ mr: 1 }} />
              Pause Recording
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                onResume?.();
                setMenuAnchor(null);
              }}
            >
              <PlayArrow sx={{ mr: 1 }} />
              Resume Recording
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              onStop?.();
              setMenuAnchor(null);
            }}
          >
            <Stop sx={{ mr: 1 }} />
            Stop Recording
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSettingsOpen(true);
              setMenuAnchor(null);
            }}
          >
            <Settings sx={{ mr: 1 }} />
            Recording Settings
          </MenuItem>
          <MenuItem onClick={() => setMenuAnchor(null)}>
            <Download sx={{ mr: 1 }} />
            Download Current
          </MenuItem>
        </Menu>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Recording Settings</DialogTitle>
          <DialogContent>
            <List>
              <ListItem>
                <FormControlLabel
                  control={<Switch checked={includeAudio} />}
                  label="Include Audio"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={<Switch checked={includeVideo} />}
                  label="Include Video"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={<Switch checked={includeScreenShare} />}
                  label="Include Screen Share"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={<Switch checked={autoUpload} />}
                  label="Auto-upload to Cloud"
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => setSettingsOpen(false)} variant="contained">
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecordingIndicator;
