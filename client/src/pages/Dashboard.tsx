import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  TrendingUp,
  People,
  SmartToy,
  PlayArrow,
  MoreVert,
  Notifications,
  Analytics,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppSelector } from '../hooks/redux';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  const upcomingMeetings = [
    {
      id: '1',
      title: 'Product Strategy Review',
      time: '10:00 AM',
      participants: 8,
      status: 'starting-soon',
    },
    {
      id: '2',
      title: 'Weekly Team Standup',
      time: '2:00 PM',
      participants: 12,
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Client Presentation',
      time: '4:30 PM',
      participants: 5,
      status: 'scheduled',
    },
  ];

  const recentMeetings = [
    {
      id: '1',
      title: 'Q4 Planning Session',
      date: 'Yesterday',
      duration: '1h 45m',
      insights: 'High engagement, 5 action items',
    },
    {
      id: '2',
      title: 'Design Review',
      date: '2 days ago',
      duration: '45m',
      insights: 'Positive sentiment, 3 decisions made',
    },
  ];

  const stats = [
    {
      title: 'Meetings This Week',
      value: '12',
      change: '+15%',
      icon: <VideoCall />,
      color: '#1976d2',
    },
    {
      title: 'Total Participants',
      value: '84',
      change: '+8%',
      icon: <People />,
      color: '#2e7d32',
    },
    {
      title: 'Avg. Engagement',
      value: '87%',
      change: '+12%',
      icon: <TrendingUp />,
      color: '#ed6c02',
    },
    {
      title: 'AI Insights',
      value: '23',
      change: '+5%',
      icon: <SmartToy />,
      color: '#9c27b0',
    },
  ];

  const quickActions = [
    {
      title: 'Start Instant Meeting',
      description: 'Begin a meeting right now',
      icon: <VideoCall />,
      color: 'primary',
      action: () => console.log('Start meeting'),
    },
    {
      title: 'Schedule Meeting',
      description: 'Plan a future meeting',
      icon: <Schedule />,
      color: 'secondary',
      action: () => console.log('Schedule meeting'),
    },
    {
      title: 'View Analytics',
      description: 'Check meeting insights',
      icon: <Analytics />,
      color: 'info',
      action: () => console.log('View analytics'),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {t('dashboard.welcomeMessage')}, {user?.displayName}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your meetings today.
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        backgroundColor: `${stat.color}20`,
                        color: stat.color,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label={stat.change} size="small" color="success" variant="outlined" />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {t('dashboard.quickActions')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      p: 2,
                      height: 'auto',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{action.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Upcoming Meetings */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {t('dashboard.upcomingMeetings')}
              </Typography>
              <List>
                {upcomingMeetings.map((meeting) => (
                  <ListItem
                    key={meeting.id}
                    secondaryAction={
                      <IconButton edge="end">
                        <PlayArrow />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <VideoCall />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={meeting.title}
                      secondary={`${meeting.time} • ${meeting.participants} participants`}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        ml: 1,
                      }}
                    >
                      <Chip
                        label={meeting.status === 'starting-soon' ? 'Starting Soon' : 'Scheduled'}
                        size="small"
                        color={meeting.status === 'starting-soon' ? 'warning' : 'default'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </motion.div>
        </Grid>

        {/* Recent Meetings & AI Insights */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {t('dashboard.aiInsights')}
              </Typography>
              <List>
                {recentMeetings.map((meeting) => (
                  <ListItem
                    key={meeting.id}
                    secondaryAction={
                      <IconButton edge="end">
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <SmartToy />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={meeting.title}
                      secondary={
                        <>
                          {meeting.date} • {meeting.duration}
                          <br />
                          <span style={{ color: 'var(--mui-palette-primary-main)' }}>
                            {meeting.insights}
                          </span>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {/* Engagement Progress */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Weekly Engagement Goal
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  75% of target reached
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
