import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Paper,
} from '@mui/material';
import {
  SmartToy,
  TrendingUp,
  Psychology,
  Lightbulb,
  Assignment,
  Timeline,
  Refresh,
  Download,
  FilterList,
  Insights,
  AutoAwesome,
  Analytics,
  EmojiObjects,
  CheckCircle,
  Warning,
  Info,
  Star,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

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
      id={`ai-insights-tabpanel-${index}`}
      aria-labelledby={`ai-insights-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIInsights: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with real API calls
  const insightsData = {
    summary: {
      totalInsights: 247,
      actionableItems: 89,
      averageConfidence: 87,
      trendsDetected: 15,
    },
    sentimentTrends: [
      { date: '2024-01-01', positive: 75, neutral: 20, negative: 5 },
      { date: '2024-01-08', positive: 80, neutral: 15, negative: 5 },
      { date: '2024-01-15', positive: 70, neutral: 25, negative: 5 },
      { date: '2024-01-22', positive: 85, neutral: 12, negative: 3 },
      { date: '2024-01-29', positive: 78, neutral: 18, negative: 4 },
    ],
    topicDistribution: [
      { name: 'Product Development', value: 35, color: '#8884d8' },
      { name: 'Marketing Strategy', value: 25, color: '#82ca9d' },
      { name: 'Team Management', value: 20, color: '#ffc658' },
      { name: 'Budget Planning', value: 15, color: '#ff7300' },
      { name: 'Other', value: 5, color: '#00ff00' },
    ],
    recentInsights: [
      {
        id: 1,
        type: 'trend',
        title: 'Increased Focus on AI Integration',
        description: 'Detected 40% increase in AI-related discussions across meetings',
        confidence: 92,
        timestamp: '2024-01-29T10:30:00Z',
        actionable: true,
      },
      {
        id: 2,
        type: 'sentiment',
        title: 'Positive Team Morale Trend',
        description: 'Team sentiment has improved by 15% over the past two weeks',
        confidence: 88,
        timestamp: '2024-01-29T09:15:00Z',
        actionable: false,
      },
      {
        id: 3,
        type: 'action',
        title: 'Recurring Action Items',
        description: 'Budget review appears in 80% of leadership meetings',
        confidence: 95,
        timestamp: '2024-01-28T16:45:00Z',
        actionable: true,
      },
    ],
    performanceMetrics: [
      { metric: 'Meeting Efficiency', current: 78, target: 85, trend: 'up' },
      { metric: 'Decision Speed', current: 82, target: 80, trend: 'up' },
      { metric: 'Follow-up Rate', current: 65, target: 75, trend: 'down' },
      { metric: 'Engagement Score', current: 89, target: 85, trend: 'up' },
    ],
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeframeChange = (event: any) => {
    setTimeframe(event.target.value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp color="primary" />;
      case 'sentiment':
        return <Psychology color="secondary" />;
      case 'action':
        return <Assignment color="warning" />;
      default:
        return <Lightbulb color="info" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Insights
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Discover patterns, trends, and actionable insights from your meetings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select value={timeframe} label="Timeframe" onChange={handleTimeframeChange}>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Export
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
                    Total Insights
                  </Typography>
                  <Typography variant="h4">{insightsData.summary.totalInsights}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToy />
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
                    Actionable Items
                  </Typography>
                  <Typography variant="h4">{insightsData.summary.actionableItems}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Assignment />
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
                    Avg Confidence
                  </Typography>
                  <Typography variant="h4">{insightsData.summary.averageConfidence}%</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Analytics />
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
                    Trends Detected
                  </Typography>
                  <Typography variant="h4">{insightsData.summary.trendsDetected}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ai insights tabs">
          <Tab icon={<Insights />} label="Overview" />
          <Tab icon={<Psychology />} label="Sentiment Analysis" />
          <Tab icon={<EmojiObjects />} label="Topic Insights" />
          <Tab icon={<Timeline />} label="Performance" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Recent Insights */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader title="Recent AI Insights" />
                <CardContent>
                  <List>
                    {insightsData.recentInsights.map((insight, index) => (
                      <React.Fragment key={insight.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>{getInsightIcon(insight.type)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">{insight.title}</Typography>
                                <Chip
                                  size="small"
                                  label={`${insight.confidence}%`}
                                  color={getConfidenceColor(insight.confidence)}
                                />
                                {insight.actionable && (
                                  <Chip size="small" label="Actionable" color="success" variant="outlined" />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {insight.description}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(insight.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < insightsData.recentInsights.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader title="Quick Actions" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<AutoAwesome />} fullWidth>
                      Generate Report
                    </Button>
                    <Button variant="outlined" startIcon={<FilterList />} fullWidth>
                      Filter Insights
                    </Button>
                    <Button variant="outlined" startIcon={<Star />} fullWidth>
                      Mark Favorites
                    </Button>
                    <Button variant="outlined" startIcon={<Download />} fullWidth>
                      Export Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sentiment Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader title="Sentiment Trends Over Time" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={insightsData.sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="positive"
                        stackId="1"
                        stroke="#4caf50"
                        fill="#4caf50"
                        name="Positive"
                      />
                      <Area
                        type="monotone"
                        dataKey="neutral"
                        stackId="1"
                        stroke="#ff9800"
                        fill="#ff9800"
                        name="Neutral"
                      />
                      <Area
                        type="monotone"
                        dataKey="negative"
                        stackId="1"
                        stroke="#f44336"
                        fill="#f44336"
                        name="Negative"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader title="Sentiment Summary" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="success" icon={<CheckCircle />}>
                      Overall sentiment is positive with 78% positive feedback
                    </Alert>
                    <Alert severity="warning" icon={<Warning />}>
                      Slight increase in neutral sentiment detected
                    </Alert>
                    <Alert severity="info" icon={<Info />}>
                      Negative sentiment remains consistently low at 4%
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Topic Insights Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Topic Distribution" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insightsData.topicDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {insightsData.topicDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Trending Topics" />
                <CardContent>
                  <List>
                    {insightsData.topicDistribution.map((topic, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: topic.color, width: 24, height: 24 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={topic.name}
                          secondary={`${topic.value}% of discussions`}
                        />
                        <Chip
                          size="small"
                          label={index < 2 ? 'Trending' : 'Stable'}
                          color={index < 2 ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Meeting Performance Metrics" />
                <CardContent>
                  <Grid container spacing={3}>
                    {insightsData.performanceMetrics.map((metric, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" gutterBottom>
                            {metric.metric}
                          </Typography>
                          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress
                              variant="determinate"
                              value={metric.current}
                              size={80}
                              thickness={4}
                              color={metric.current >= metric.target ? 'success' : 'warning'}
                            />
                            <Box
                              sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="caption" component="div" color="text.secondary">
                                {metric.current}%
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Target: {metric.target}%
                          </Typography>
                          <Chip
                            size="small"
                            label={metric.trend === 'up' ? '↗ Improving' : '↘ Declining'}
                            color={metric.trend === 'up' ? 'success' : 'error'}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AIInsights;
