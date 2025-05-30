import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Chip,
  ButtonGroup,
  Button,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  VolumeUp,
  VolumeOff,
  FiberManualRecord,
  Stop,
  Settings,
  MoreVert,
  GridView,
  ViewList,
  ViewModule,
  PresentToAll,
  RecordVoiceOver,
  SmartToy,
  Security,
  Feedback,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MeetingControlsProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeakerMuted: boolean;
  isRecording: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleSpeaker: () => void;
  onLeaveMeeting: () => void;
  onToggleRecording: () => void;
  viewMode: 'grid' | 'speaker' | 'gallery';
  onViewModeChange: (mode: 'grid' | 'speaker' | 'gallery') => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isSpeakerMuted,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSpeaker,
  onLeaveMeeting,
  onToggleRecording,
  viewMode,
  onViewModeChange,
}) => {
  const { t } = useTranslation();
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  const getViewModeIcon = (mode: string) => {
    switch (mode) {
      case 'grid':
        return <GridView />;
      case 'speaker':
        return <PresentToAll />;
      case 'gallery':
        return <ViewModule />;
      default:
        return <GridView />;
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          px: 3,
          py: 2,
          borderRadius: 6,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'divider',
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Audio Control */}
          <Tooltip title={isAudioMuted ? 'Unmute' : 'Mute'}>
            <IconButton
              onClick={onToggleAudio}
              sx={{
                bgcolor: isAudioMuted ? 'error.main' : 'action.hover',
                color: isAudioMuted ? 'error.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isAudioMuted ? 'error.dark' : 'action.selected',
                },
              }}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </IconButton>
          </Tooltip>

          {/* Video Control */}
          <Tooltip title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
            <IconButton
              onClick={onToggleVideo}
              sx={{
                bgcolor: isVideoOff ? 'error.main' : 'action.hover',
                color: isVideoOff ? 'error.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isVideoOff ? 'error.dark' : 'action.selected',
                },
              }}
            >
              {isVideoOff ? <VideocamOff /> : <Videocam />}
            </IconButton>
          </Tooltip>

          {/* Screen Share Control */}
          <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
            <IconButton
              onClick={onToggleScreenShare}
              sx={{
                bgcolor: isScreenSharing ? 'primary.main' : 'action.hover',
                color: isScreenSharing ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isScreenSharing ? 'primary.dark' : 'action.selected',
                },
              }}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Speaker Control */}
          <Tooltip title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}>
            <IconButton
              onClick={onToggleSpeaker}
              sx={{
                bgcolor: isSpeakerMuted ? 'warning.main' : 'action.hover',
                color: isSpeakerMuted ? 'warning.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isSpeakerMuted ? 'warning.dark' : 'action.selected',
                },
              }}
            >
              {isSpeakerMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>

          {/* Recording Control */}
          <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'}>
            <IconButton
              onClick={onToggleRecording}
              sx={{
                bgcolor: isRecording ? 'error.main' : 'action.hover',
                color: isRecording ? 'error.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isRecording ? 'error.dark' : 'action.selected',
                },
              }}
            >
              {isRecording ? <Stop /> : <FiberManualRecord />}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* View Mode Controls */}
          <ButtonGroup variant="outlined" size="small">
            {(['grid', 'speaker', 'gallery'] as const).map((mode) => (
              <Button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                variant={viewMode === mode ? 'contained' : 'outlined'}
                sx={{ minWidth: 40 }}
              >
                {getViewModeIcon(mode)}
              </Button>
            ))}
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton onClick={handleSettingsMenuOpen}>
              <Settings />
            </IconButton>
          </Tooltip>

          {/* More Options */}
          <Tooltip title="More options">
            <IconButton onClick={handleMoreMenuOpen}>
              <MoreVert />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Leave Meeting */}
          <Tooltip title="Leave meeting">
            <IconButton
              onClick={onLeaveMeeting}
              sx={{
                bgcolor: 'error.main',
                color: 'error.contrastText',
                '&:hover': {
                  bgcolor: 'error.dark',
                },
              }}
            >
              <CallEnd />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Recording Indicator */}
        {isRecording && (
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Chip
              icon={<FiberManualRecord sx={{ color: 'error.main' }} />}
              label="Recording"
              size="small"
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'error.main',
              }}
            />
          </Box>
        )}

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={handleSettingsMenuClose}
        >
          <MenuItem onClick={handleSettingsMenuClose}>
            <Videocam sx={{ mr: 1 }} />
            Camera Settings
          </MenuItem>
          <MenuItem onClick={handleSettingsMenuClose}>
            <Mic sx={{ mr: 1 }} />
            Microphone Settings
          </MenuItem>
          <MenuItem onClick={handleSettingsMenuClose}>
            <VolumeUp sx={{ mr: 1 }} />
            Speaker Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSettingsMenuClose}>
            <RecordVoiceOver sx={{ mr: 1 }} />
            Transcription Settings
          </MenuItem>
          <MenuItem onClick={handleSettingsMenuClose}>
            <SmartToy sx={{ mr: 1 }} />
            AI Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSettingsMenuClose}>
            <Security sx={{ mr: 1 }} />
            Privacy & Security
          </MenuItem>
        </Menu>

        {/* More Options Menu */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={handleMoreMenuClose}
        >
          <MenuItem onClick={handleMoreMenuClose}>
            <RecordVoiceOver sx={{ mr: 1 }} />
            Toggle Transcription
          </MenuItem>
          <MenuItem onClick={handleMoreMenuClose}>
            <SmartToy sx={{ mr: 1 }} />
            AI Insights
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMoreMenuClose}>
            <ViewList sx={{ mr: 1 }} />
            Meeting Notes
          </MenuItem>
          <MenuItem onClick={handleMoreMenuClose}>
            <Feedback sx={{ mr: 1 }} />
            Send Feedback
          </MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};

export default MeetingControls;
