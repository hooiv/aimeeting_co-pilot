import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  MoreVert,
  PushPin,
  VolumeOff,
  VolumeUp,
  Fullscreen,
  PersonAdd,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant } from '../../store/slices/meetingSlice';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  viewMode: 'grid' | 'speaker' | 'gallery';
  isScreenSharing: boolean;
  participants: Participant[];
}

interface VideoTileProps {
  stream?: MediaStream;
  participant: Participant;
  isLocal?: boolean;
  isPinned?: boolean;
  isSpeaking?: boolean;
  onPin?: () => void;
  onMute?: () => void;
  onRemove?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  participant,
  isLocal = false,
  isPinned = false,
  isSpeaking = false,
  onPin,
  onMute,
  onRemove,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', height: '100%' }}
    >
      <Paper
        elevation={isSpeaking ? 8 : 2}
        sx={{
          position: 'relative',
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: isSpeaking ? '3px solid' : '1px solid',
          borderColor: isSpeaking ? 'primary.main' : 'divider',
          bgcolor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            elevation: 4,
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Video Element */}
        {participant.isVideoOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isLocal ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.900',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                bgcolor: 'primary.main',
              }}
            >
              {participant.name.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        )}

        {/* Overlay Controls */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
              }}
            >
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participant Info */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontWeight: 600,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {participant.name} {isLocal && '(You)'}
            </Typography>
            {isPinned && <PushPin fontSize="small" sx={{ color: 'primary.main' }} />}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!participant.isMuted ? (
              <Mic fontSize="small" sx={{ color: 'white' }} />
            ) : (
              <MicOff fontSize="small" sx={{ color: 'error.main' }} />
            )}
            {!participant.isVideoOn && (
              <VideocamOff fontSize="small" sx={{ color: 'error.main' }} />
            )}
            {participant.role === 'host' && (
              <Chip
                label="Host"
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Connection Quality Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            gap: 1,
          }}
        >
          {[1, 2, 3].map((bar) => (
            <Box
              key={bar}
              sx={{
                width: 3,
                height: 4 + bar * 2,
                bgcolor: bar <= 2 ? 'success.main' : 'warning.main',
                borderRadius: 0.5,
              }}
            />
          ))}
        </Box>

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            onClick={() => {
              onPin?.();
              handleMenuClose();
            }}
          >
            <PushPin sx={{ mr: 1 }} />
            {isPinned ? 'Unpin' : 'Pin'} Video
          </MenuItem>
          {!isLocal && (
            <MenuItem
              onClick={() => {
                onMute?.();
                handleMenuClose();
              }}
            >
              <VolumeOff sx={{ mr: 1 }} />
              Mute for Me
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose}>
            <Fullscreen sx={{ mr: 1 }} />
            View Fullscreen
          </MenuItem>
          {!isLocal && (
            <MenuItem
              onClick={() => {
                onRemove?.();
                handleMenuClose();
              }}
            >
              <PersonAdd sx={{ mr: 1 }} />
              Remove Participant
            </MenuItem>
          )}
        </Menu>
      </Paper>
    </motion.div>
  );
};

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  viewMode,
  isScreenSharing,
  participants,
}) => {
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());

  // Simulate speaking detection (in real app, this would come from audio analysis)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeSpeakers = participants
        .filter((p) => p.isSpeaking || Math.random() > 0.8) // Simulate speaking
        .map((p) => p.id);
      setSpeakingParticipants(new Set(activeSpeakers));
    }, 2000);

    return () => clearInterval(interval);
  }, [participants]);

  const getGridLayout = () => {
    const totalParticipants = participants.length;

    if (viewMode === 'speaker' && pinnedParticipant) {
      return { cols: 1, rows: 1 };
    }

    if (totalParticipants <= 1) return { cols: 1, rows: 1 };
    if (totalParticipants <= 4) return { cols: 2, rows: 2 };
    if (totalParticipants <= 6) return { cols: 3, rows: 2 };
    if (totalParticipants <= 9) return { cols: 3, rows: 3 };
    return { cols: 4, rows: 3 };
  };

  const { cols, rows } = getGridLayout();

  const handlePinParticipant = (participantId: string) => {
    setPinnedParticipant(pinnedParticipant === participantId ? null : participantId);
  };

  const handleMuteParticipant = (participantId: string) => {
    // In a real app, this would send a mute request to the server
    console.log('Mute participant:', participantId);
    // You could dispatch an action to update participant state
  };

  const handleRemoveParticipant = (participantId: string) => {
    // In a real app, this would send a remove request to the server
    console.log('Remove participant:', participantId);
    // You could dispatch an action to remove participant
  };

  return (
    <Box
      sx={{
        height: '100%',
        p: 2,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 2,
        bgcolor: 'background.default',
      }}
    >
      <AnimatePresence>
        {participants.map((participant) => {
          const stream = participant.id === 'local' ? localStream : remoteStreams[participant.id];
          const isPinned = pinnedParticipant === participant.id;
          const isSpeaking = speakingParticipants.has(participant.id);

          return (
            <VideoTile
              key={participant.id}
              stream={stream || undefined}
              participant={participant}
              isLocal={participant.id === 'local'}
              isPinned={isPinned}
              isSpeaking={isSpeaking}
              onPin={() => handlePinParticipant(participant.id)}
              onMute={() => handleMuteParticipant(participant.id)}
              onRemove={() => handleRemoveParticipant(participant.id)}
            />
          );
        })}
      </AnimatePresence>
    </Box>
  );
};

export default VideoGrid;
