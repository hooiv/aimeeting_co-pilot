import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Chat,
  People,
  Settings,
  MoreVert,
  RecordVoiceOver,
  SmartToy,
  Fullscreen,
  FullscreenExit,
  GridView,
  ViewList,
  VolumeUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { useTranslation } from 'react-i18next';
import VideoGrid from '../components/Meeting/VideoGrid';
import ChatPanel from '../components/Meeting/ChatPanel';
import ParticipantsPanel from '../components/Meeting/ParticipantsPanel';
import TranscriptPanel from '../components/Meeting/TranscriptPanel';
import AIInsightsPanel from '../components/Meeting/AIInsightsPanel';
import ScreenShareOverlay from '../components/Meeting/ScreenShareOverlay';
import MeetingControls from '../components/Meeting/MeetingControls';
import RecordingIndicator from '../components/Meeting/RecordingIndicator';
import NetworkQualityIndicator from '../components/Meeting/NetworkQualityIndicator';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useTranscription } from '../hooks/useTranscription';
import { useAIInsights } from '../hooks/useAIInsights';
import { useSocket } from '../hooks/useSocket';

const MeetingRoom: React.FC = () => {
  const { id: meetingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux state
  const { user } = useAppSelector((state) => state.auth);
  const { currentMeeting, isRecording, transcriptionEnabled } = useAppSelector(
    (state) => state.meeting
  );
  const { chatPanelOpen, participantsPanelOpen, fullscreenMode } = useAppSelector(
    (state) => state.ui
  );

  // Local state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'speaker' | 'gallery'>('grid');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Custom hooks
  const {
    localStream,
    remoteStreams,
    isConnected,
    networkQuality,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC(meetingId!);

  const { audioLevel, isAnalyzing } = useAudioAnalyzer(localStream);
  const { transcript, isTranscribing, startTranscription, stopTranscription } = useTranscription();
  const { insights, isProcessing } = useAIInsights(transcript);
  const { socket, isSocketConnected } = useSocket();

  // Effects
  useEffect(() => {
    if (meetingId && user) {
      startCall();
      if (transcriptionEnabled) {
        startTranscription();
      }
    }

    return () => {
      endCall();
      stopTranscription();
    };
  }, [meetingId, user]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handlers
  const handleToggleAudio = () => {
    toggleAudio();
    setIsAudioMuted(!isAudioMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const handleLeaveMeeting = () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeaveMeeting = () => {
    endCall();
    navigate('/dashboard');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!meetingId || !user) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Typography variant="h6">Invalid meeting or user not authenticated</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Meeting Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" noWrap>
              {currentMeeting?.title || 'Meeting Room'}
            </Typography>
            {isRecording && <RecordingIndicator />}
            <NetworkQualityIndicator quality={networkQuality} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Participants">
              <IconButton onClick={() => dispatch({ type: 'ui/toggleParticipantsPanel' })}>
                <Badge badgeContent={currentMeeting?.participants.length || 0} color="primary">
                  <People />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton onClick={() => dispatch({ type: 'ui/toggleChatPanel' })}>
                <Chat />
              </IconButton>
            </Tooltip>

            <Tooltip title="AI Insights">
              <IconButton onClick={() => setShowAIInsights(!showAIInsights)}>
                <Badge badgeContent={insights.length} color="secondary">
                  <SmartToy />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Transcript">
              <IconButton onClick={() => setShowTranscript(!showTranscript)}>
                <RecordVoiceOver color={isTranscribing ? 'primary' : 'inherit'} />
              </IconButton>
            </Tooltip>

            <Tooltip title="More options">
              <IconButton onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Meeting Area */}
      <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Video Grid */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            viewMode={viewMode}
            isScreenSharing={isScreenSharing}
            participants={currentMeeting?.participants || []}
          />

          {/* Screen Share Overlay */}
          {isScreenSharing && (
            <ScreenShareOverlay
              screenShareRef={screenShareRef}
              onStopSharing={handleToggleScreenShare}
            />
          )}

          {/* Audio Level Indicator */}
          {isAnalyzing && audioLevel > 0.1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: 100,
                left: 20,
                zIndex: 1000,
              }}
            >
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeUp fontSize="small" />
                <LinearProgress
                  variant="determinate"
                  value={audioLevel * 100}
                  sx={{ width: 100 }}
                />
              </Paper>
            </motion.div>
          )}
        </Box>

        {/* Chat Panel */}
        <AnimatePresence>
          {chatPanelOpen && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <ChatPanel meetingId={meetingId} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participants Panel */}
        <AnimatePresence>
          {participantsPanelOpen && (
            <motion.div
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <ParticipantsPanel participants={currentMeeting?.participants || []} />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Meeting Controls */}
      <MeetingControls
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isSpeakerMuted={isSpeakerMuted}
        isRecording={isRecording}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleSpeaker={() => setIsSpeakerMuted(!isSpeakerMuted)}
        onLeaveMeeting={handleLeaveMeeting}
        onToggleRecording={() => {}}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Transcript Panel */}
      <Drawer
        anchor="bottom"
        open={showTranscript}
        onClose={() => setShowTranscript(false)}
        PaperProps={{
          sx: { height: '40vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
      >
        <TranscriptPanel transcript={transcript} isTranscribing={isTranscribing} />
      </Drawer>

      {/* AI Insights Panel */}
      <Drawer
        anchor="right"
        open={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        PaperProps={{
          sx: { width: 400 },
        }}
      >
        <AIInsightsPanel insights={insights} isProcessing={isProcessing} />
      </Drawer>

      {/* More Options Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setSettingsOpen(true);
            handleMenuClose();
          }}
        >
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            toggleFullscreen();
            handleMenuClose();
          }}
        >
          {fullscreenMode ? <FullscreenExit sx={{ mr: 1 }} /> : <Fullscreen sx={{ mr: 1 }} />}
          {fullscreenMode ? 'Exit Fullscreen' : 'Fullscreen'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setViewMode(viewMode === 'grid' ? 'gallery' : 'grid');
            handleMenuClose();
          }}
        >
          {viewMode === 'grid' ? <ViewList sx={{ mr: 1 }} /> : <GridView sx={{ mr: 1 }} />}
          Change Layout
        </MenuItem>
      </Menu>

      {/* Leave Meeting Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)}>
        <DialogTitle>Leave Meeting</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to leave this meeting?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmLeaveMeeting} color="error" variant="contained">
            Leave Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingRoom;
