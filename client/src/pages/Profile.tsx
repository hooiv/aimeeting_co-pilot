import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  TextField,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Email,
  Phone,
  Business,
  LocationOn,
  Language,
  Schedule,
  EmojiEvents,
  TrendingUp,
  VideoCall,
  Star,
  LinkedIn,
  Twitter,
  GitHub,
  Language as WebIcon,
  Add,
  Delete,
} from '@mui/icons-material';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../store/api/apiSlice';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  // API hooks
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useGetProfileQuery(undefined);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    bio: '',
    title: '',
    company: '',
    department: '',
    phone: '',
    location: '',
    website: '',
    linkedinUrl: '',
    twitterUrl: '',
    githubUrl: '',
    skills: [] as string[],
    interests: [] as string[],
  });

  React.useEffect(() => {
    if (profileData?.data) {
      const { user, profile } = profileData.data;
      setFormData({
        displayName: user.displayName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        title: user.title || '',
        company: user.company || '',
        department: user.department || '',
        phone: user.phone || '',
        location: profile.location || '',
        website: profile.website || '',
        linkedinUrl: profile.linkedinUrl || '',
        twitterUrl: profile.twitterUrl || '',
        githubUrl: profile.githubUrl || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
      });
    }
  }, [profileData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap();
      setEditMode(false);
      refetch();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        await uploadAvatar(formData).unwrap();
        setAvatarDialogOpen(false);
        refetch();
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      }
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove),
    }));
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
        <Alert severity="error">Failed to load profile data</Alert>
      </Box>
    );
  }

  if (!profileData?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No profile data available</Alert>
      </Box>
    );
  }

  const { user, profile, analytics } = profileData.data;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  size="small"
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              }
            >
              <Avatar
                src={profile.avatarUrl || user.photoUrl}
                sx={{ width: 120, height: 120 }}
              >
                {user.displayName?.charAt(0)}
              </Avatar>
            </Badge>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {user.displayName}
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {user.title} {user.company && `at ${user.company}`}
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {user.bio}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {user.email && (
                <Chip icon={<Email />} label={user.email} variant="outlined" />
              )}
              {user.phone && (
                <Chip icon={<Phone />} label={user.phone} variant="outlined" />
              )}
              {profile.location && (
                <Chip icon={<LocationOn />} label={profile.location} variant="outlined" />
              )}
            </Box>
          </Grid>
          <Grid item>
            <Button
              variant={editMode ? "outlined" : "contained"}
              startIcon={<Edit />}
              onClick={() => setEditMode(!editMode)}
              disabled={isUpdating}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
            {editMode && (
              <Button
                variant="contained"
                sx={{ ml: 1 }}
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? <CircularProgress size={20} /> : 'Save'}
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Section */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Overview" />
          <Tab label="Personal Info" />
          <Tab label="Skills & Interests" />
          <Tab label="Analytics" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Quick Stats */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Quick Stats" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <VideoCall color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Meetings"
                        secondary={analytics.totalMeetings}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Time"
                        secondary={`${Math.floor(analytics.totalMeetingTime / 60)}h ${analytics.totalMeetingTime % 60}m`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEvents color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Streak Days"
                        secondary={analytics.streakDays}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Social Links */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Social Links" />
                <CardContent>
                  <List>
                    {profile.linkedinUrl && (
                      <ListItem>
                        <ListItemIcon>
                          <LinkedIn color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="LinkedIn"
                          secondary={
                            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          }
                        />
                      </ListItem>
                    )}
                    {profile.twitterUrl && (
                      <ListItem>
                        <ListItemIcon>
                          <Twitter color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Twitter"
                          secondary={
                            <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          }
                        />
                      </ListItem>
                    )}
                    {profile.githubUrl && (
                      <ListItem>
                        <ListItemIcon>
                          <GitHub color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="GitHub"
                          secondary={
                            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          }
                        />
                      </ListItem>
                    )}
                    {profile.website && (
                      <ListItem>
                        <ListItemIcon>
                          <WebIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Website"
                          secondary={
                            <a href={profile.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                            </a>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Scores */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Performance" />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Productivity Score</Typography>
                      <Typography variant="body2">
                        {analytics.productivityScore || 'N/A'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.productivityScore || 0}
                      color={analytics.productivityScore && analytics.productivityScore >= 80 ? 'success' : 'primary'}
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Engagement Score</Typography>
                      <Typography variant="body2">
                        {analytics.engagementScore || 'N/A'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.engagementScore || 0}
                      color={analytics.engagementScore && analytics.engagementScore >= 80 ? 'success' : 'primary'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Personal Info Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={handleInputChange('displayName')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                disabled={!editMode}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={handleInputChange('company')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={handleInputChange('department')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                value={formData.linkedinUrl}
                onChange={handleInputChange('linkedinUrl')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Twitter URL"
                value={formData.twitterUrl}
                onChange={handleInputChange('twitterUrl')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GitHub URL"
                value={formData.githubUrl}
                onChange={handleInputChange('githubUrl')}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Skills & Interests Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Skills Section */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Skills" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {formData.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={editMode ? () => removeSkill(skill) : undefined}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  {editMode && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <IconButton onClick={addSkill} color="primary">
                        <Add />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Interests Section */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Interests" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {formData.interests.map((interest) => (
                      <Chip
                        key={interest}
                        label={interest}
                        onDelete={editMode ? () => removeInterest(interest) : undefined}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  {editMode && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add an interest"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      />
                      <IconButton onClick={addInterest} color="secondary">
                        <Add />
                      </IconButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Meeting Statistics" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <VideoCall color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Meetings"
                        secondary={analytics.totalMeetings}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Meetings Hosted"
                        secondary={analytics.meetingsHosted}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Star color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Meetings Attended"
                        secondary={analytics.meetingsAttended}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Time Analytics" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Meeting Time"
                        secondary={`${Math.floor(analytics.totalMeetingTime / 60)}h ${analytics.totalMeetingTime % 60}m`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Average Duration"
                        secondary={`${Math.floor(analytics.averageMeetingDuration / 60)}h ${analytics.averageMeetingDuration % 60}m`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEvents color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Current Streak"
                        secondary={`${analytics.streakDays} days`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Performance Scores" />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Productivity Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={analytics.productivityScore || 0}
                        sx={{ flexGrow: 1 }}
                        color={analytics.productivityScore && analytics.productivityScore >= 80 ? 'success' : 'primary'}
                      />
                      <Typography variant="body2">
                        {analytics.productivityScore || 'N/A'}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Engagement Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={analytics.engagementScore || 0}
                        sx={{ flexGrow: 1 }}
                        color={analytics.engagementScore && analytics.engagementScore >= 80 ? 'success' : 'primary'}
                      />
                      <Typography variant="body2">
                        {analytics.engagementScore || 'N/A'}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Upload Avatar</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Choose a new profile picture. Supported formats: JPG, PNG, GIF, WebP (max 5MB)
          </Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarUpload}
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<PhotoCamera />}
              disabled={isUploading}
              fullWidth
              sx={{ mt: 2 }}
            >
              {isUploading ? <CircularProgress size={20} /> : 'Choose File'}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;