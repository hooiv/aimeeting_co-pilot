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
  ListItemButton,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Alert,
  Divider,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Breadcrumbs,
} from '@mui/material';
import {
  Help,
  Search,
  ExpandMore,
  VideoCall,
  Settings,
  Security,
  Integration,
  BugReport,
  Feedback,
  ContactSupport,
  Article,
  PlayCircleOutline,
  Download,
  OpenInNew,
  Phone,
  Email,
  Chat,
  School,
  QuestionAnswer,
  Lightbulb,
  Star,
  ThumbUp,
  ThumbDown,
  Share,
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Help: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  // Mock data - replace with real content
  const helpData = {
    quickStart: [
      {
        id: 1,
        title: 'Getting Started with AI Meeting Co-pilot',
        description: 'Learn the basics of scheduling and joining meetings',
        duration: '5 min read',
        category: 'Getting Started',
        icon: <VideoCall />,
      },
      {
        id: 2,
        title: 'Setting Up Your Profile',
        description: 'Configure your profile and preferences',
        duration: '3 min read',
        category: 'Setup',
        icon: <Settings />,
      },
      {
        id: 3,
        title: 'Understanding AI Insights',
        description: 'How to interpret and use AI-generated insights',
        duration: '7 min read',
        category: 'AI Features',
        icon: <Lightbulb />,
      },
    ],
    faqs: [
      {
        id: 1,
        question: 'How do I schedule a new meeting?',
        answer: 'To schedule a new meeting, click the "Schedule Meeting" button in the top navigation or go to Meetings > Schedule. Fill in the meeting details, add participants, and configure your settings.',
        category: 'Meetings',
        helpful: 45,
      },
      {
        id: 2,
        question: 'Can I record meetings automatically?',
        answer: 'Yes, you can enable automatic recording in your meeting settings. Go to Settings > Meeting Preferences and toggle "Auto-record meetings". You can also start/stop recording manually during any meeting.',
        category: 'Recording',
        helpful: 38,
      },
      {
        id: 3,
        question: 'How accurate are the AI transcriptions?',
        answer: 'Our AI transcription service achieves 95%+ accuracy for clear audio in English. Accuracy may vary based on audio quality, accents, and background noise. You can always edit transcripts after the meeting.',
        category: 'AI Features',
        helpful: 52,
      },
      {
        id: 4,
        question: 'Is my meeting data secure?',
        answer: 'Yes, we use enterprise-grade encryption for all data. Meetings are encrypted in transit and at rest. We comply with GDPR, CCPA, and SOC 2 standards. You control who has access to your meeting data.',
        category: 'Security',
        helpful: 67,
      },
      {
        id: 5,
        question: 'Can I integrate with my calendar?',
        answer: 'Yes, we support integration with Google Calendar, Outlook, and Apple Calendar. Go to Settings > Integrations to connect your calendar and enable automatic meeting sync.',
        category: 'Integrations',
        helpful: 41,
      },
    ],
    tutorials: [
      {
        id: 1,
        title: 'Complete Meeting Workflow',
        description: 'End-to-end tutorial covering scheduling, hosting, and follow-up',
        duration: '15 min video',
        level: 'Beginner',
        views: 1250,
      },
      {
        id: 2,
        title: 'Advanced AI Features',
        description: 'Deep dive into sentiment analysis, topic detection, and insights',
        duration: '20 min video',
        level: 'Advanced',
        views: 890,
      },
      {
        id: 3,
        title: 'Team Collaboration Best Practices',
        description: 'Tips for effective remote team meetings and collaboration',
        duration: '12 min video',
        level: 'Intermediate',
        views: 2100,
      },
    ],
    categories: [
      { name: 'Getting Started', count: 12, icon: <School /> },
      { name: 'Meetings', count: 18, icon: <VideoCall /> },
      { name: 'AI Features', count: 15, icon: <Lightbulb /> },
      { name: 'Recording', count: 8, icon: <PlayCircleOutline /> },
      { name: 'Security', count: 6, icon: <Security /> },
      { name: 'Integrations', count: 10, icon: <Integration /> },
    ],
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFeedback = (helpful: boolean, faqId: number) => {
    console.log(`FAQ ${faqId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Help & Support
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Find answers, tutorials, and get support for AI Meeting Co-pilot
        </Typography>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search for help articles, tutorials, or FAQs..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                  <ContactSupport />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Contact Support
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Get help from our support team
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  onClick={() => setContactDialogOpen(true)}
                >
                  Contact Us
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                  <Feedback />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Send Feedback
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Help us improve the platform
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  onClick={() => setFeedbackDialogOpen(true)}
                >
                  Give Feedback
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                  <BugReport />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Report Bug
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Report technical issues
                </Typography>
              </CardContent>
              <CardActions>
                <Button fullWidth>
                  Report Issue
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                  <Article />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Documentation
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Detailed technical docs
                </Typography>
              </CardContent>
              <CardActions>
                <Button fullWidth startIcon={<OpenInNew />}>
                  View Docs
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs Section */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="help tabs">
          <Tab icon={<QuestionAnswer />} label="FAQ" />
          <Tab icon={<PlayCircleOutline />} label="Tutorials" />
          <Tab icon={<Article />} label="Guides" />
          <Tab icon={<ContactSupport />} label="Support" />
        </Tabs>

        {/* FAQ Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Frequently Asked Questions
              </Typography>
              {helpData.faqs.map((faq) => (
                <Accordion key={faq.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {faq.question}
                      </Typography>
                      <Chip size="small" label={faq.category} variant="outlined" sx={{ mr: 2 }} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" paragraph>
                      {faq.answer}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Was this helpful?
                        </Typography>
                        <IconButton size="small" onClick={() => handleFeedback(true, faq.id)}>
                          <ThumbUp fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleFeedback(false, faq.id)}>
                          <ThumbDown fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          {faq.helpful} found this helpful
                        </Typography>
                        <IconButton size="small">
                          <Share fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Browse by Category" />
                <CardContent>
                  <List>
                    {helpData.categories.map((category) => (
                      <ListItemButton key={category.name}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            {category.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={category.name}
                          secondary={`${category.count} articles`}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tutorials Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Video Tutorials
          </Typography>
          <Grid container spacing={3}>
            {helpData.tutorials.map((tutorial) => (
              <Grid item xs={12} md={6} lg={4} key={tutorial.id}>
                <Card>
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <PlayCircleOutline fontSize="large" />
                    </IconButton>
                    <Chip
                      size="small"
                      label={tutorial.level}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {tutorial.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {tutorial.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="textSecondary">
                        {tutorial.duration}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {tutorial.views.toLocaleString()} views
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<PlayCircleOutline />}>
                      Watch
                    </Button>
                    <Button size="small" startIcon={<Download />}>
                      Download
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Guides Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Getting Started Guides
          </Typography>
          <Grid container spacing={3}>
            {helpData.quickStart.map((guide) => (
              <Grid item xs={12} md={6} key={guide.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {guide.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {guide.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {guide.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip size="small" label={guide.category} variant="outlined" />
                          <Chip size="small" label={guide.duration} color="primary" variant="outlined" />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Article />}>
                      Read Guide
                    </Button>
                    <Button size="small" startIcon={<Star />}>
                      Bookmark
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Support Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Contact Support
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Our support team typically responds within 2-4 hours during business hours (9 AM - 6 PM PST).
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                        <Chat />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Live Chat
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Get instant help from our support team
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        Available now
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button fullWidth variant="contained">
                        Start Chat
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                        <Email />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Email Support
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Send us a detailed message
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Response within 4 hours
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button fullWidth variant="outlined">
                        Send Email
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                        <Phone />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Phone Support
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Speak directly with our team
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Business hours only
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button fullWidth variant="outlined">
                        Call Now
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                        <School />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Training Session
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Schedule a personalized demo
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        30-60 minutes
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button fullWidth variant="outlined">
                        Book Session
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Support Resources" />
                <CardContent>
                  <List>
                    <ListItemButton>
                      <ListItemText
                        primary="System Status"
                        secondary="Check service availability"
                      />
                      <OpenInNew />
                    </ListItemButton>
                    <ListItemButton>
                      <ListItemText
                        primary="Release Notes"
                        secondary="Latest updates and features"
                      />
                      <OpenInNew />
                    </ListItemButton>
                    <ListItemButton>
                      <ListItemText
                        primary="API Documentation"
                        secondary="Developer resources"
                      />
                      <OpenInNew />
                    </ListItemButton>
                    <ListItemButton>
                      <ListItemText
                        primary="Community Forum"
                        secondary="Connect with other users"
                      />
                      <OpenInNew />
                    </ListItemButton>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Subject"
              placeholder="Brief description of your issue"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Priority"
              select
              defaultValue="medium"
              sx={{ mb: 2 }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </TextField>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              placeholder="Please provide detailed information about your issue"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="Your email address"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Send Message</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Feedback Type"
              select
              defaultValue="suggestion"
              sx={{ mb: 2 }}
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="general">General Feedback</option>
            </TextField>
            <TextField
              fullWidth
              label="Title"
              placeholder="Brief title for your feedback"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Details"
              multiline
              rows={4}
              placeholder="Please share your thoughts, suggestions, or report any issues"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Send Feedback</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Help;
