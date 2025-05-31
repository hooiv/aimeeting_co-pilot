import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Share,
  Delete,
  MoreVert,
  VideoCall,
  Mic,
  Subtitles,
  CloudUpload,
  Search,
  FilterList,
  Sort,
  Folder,
  Star,
  StarBorder,
  Visibility,
  Edit,
  Schedule,
  People,
  AccessTime,
  FileDownload,
  CloudDownload,
} from '@mui/icons-material';

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
      id={`recordings-tabpanel-${index}`}
      aria-labelledby={`recordings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Recordings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');

  // Mock data - replace with real API calls
  const recordingsData = {
    summary: {
      totalRecordings: 156,
      totalSize: '12.4 GB',
      totalDuration: '45h 32m',
      storageUsed: 68, // percentage
    },
    recordings: [
      {
        id: '1',
        title: 'Weekly Team Standup',
        date: '2024-01-29T10:00:00Z',
        duration: '00:45:30',
        size: '245 MB',
        participants: 8,
        hasVideo: true,
        hasAudio: true,
        hasTranscript: true,
        isStarred: true,
        status: 'processed',
        thumbnail: '/api/recordings/1/thumbnail',
        tags: ['standup', 'team', 'weekly'],
      },
      {
        id: '2',
        title: 'Product Strategy Review',
        date: '2024-01-28T14:30:00Z',
        duration: '01:15:20',
        size: '512 MB',
        participants: 12,
        hasVideo: true,
        hasAudio: true,
        hasTranscript: true,
        isStarred: false,
        status: 'processing',
        thumbnail: '/api/recordings/2/thumbnail',
        tags: ['product', 'strategy', 'review'],
      },
      {
        id: '3',
        title: 'Client Presentation',
        date: '2024-01-27T16:00:00Z',
        duration: '00:30:15',
        size: '180 MB',
        participants: 5,
        hasVideo: true,
        hasAudio: true,
        hasTranscript: false,
        isStarred: true,
        status: 'processed',
        thumbnail: '/api/recordings/3/thumbnail',
        tags: ['client', 'presentation'],
      },
    ],
    folders: [
      { id: '1', name: 'Team Meetings', count: 45, size: '3.2 GB' },
      { id: '2', name: 'Client Calls', count: 23, size: '1.8 GB' },
      { id: '3', name: 'Training Sessions', count: 12, size: '2.1 GB' },
      { id: '4', name: 'All Hands', count: 8, size: '1.5 GB' },
    ],
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, recordingId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedRecording(recordingId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedRecording(null);
  };

  const handleRecordingSelect = (recordingId: string) => {
    setSelectedRecordings(prev =>
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  };

  const handleStarToggle = (recordingId: string) => {
    // Toggle star status
    console.log('Toggle star for recording:', recordingId);
  };

  const handlePlay = (recordingId: string) => {
    console.log('Play recording:', recordingId);
  };

  const handleDownload = (recordingId: string) => {
    console.log('Download recording:', recordingId);
  };

  const handleShare = (recordingId: string) => {
    setSelectedRecording(recordingId);
    setShareDialogOpen(true);
  };

  const handleDelete = (recordingId: string) => {
    setSelectedRecording(recordingId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Recordings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage and access your meeting recordings, transcripts, and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<CloudUpload />}>
            Upload
          </Button>
          <Button variant="contained" startIcon={<VideoCall />}>
            New Recording
          </Button>
        </Box>
      </Box>

      {/* Storage Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Recordings
                  </Typography>
                  <Typography variant="h4">{recordingsData.summary.totalRecordings}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <VideoCall />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Size
                  </Typography>
                  <Typography variant="h4">{recordingsData.summary.totalSize}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CloudDownload />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Duration
                  </Typography>
                  <Typography variant="h4">{recordingsData.summary.totalDuration}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AccessTime />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Storage Used
                </Typography>
                <Typography variant="h4">{recordingsData.summary.storageUsed}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={recordingsData.summary.storageUsed}
                  sx={{ mt: 1 }}
                  color={recordingsData.summary.storageUsed > 80 ? 'error' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="duration">Duration</MenuItem>
                <MenuItem value="size">Size</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select value={filterBy} label="Filter" onChange={(e) => setFilterBy(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="starred">Starred</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio Only</MenuItem>
                <MenuItem value="transcribed">Transcribed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<FilterList />}>
                Advanced Filters
              </Button>
              <Button variant="outlined" startIcon={<Sort />}>
                Bulk Actions
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Section */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="recordings tabs">
          <Tab icon={<VideoCall />} label="All Recordings" />
          <Tab icon={<Folder />} label="Folders" />
          <Tab icon={<Star />} label="Starred" />
          <Tab icon={<Schedule />} label="Recent" />
        </Tabs>
        {/* All Recordings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {recordingsData.recordings.map((recording) => (
              <Grid item xs={12} md={6} lg={4} key={recording.id}>
                <Card>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: `url(${recording.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <IconButton
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        }}
                        onClick={() => handlePlay(recording.id)}
                      >
                        <PlayArrow fontSize="large" />
                      </IconButton>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                        onClick={() => handleStarToggle(recording.id)}
                      >
                        {recording.isStarred ? <Star color="warning" /> : <StarBorder />}
                      </IconButton>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                      <Chip
                        size="small"
                        label={recording.duration}
                        sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                      />
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {recording.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {formatDate(recording.date)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={recording.status}
                        color={getStatusColor(recording.status)}
                      />
                      {recording.hasVideo && <Chip size="small" label="Video" variant="outlined" />}
                      {recording.hasAudio && <Chip size="small" label="Audio" variant="outlined" />}
                      {recording.hasTranscript && <Chip size="small" label="Transcript" variant="outlined" />}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          {recording.participants} participants • {recording.size}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<PlayArrow />} onClick={() => handlePlay(recording.id)}>
                      Play
                    </Button>
                    <Button size="small" startIcon={<Download />} onClick={() => handleDownload(recording.id)}>
                      Download
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, recording.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Folders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {recordingsData.folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} key={folder.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Folder />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{folder.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {folder.count} recordings • {folder.size}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Starred Tab */}
        <TabPanel value={tabValue} index={2}>
          <List>
            {recordingsData.recordings
              .filter(recording => recording.isStarred)
              .map((recording) => (
                <React.Fragment key={recording.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <VideoCall />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={recording.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(recording.date)} • {recording.duration} • {recording.participants} participants
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {recording.tags.map((tag) => (
                              <Chip key={tag} size="small" label={tag} variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handlePlay(recording.id)}>
                        <PlayArrow />
                      </IconButton>
                      <IconButton onClick={(e) => handleMenuOpen(e, recording.id)}>
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
          </List>
        </TabPanel>

        {/* Recent Tab */}
        <TabPanel value={tabValue} index={3}>
          <List>
            {recordingsData.recordings
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((recording) => (
                <React.Fragment key={recording.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <VideoCall />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={recording.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(recording.date)} • {recording.duration} • {recording.size}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              size="small"
                              label={recording.status}
                              color={getStatusColor(recording.status)}
                            />
                            {recording.hasTranscript && (
                              <Chip size="small" label="Transcript Available" color="success" variant="outlined" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handlePlay(recording.id)}>
                        <PlayArrow />
                      </IconButton>
                      <IconButton onClick={(e) => handleMenuOpen(e, recording.id)}>
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handlePlay(selectedRecording!); handleMenuClose(); }}>
          <PlayArrow sx={{ mr: 1 }} />
          Play
        </MenuItem>
        <MenuItem onClick={() => { handleDownload(selectedRecording!); handleMenuClose(); }}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={() => { handleShare(selectedRecording!); handleMenuClose(); }}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem>
          <Edit sx={{ mr: 1 }} />
          Edit Details
        </MenuItem>
        <MenuItem>
          <Subtitles sx={{ mr: 1 }} />
          View Transcript
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleDelete(selectedRecording!); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this recording? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Recording</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Share with (email addresses)"
              placeholder="Enter email addresses separated by commas"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Allow download"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Require password"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Send notification email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Share</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recordings;
