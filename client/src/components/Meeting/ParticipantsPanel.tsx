import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  VolumeUp,
  VolumeOff,
  PersonAdd,
  PersonRemove,
  Security,
  AdminPanelSettings,
  Star,
  StarBorder,
  NetworkCheck,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  Schedule,
  TrendingUp,
  Psychology,
  EmojiEmotions,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Participant } from '../../store/slices/meetingSlice';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId?: string;
  isHost?: boolean;
  onMuteParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onPromoteToHost?: (participantId: string) => void;
  onInviteParticipant?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>;
};

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUserId,
  isHost = false,
  onMuteParticipant,
  onRemoveParticipant,
  onPromoteToHost,
  onInviteParticipant,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showOfflineParticipants, setShowOfflineParticipants] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'joinTime' | 'speakingTime'>('name');

  // Filter and sort participants
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter((participant) => {
      const matchesSearch =
        participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOnlineFilter = showOfflineParticipants || participant.isOnline;
      return matchesSearch && matchesOnlineFilter;
    });

    // Sort participants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'joinTime':
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        case 'speakingTime':
          return (b.speakingTime || 0) - (a.speakingTime || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [participants, searchTerm, showOfflineParticipants, sortBy]);

  // Group participants by status
  const participantGroups = useMemo(() => {
    const online = filteredParticipants.filter((p) => p.isOnline);
    const offline = filteredParticipants.filter((p) => !p.isOnline);
    const hosts = online.filter((p) => p.role === 'host');
    const moderators = online.filter((p) => p.role === 'moderator');
    const regular = online.filter((p) => p.role === 'participant');

    return { online, offline, hosts, moderators, regular };
  }, [filteredParticipants]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, participant: Participant) => {
    setMenuAnchor(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedParticipant(null);
  };

  const getNetworkQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <SignalWifi4Bar color="success" fontSize="small" />;
      case 'good':
        return <SignalWifi3Bar color="primary" fontSize="small" />;
      case 'fair':
        return <SignalWifi2Bar color="warning" fontSize="small" />;
      case 'poor':
        return <SignalWifi1Bar color="error" fontSize="small" />;
      default:
        return <SignalWifiOff color="disabled" fontSize="small" />;
    }
  };

  const getParticipantStatus = (participant: Participant) => {
    if (!participant.isOnline) return 'offline';
    if (participant.isSpeaking) return 'speaking';
    if (participant.isHandRaised) return 'hand-raised';
    return 'online';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'speaking':
        return 'primary';
      case 'hand-raised':
        return 'warning';
      case 'online':
        return 'success';
      case 'offline':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const ParticipantItem: React.FC<{ participant: Participant; showDetails?: boolean }> = ({
    participant,
    showDetails = false,
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <ListItem
        sx={{
          borderRadius: 1,
          mb: 0.5,
          bgcolor: participant.id === currentUserId ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(getParticipantStatus(participant)) + '.main',
                  border: '2px solid white',
                }}
              />
            }
          >
            <Avatar
              src={participant.photoUrl}
              sx={{
                width: 40,
                height: 40,
                border: participant.isSpeaking ? '2px solid' : 'none',
                borderColor: 'primary.main',
              }}
            >
              {participant.name.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={participant.isSpeaking ? 600 : 400}>
                {participant.name}
                {participant.id === currentUserId && ' (You)'}
              </Typography>
              {participant.role === 'host' && (
                <Chip
                  icon={<AdminPanelSettings />}
                  label="Host"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {participant.role === 'moderator' && (
                <Chip
                  icon={<Security />}
                  label="Mod"
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {participant.isMuted ? (
                  <MicOff fontSize="small" color="error" />
                ) : (
                  <Mic fontSize="small" color="success" />
                )}
                {participant.isVideoOn ? (
                  <Videocam fontSize="small" color="success" />
                ) : (
                  <VideocamOff fontSize="small" color="error" />
                )}
                {getNetworkQualityIcon(participant.networkQuality || 'good')}
              </Box>

              {showDetails && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {participant.speakingTime ? formatDuration(participant.speakingTime) : '0:00'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(participant.joinedAt).toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
            </Box>
          }
        />

        <ListItemSecondaryAction>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, participant)}
            disabled={!isHost && participant.id !== currentUserId}
          >
            <MoreVert />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </motion.div>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {t('Participants')} ({participantGroups.online.length})
          </Typography>
          {isHost && (
            <Tooltip title="Invite participants">
              <IconButton size="small" onClick={() => setInviteDialogOpen(true)}>
                <PersonAdd />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search participants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showOfflineParticipants}
                onChange={(e) => setShowOfflineParticipants(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption">
                Show offline ({participantGroups.offline.length})
              </Typography>
            }
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="All" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <List sx={{ py: 1 }}>
            <AnimatePresence>
              {/* Hosts */}
              {participantGroups.hosts.length > 0 && (
                <>
                  <ListItem>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      HOSTS
                    </Typography>
                  </ListItem>
                  {participantGroups.hosts.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}

              {/* Moderators */}
              {participantGroups.moderators.length > 0 && (
                <>
                  <ListItem>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      MODERATORS
                    </Typography>
                  </ListItem>
                  {participantGroups.moderators.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                  <Divider sx={{ my: 1 }} />
                </>
              )}

              {/* Regular participants */}
              {participantGroups.regular.length > 0 && (
                <>
                  <ListItem>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PARTICIPANTS
                    </Typography>
                  </ListItem>
                  {participantGroups.regular.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </>
              )}

              {/* Offline participants */}
              {showOfflineParticipants && participantGroups.offline.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      OFFLINE
                    </Typography>
                  </ListItem>
                  {participantGroups.offline.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </>
              )}
            </AnimatePresence>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Speaking Time Distribution
            </Typography>
            {participantGroups.online.map((participant) => (
              <Box key={participant.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">{participant.name}</Typography>
                  <Typography variant="caption">
                    {participant.speakingTime ? formatDuration(participant.speakingTime) : '0:00'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((participant.speakingTime || 0) / 300) * 100, 100)}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            ))}
          </Box>
        </TabPanel>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        {selectedParticipant &&
          isHost &&
          selectedParticipant.id !== currentUserId && [
            <MenuItem
              key="mute"
              onClick={() => {
                onMuteParticipant?.(selectedParticipant.id);
                handleMenuClose();
              }}
            >
              {selectedParticipant.isMuted ? (
                <VolumeUp sx={{ mr: 1 }} />
              ) : (
                <VolumeOff sx={{ mr: 1 }} />
              )}
              {selectedParticipant.isMuted ? 'Unmute' : 'Mute'}
            </MenuItem>,
            <MenuItem
              key="promote"
              onClick={() => {
                onPromoteToHost?.(selectedParticipant.id);
                handleMenuClose();
              }}
            >
              <Star sx={{ mr: 1 }} />
              Make Host
            </MenuItem>,
            <MenuItem
              key="remove"
              onClick={() => {
                onRemoveParticipant?.(selectedParticipant.id);
                handleMenuClose();
              }}
            >
              <PersonRemove sx={{ mr: 1 }} />
              Remove
            </MenuItem>,
          ]}
      </Menu>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
        <DialogTitle>Invite Participants</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email addresses"
            placeholder="Enter email addresses separated by commas"
            multiline
            rows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onInviteParticipant?.();
              setInviteDialogOpen(false);
            }}
          >
            Send Invites
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ParticipantsPanel;
