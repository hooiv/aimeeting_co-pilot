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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  People,
  AccessTime,
  Download,
  Share,
  Delete,
  MoreVert,
  Visibility,
  Edit,
  Star,
  StarBorder,
  FilterList,
  Search,
  Sort,
  CalendarToday,
  TrendingUp,
  Analytics,
  PlayArrow,
  Subtitles,
  SmartToy,
  CheckCircle,
  Cancel,
  Pending,
  Error,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';

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
      id={`meeting-history-tabpanel-${index}`}
      aria-labelledby={`meeting-history-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MeetingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data - replace with real API calls
  const meetingsData = {
    summary: {
      totalMeetings: 156,
      totalDuration: '245h 32m',
      averageDuration: '1h 34m',
      thisMonth: 23,
    },
    meetings: [
      {
        id: '1',
        title: 'Weekly Team Standup',
        date: '2024-01-29T10:00:00Z',
        duration: '00:45:30',
        participants: 8,
        status: 'completed',
        hasRecording: true,
        hasTranscript: true,
        hasInsights: true,
        isStarred: true,
        host: 'John Doe',
        tags: ['standup', 'team', 'weekly'],
        summary: 'Discussed sprint progress and upcoming deliverables.',
      },
      {
        id: '2',
        title: 'Product Strategy Review',
        date: '2024-01-28T14:30:00Z',
        duration: '01:15:20',
        participants: 12,
        status: 'completed',
        hasRecording: true,
        hasTranscript: true,
        hasInsights: true,
        isStarred: false,
        host: 'Jane Smith',
        tags: ['product', 'strategy', 'review'],
        summary: 'Reviewed Q1 product roadmap and resource allocation.',
      },
      {
        id: '3',
        title: 'Client Presentation',
        date: '2024-01-27T16:00:00Z',
        duration: '00:30:15',
        participants: 5,
        status: 'completed',
        hasRecording: false,
        hasTranscript: false,
        hasInsights: false,
        isStarred: true,
        host: 'Mike Johnson',
        tags: ['client', 'presentation'],
        summary: 'Presented project proposal to client stakeholders.',
      },
      {
        id: '4',
        title: 'Sprint Planning',
        date: '2024-01-26T09:00:00Z',
        duration: '02:00:00',
        participants: 10,
        status: 'completed',
        hasRecording: true,
        hasTranscript: true,
        hasInsights: true,
        isStarred: false,
        host: 'Sarah Wilson',
        tags: ['sprint', 'planning', 'agile'],
        summary: 'Planned sprint backlog and estimated story points.',
      },
      {
        id: '5',
        title: 'All Hands Meeting',
        date: '2024-01-25T15:00:00Z',
        duration: '01:30:00',
        participants: 45,
        status: 'cancelled',
        hasRecording: false,
        hasTranscript: false,
        hasInsights: false,
        isStarred: false,
        host: 'CEO',
        tags: ['all-hands', 'company'],
        summary: 'Cancelled due to scheduling conflicts.',
      },
    ],
    upcomingMeetings: [
      {
        id: '6',
        title: 'Design Review',
        date: '2024-01-30T11:00:00Z',
        duration: '01:00:00',
        participants: 6,
        status: 'scheduled',
        host: 'Design Team',
        tags: ['design', 'review'],
      },
      {
        id: '7',
        title: 'Quarterly Business Review',
        date: '2024-01-31T14:00:00Z',
        duration: '02:30:00',
        participants: 20,
        status: 'scheduled',
        host: 'Leadership Team',
        tags: ['qbr', 'quarterly', 'business'],
      },
    ],
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, meetingId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMeeting(meetingId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMeeting(null);
  };

  const handleMeetingSelect = (meetingId: string) => {
    setSelectedMeetings(prev =>
      prev.includes(meetingId)
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId]
    );
  };

  const handleStarToggle = (meetingId: string) => {
    console.log('Toggle star for meeting:', meetingId);
  };

  const handleJoinMeeting = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleViewDetails = (meetingId: string) => {
    console.log('View meeting details:', meetingId);
  };

  const handleDownload = (meetingId: string) => {
    console.log('Download meeting:', meetingId);
  };

  const handleShare = (meetingId: string) => {
    setSelectedMeeting(meetingId);
    setShareDialogOpen(true);
  };

  const handleDelete = (meetingId: string) => {
    setSelectedMeeting(meetingId);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'scheduled':
        return <Schedule color="primary" />;
      case 'cancelled':
        return <Cancel color="error" />;
      case 'in-progress':
        return <Pending color="warning" />;
      default:
        return <Error color="error" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'cancelled':
        return 'error';
      case 'in-progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Meeting History
            </Typography>
            <Typography variant="body1" color="textSecondary">
              View and manage your past and upcoming meetings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Analytics />}>
              Export Report
            </Button>
            <Button variant="contained" startIcon={<Schedule />} onClick={() => navigate('/meetings/schedule')}>
              Schedule Meeting
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Meetings
                    </Typography>
                    <Typography variant="h4">{meetingsData.summary.totalMeetings}</Typography>
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
                      Total Duration
                    </Typography>
                    <Typography variant="h4">{meetingsData.summary.totalDuration}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <AccessTime />
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
                      Average Duration
                    </Typography>
                    <Typography variant="h4">{meetingsData.summary.averageDuration}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <TrendingUp />
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
                      This Month
                    </Typography>
                    <Typography variant="h4">{meetingsData.summary.thisMonth}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <CalendarToday />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filterBy} label="Status" onChange={(e) => setFilterBy(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                  <MenuItem value="participants">Participants</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button variant="outlined" startIcon={<FilterList />} fullWidth>
                Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs Section */}
        <Paper>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="meeting history tabs">
            <Tab icon={<VideoCall />} label="All Meetings" />
            <Tab icon={<Schedule />} label="Upcoming" />
            <Tab icon={<CheckCircle />} label="Completed" />
            <Tab icon={<Star />} label="Starred" />
          </Tabs>

          {/* All Meetings Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox />
                    </TableCell>
                    <TableCell>Meeting</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Features</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meetingsData.meetings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((meeting) => (
                    <TableRow key={meeting.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedMeetings.includes(meeting.id)}
                          onChange={() => handleMeetingSelect(meeting.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleStarToggle(meeting.id)}
                            sx={{ mr: 1 }}
                          >
                            {meeting.isStarred ? <Star color="warning" /> : <StarBorder />}
                          </IconButton>
                          <Box>
                            <Typography variant="subtitle2">{meeting.title}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Host: {meeting.host}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              {meeting.tags.slice(0, 2).map((tag) => (
                                <Chip key={tag} size="small" label={tag} variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(meeting.date)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{meeting.duration}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <People sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">{meeting.participants}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={meeting.status}
                          color={getStatusColor(meeting.status)}
                          icon={getStatusIcon(meeting.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {meeting.hasRecording && (
                            <Tooltip title="Recording Available">
                              <Chip size="small" label="REC" color="success" variant="outlined" />
                            </Tooltip>
                          )}
                          {meeting.hasTranscript && (
                            <Tooltip title="Transcript Available">
                              <Chip size="small" label="TXT" color="info" variant="outlined" />
                            </Tooltip>
                          )}
                          {meeting.hasInsights && (
                            <Tooltip title="AI Insights Available">
                              <Chip size="small" label="AI" color="secondary" variant="outlined" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {meeting.status === 'scheduled' && (
                            <Tooltip title="Join Meeting">
                              <IconButton size="small" onClick={() => handleJoinMeeting(meeting.id)}>
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(meeting.id)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, meeting.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={meetingsData.meetings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </TabPanel>

          {/* Upcoming Meetings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {meetingsData.upcomingMeetings.map((meeting) => (
                <Grid item xs={12} md={6} key={meeting.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {meeting.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Host: {meeting.host}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={meeting.status}
                          color={getStatusColor(meeting.status)}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">{formatDate(meeting.date)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">{meeting.duration}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <People sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">{meeting.participants} participants</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                        {meeting.tags.map((tag) => (
                          <Chip key={tag} size="small" label={tag} variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<PlayArrow />} onClick={() => handleJoinMeeting(meeting.id)}>
                        Join
                      </Button>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, meeting.id)}>
                        <MoreVert />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Completed Meetings Tab */}
          <TabPanel value={tabValue} index={2}>
            <List>
              {meetingsData.meetings
                .filter(meeting => meeting.status === 'completed')
                .map((meeting) => (
                  <React.Fragment key={meeting.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <CheckCircle />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(meeting.date)} • {meeting.duration} • {meeting.participants} participants
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              {meeting.summary}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              {meeting.tags.map((tag) => (
                                <Chip key={tag} size="small" label={tag} variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {meeting.hasRecording && (
                            <Tooltip title="View Recording">
                              <IconButton size="small">
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          {meeting.hasTranscript && (
                            <Tooltip title="View Transcript">
                              <IconButton size="small">
                                <Subtitles />
                              </IconButton>
                            </Tooltip>
                          )}
                          {meeting.hasInsights && (
                            <Tooltip title="View AI Insights">
                              <IconButton size="small">
                                <SmartToy />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, meeting.id)}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </TabPanel>

          {/* Starred Meetings Tab */}
          <TabPanel value={tabValue} index={3}>
            <List>
              {meetingsData.meetings
                .filter(meeting => meeting.isStarred)
                .map((meeting) => (
                  <React.Fragment key={meeting.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <Star />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(meeting.date)} • {meeting.duration} • Host: {meeting.host}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                size="small"
                                label={meeting.status}
                                color={getStatusColor(meeting.status)}
                              />
                              {meeting.tags.map((tag) => (
                                <Chip key={tag} size="small" label={tag} variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={() => handleViewDetails(meeting.id)}>
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, meeting.id)}>
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
          <MenuItem onClick={() => { handleViewDetails(selectedMeeting!); handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem onClick={() => { handleJoinMeeting(selectedMeeting!); handleMenuClose(); }}>
            <PlayArrow sx={{ mr: 1 }} />
            Join/Replay
          </MenuItem>
          <MenuItem onClick={() => { handleDownload(selectedMeeting!); handleMenuClose(); }}>
            <Download sx={{ mr: 1 }} />
            Download
          </MenuItem>
          <MenuItem onClick={() => { handleShare(selectedMeeting!); handleMenuClose(); }}>
            <Share sx={{ mr: 1 }} />
            Share
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleDelete(selectedMeeting!); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Meeting</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Share Meeting</DialogTitle>
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
                label="Include recording"
              />
              <FormControlLabel
                control={<Checkbox />}
                label="Include transcript"
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
    </LocalizationProvider>
  );
};

export default MeetingHistory;
