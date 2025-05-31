import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingDown,
  People,
  Schedule,
  VideoCall,
  Assessment,
  Insights,
  Download,
  Refresh,
  CalendarToday,
  Star,
  EmojiEvents,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetDashboardDataQuery,
  useGetUserAnalyticsQuery
} from '../store/api/apiSlice';

interface AnalyticsData {
  quickStats: {
    meetingsThisMonth: number;
    totalTimeThisMonth: number;
    meetingsHosted: number;
    productivityScore: number | null;
  };
  recentMeetings: Array<{
    id: string;
    title: string;
    start_time: string;
    duration: number;
    participant_count: number;
  }>;
  analytics: {
    totalMeetings: number;
    totalMeetingTime: number;
    streakDays: number;
    engagementScore: number | null;
  };
}

interface UserAnalytics {
  summary: {
    totalMeetings: number;
    totalMeetingTime: number;
    meetingsHosted: number;
    meetingsAttended: number;
    averageMeetingDuration: number;
    productivityScore: number | null;
    engagementScore: number | null;
    streakDays: number;
  };
  timeframe: {
    start: string;
    end: string;
    meetings: number;
    totalTime: number;
  };
  meetings: Array<{
    id: string;
    title: string;
    start_time: string;
    duration: number;
    participant_role: string;
  }>;
  trends: {
    meetingsPerWeek: Array<{ date: string; count: number }>;
    engagementTrend: Array<{ date: string; score: number }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30d');

  // Use RTK Query hooks
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardDataQuery(undefined);

  const {
    data: userAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useGetUserAnalyticsQuery({ timeframe });

  const loading = dashboardLoading || analyticsLoading;
  const error = dashboardError || analyticsError;

  const fetchAnalyticsData = () => {
    refetchDashboard();
    refetchAnalytics();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number | null): 'default' | 'success' | 'warning' | 'error' => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getProgressColor = (score: number | null): 'inherit' | 'success' | 'warning' | 'error' => {
    if (!score) return 'inherit';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number | null) => {
    if (!score) return <Assessment />;
    if (score >= 80) return <EmojiEvents />;
    if (score >= 60) return <Star />;
    return <TrendingDown />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={fetchAnalyticsData}>
            <Refresh />
          </IconButton>
        }>
          {error ? 'Failed to load analytics data' : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData?.data || !userAnalytics?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No analytics data available</Alert>
      </Box>
    );
  }



  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchAnalyticsData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export data">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Meetings This Month
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.quickStats.meetingsThisMonth}
                  </Typography>
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
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Time
                  </Typography>
                  <Typography variant="h4">
                    {formatDuration(dashboardData.quickStats.totalTimeThisMonth)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Schedule />
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
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Meetings Hosted
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.quickStats.meetingsHosted}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <People />
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
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Productivity Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4">
                      {dashboardData.quickStats.productivityScore || 'N/A'}
                    </Typography>
                    {dashboardData.quickStats.productivityScore && (
                      <Chip
                        size="small"
                        color={getScoreColor(dashboardData.quickStats.productivityScore)}
                        icon={getScoreIcon(dashboardData.quickStats.productivityScore)}
                        label={`${dashboardData.quickStats.productivityScore}%`}
                      />
                    )}
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Insights />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Meeting Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Meeting Activity Trends"
              subheader={`${formatDate(userAnalytics.timeframe.start)} - ${formatDate(userAnalytics.timeframe.end)}`}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userAnalytics.trends.meetingsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <RechartsTooltip
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value, 'Meetings']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                    name="Meetings per Week"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Score Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Engagement Trends" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userAnalytics.trends.engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <RechartsTooltip
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value, 'Engagement Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Meeting Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Meeting Distribution" />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Hosted', value: userAnalytics.summary.meetingsHosted },
                      { name: 'Attended', value: userAnalytics.summary.meetingsAttended },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Hosted', value: userAnalytics.summary.meetingsHosted },
                      { name: 'Attended', value: userAnalytics.summary.meetingsAttended },
                    ].map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Performance Metrics" />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Productivity Score</Typography>
                  <Typography variant="body2">
                    {userAnalytics.summary.productivityScore || 'N/A'}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={userAnalytics.summary.productivityScore || 0}
                  color={getProgressColor(userAnalytics.summary.productivityScore)}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Engagement Score</Typography>
                  <Typography variant="body2">
                    {userAnalytics.summary.engagementScore || 'N/A'}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={userAnalytics.summary.engagementScore || 0}
                  color={getProgressColor(userAnalytics.summary.engagementScore)}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Meeting Streak</Typography>
                <Chip
                  icon={<CalendarToday />}
                  label={`${userAnalytics.summary.streakDays} days`}
                  color={userAnalytics.summary.streakDays > 7 ? 'success' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Meetings and Summary */}
      <Grid container spacing={3}>
        {/* Recent Meetings */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Recent Meetings"
              subheader={`${dashboardData.recentMeetings.length} meetings`}
            />
            <CardContent sx={{ pt: 0 }}>
              <List>
                {dashboardData.recentMeetings.map((meeting: any, index: number) => (
                  <React.Fragment key={meeting.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <VideoCall />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(meeting.start_time).toLocaleDateString()} •
                              {formatDuration(meeting.duration)} •
                              {meeting.participant_count} participants
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        size="small"
                        label={formatDuration(meeting.duration)}
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < dashboardData.recentMeetings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Summary Statistics" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Meetings
                  </Typography>
                  <Typography variant="h6">
                    {userAnalytics.summary.totalMeetings}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Time
                  </Typography>
                  <Typography variant="h6">
                    {formatDuration(userAnalytics.summary.totalMeetingTime)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Average Duration
                  </Typography>
                  <Typography variant="h6">
                    {formatDuration(userAnalytics.summary.averageMeetingDuration)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    This Period
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {userAnalytics.timeframe.meetings} meetings
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">
                    Time Spent
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatDuration(userAnalytics.timeframe.totalTime)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;