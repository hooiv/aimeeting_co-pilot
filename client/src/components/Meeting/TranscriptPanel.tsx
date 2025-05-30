import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search,
  Download,
  Translate,
  VolumeUp,
  PlayArrow,
  Pause,
  Settings,
  FilterList,
  Share,
  Bookmark,
  BookmarkBorder,
  MoreVert,
  RecordVoiceOver,
  SmartToy,
  Highlight,
  ContentCopy,
  Edit,
  Delete,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TranscriptEntry } from '../../store/slices/meetingSlice';

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  isTranscribing: boolean;
  currentText?: string;
  onToggleTranscription?: () => void;
  onExportTranscript?: () => void;
  onTranslateText?: (text: string, targetLanguage: string) => void;
  onBookmarkEntry?: (entryId: string) => void;
  onEditEntry?: (entryId: string, newText: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  isTranscribing,
  currentText = '',
  onToggleTranscription,
  onExportTranscript,
  onTranslateText,
  onBookmarkEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<TranscriptEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [highlightedTerms, setHighlightedTerms] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(14);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcript entries arrive
  useEffect(() => {
    if (autoScroll && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, autoScroll]);

  // Filter and search transcript entries
  const filteredTranscript = useMemo(() => {
    return transcript.filter((entry) => {
      const matchesSearch =
        !searchTerm ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.speakerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpeaker = selectedSpeaker === 'all' || entry.speakerId === selectedSpeaker;

      return matchesSearch && matchesSpeaker;
    });
  }, [transcript, searchTerm, selectedSpeaker]);

  // Get unique speakers
  const speakers = useMemo(() => {
    const uniqueSpeakers = Array.from(new Set(transcript.map((entry) => entry.speakerId))).map(
      (speakerId) => {
        const entry = transcript.find((e) => e.speakerId === speakerId);
        return {
          id: speakerId,
          name: entry?.speakerName || 'Unknown',
        };
      }
    );
    return uniqueSpeakers;
  }, [transcript]);

  // Calculate speaking statistics
  const speakingStats = useMemo(() => {
    const stats = speakers.map((speaker) => {
      const speakerEntries = transcript.filter((entry) => entry.speakerId === speaker.id);
      const totalWords = speakerEntries.reduce(
        (sum, entry) => sum + entry.content.split(' ').length,
        0
      );
      const totalTime = speakerEntries.length; // Approximate based on entries

      return {
        ...speaker,
        wordCount: totalWords,
        entryCount: speakerEntries.length,
        percentage:
          (totalWords /
            transcript.reduce((sum, entry) => sum + entry.content.split(' ').length, 0)) *
          100,
      };
    });

    return stats.sort((a, b) => b.wordCount - a.wordCount);
  }, [transcript, speakers]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entry: TranscriptEntry) => {
    setMenuAnchor(event.currentTarget);
    setSelectedEntry(entry);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEntry(null);
  };

  const handleEdit = () => {
    if (selectedEntry) {
      setEditText(selectedEntry.content);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (selectedEntry && onEditEntry) {
      onEditEntry(selectedEntry.id, editText);
    }
    setEditDialogOpen(false);
    setEditText('');
  };

  const handleTranslate = () => {
    setTranslateDialogOpen(true);
    handleMenuClose();
  };

  const handleTranslateSubmit = () => {
    if (selectedEntry && onTranslateText) {
      onTranslateText(selectedEntry.content, targetLanguage);
    }
    setTranslateDialogOpen(false);
  };

  const highlightText = (text: string, terms: string[]) => {
    if (terms.length === 0) return text;

    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (terms.some((term) => part.toLowerCase() === term.toLowerCase())) {
        return (
          <span
            key={index}
            style={{
              backgroundColor: '#ffeb3b',
              padding: '0 2px',
              borderRadius: '2px',
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const TranscriptEntry: React.FC<{ entry: TranscriptEntry; index: number }> = ({
    entry,
    index,
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <ListItem
        sx={{
          alignItems: 'flex-start',
          py: 1,
          px: 2,
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 1,
          mb: 0.5,
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              bgcolor: `hsl(${(entry.speakerId.charCodeAt(0) * 137.5) % 360}, 50%, 50%)`,
            }}
          >
            {entry.speakerName.charAt(0).toUpperCase()}
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {entry.speakerName}
              </Typography>
              {showTimestamps && (
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(entry.timestamp)}
                </Typography>
              )}
              <Chip
                label={`${Math.round(entry.confidence * 100)}%`}
                size="small"
                variant="outlined"
                color={
                  entry.confidence > 0.8 ? 'success' : entry.confidence > 0.6 ? 'warning' : 'error'
                }
                sx={{ height: 16, fontSize: '0.6rem' }}
              />
            </Box>
          }
          secondary={
            <Typography
              variant="body2"
              sx={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {highlightText(entry.content, highlightedTerms)}
            </Typography>
          }
        />

        <IconButton size="small" onClick={(e) => handleMenuOpen(e, entry)} sx={{ mt: 0.5 }}>
          <MoreVert fontSize="small" />
        </IconButton>
      </ListItem>
    </motion.div>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RecordVoiceOver color={isTranscribing ? 'primary' : 'disabled'} />
            <Typography variant="h6">{t('Live Transcript')}</Typography>
            {isTranscribing && (
              <Chip
                label="LIVE"
                size="small"
                color="error"
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Export transcript">
              <IconButton size="small" onClick={onExportTranscript}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share transcript">
              <IconButton size="small">
                <Share />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton size="small">
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Speaker</InputLabel>
            <Select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              label="Speaker"
            >
              <MenuItem value="all">All Speakers</MenuItem>
              {speakers.map((speaker) => (
                <MenuItem key={speaker.id} value={speaker.id}>
                  {speaker.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Timestamps</Typography>}
          />

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Auto-scroll</Typography>}
          />

          <Button
            size="small"
            variant="outlined"
            onClick={onToggleTranscription}
            startIcon={isTranscribing ? <Pause /> : <PlayArrow />}
          >
            {isTranscribing ? 'Pause' : 'Resume'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Transcript" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          <Box
            ref={listRef}
            sx={{
              height: '100%',
              overflow: 'auto',
              p: 1,
            }}
          >
            {/* Current speaking indicator */}
            {isTranscribing && currentText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SmartToy fontSize="small" />
                    <Typography variant="caption" fontWeight={600}>
                      LIVE TRANSCRIPTION
                    </Typography>
                    <LinearProgress
                      sx={{
                        flex: 1,
                        height: 2,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white',
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{currentText}</Typography>
                </Paper>
              </motion.div>
            )}

            {/* Transcript entries */}
            <List sx={{ py: 0 }}>
              <AnimatePresence>
                {filteredTranscript.map((entry, index) => (
                  <TranscriptEntry key={entry.id} entry={entry} index={index} />
                ))}
              </AnimatePresence>
            </List>

            {filteredTranscript.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '50%',
                  color: 'text.secondary',
                }}
              >
                <RecordVoiceOver sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body1" textAlign="center">
                  {isTranscribing ? 'Listening for speech...' : 'No transcript available yet'}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                  {isTranscribing
                    ? 'Start speaking to see live transcription'
                    : 'Enable transcription to see live captions'}
                </Typography>
              </Box>
            )}

            <div ref={transcriptEndRef} />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Speaking Analytics
            </Typography>

            {speakingStats.map((stat, index) => (
              <Box key={stat.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {stat.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.wordCount} words ({Math.round(stat.percentage)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stat.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: `hsl(${(stat.id.charCodeAt(0) * 137.5) % 360}, 50%, 50%)`,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stat.entryCount} segments
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Transcript Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {transcript.length}
                </Typography>
                <Typography variant="caption">Total Segments</Typography>
              </Paper>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {transcript.reduce((sum, entry) => sum + entry.content.split(' ').length, 0)}
                </Typography>
                <Typography variant="caption">Total Words</Typography>
              </Paper>
            </Box>
          </Box>
        </TabPanel>
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedEntry) {
              navigator.clipboard.writeText(selectedEntry.content);
            }
            handleMenuClose();
          }}
        >
          <ContentCopy sx={{ mr: 1 }} />
          Copy Text
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedEntry) {
              onBookmarkEntry?.(selectedEntry.id);
            }
            handleMenuClose();
          }}
        >
          <Bookmark sx={{ mr: 1 }} />
          Bookmark
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleTranslate}>
          <Translate sx={{ mr: 1 }} />
          Translate
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedEntry) {
              onDeleteEntry?.(selectedEntry.id);
            }
            handleMenuClose();
          }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Transcript Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Translate Dialog */}
      <Dialog open={translateDialogOpen} onClose={() => setTranslateDialogOpen(false)}>
        <DialogTitle>Translate Text</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Target Language</InputLabel>
            <Select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              label="Target Language"
            >
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="it">Italian</MenuItem>
              <MenuItem value="pt">Portuguese</MenuItem>
              <MenuItem value="ru">Russian</MenuItem>
              <MenuItem value="ja">Japanese</MenuItem>
              <MenuItem value="ko">Korean</MenuItem>
              <MenuItem value="zh">Chinese</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranslateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTranslateSubmit} variant="contained">
            Translate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TranscriptPanel;
