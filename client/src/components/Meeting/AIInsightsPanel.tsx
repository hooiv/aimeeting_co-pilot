import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  SmartToy,
  TrendingUp,
  Psychology,
  Assignment,
  ExpandMore,
  ThumbUp,
  ThumbDown,
  Share,
  Download,
  Lightbulb,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  Topic,
  Mood,
  Analytics,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface AIInsight {
  id: string;
  type: 'sentiment' | 'topic' | 'summary' | 'action_item' | 'key_point' | 'recommendation';
  title: string;
  content: string;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  isProcessing: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

const SentimentCard: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const sentimentInsights = insights.filter((i) => i.type === 'sentiment');
  const latestSentiment = sentimentInsights[sentimentInsights.length - 1];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      case 'neutral':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Mood color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Meeting Sentiment</Typography>
        </Box>

        {latestSentiment ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                label={latestSentiment.metadata?.sentiment || 'Neutral'}
                color={getSentimentColor(latestSentiment.metadata?.sentiment)}
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(latestSentiment.confidence * 100)}% confidence
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={latestSentiment.confidence * 100}
              sx={{ mb: 1 }}
            />

            <Typography variant="body2">{latestSentiment.content}</Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Analyzing meeting sentiment...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const TopicsCard: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const topicInsights = insights.filter((i) => i.type === 'topic');

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Topic color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Key Topics</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {topicInsights.map((insight) => (
            <Chip
              key={insight.id}
              label={insight.title}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
          ))}
        </Box>

        {topicInsights.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Identifying discussion topics...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ActionItemsCard: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const actionItems = insights.filter((i) => i.type === 'action_item');

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Assignment color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Action Items</Typography>
        </Box>

        <List dense>
          {actionItems.map((item) => (
            <ListItem key={item.id} sx={{ px: 0 }}>
              <ListItemIcon>
                <CheckCircle color="action" />
              </ListItemIcon>
              <ListItemText primary={item.title} secondary={item.content} />
            </ListItem>
          ))}
        </List>

        {actionItems.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No action items identified yet...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const RecommendationsCard: React.FC<{ insights: AIInsight[] }> = ({ insights }) => {
  const recommendations = insights.filter((i) => i.type === 'recommendation');

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Lightbulb color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">AI Recommendations</Typography>
        </Box>

        {recommendations.map((rec) => (
          <Accordion key={rec.id} elevation={0}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">{rec.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">{rec.content}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        {recommendations.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Generating recommendations...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights, isProcessing }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFeedback = (insightId: string, isPositive: boolean) => {
    console.log('Feedback for insight:', insightId, isPositive ? 'positive' : 'negative');
  };

  const handleExport = () => {
    console.log('Export insights');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">AI Insights</Typography>
          </Box>
          <Box>
            <Tooltip title="Export insights">
              <IconButton size="small" onClick={handleExport}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share insights">
              <IconButton size="small">
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {isProcessing && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">
              Analyzing meeting content...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <SentimentCard insights={insights} />
            <TopicsCard insights={insights} />
            <ActionItemsCard insights={insights} />
            <RecommendationsCard insights={insights} />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Card elevation={2} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Meeting Analytics</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Speaking Time Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>JD</Avatar>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      John Doe
                    </Typography>
                    <Typography variant="body2">45%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={45} sx={{ mb: 1 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>JS</Avatar>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Jane Smith
                    </Typography>
                    <Typography variant="body2">35%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={35} sx={{ mb: 1 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>MB</Avatar>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Mike Brown
                    </Typography>
                    <Typography variant="body2">20%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={20} />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Engagement Metrics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Participation Rate</Typography>
                  <Typography variant="body2" color="primary">
                    87%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Response Time</Typography>
                  <Typography variant="body2" color="primary">
                    2.3s
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Questions Asked</Typography>
                  <Typography variant="body2" color="primary">
                    12
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Insight History
            </Typography>

            <List>
              {insights.map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={insight.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {insight.content}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Chip
                              label={insight.type}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(insight.timestamp).toLocaleTimeString()}
                            </Typography>
                            <Box sx={{ ml: 'auto' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleFeedback(insight.id, true)}
                              >
                                <ThumbUp fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleFeedback(insight.id, false)}
                              >
                                <ThumbDown fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>

            {insights.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No insights generated yet
              </Typography>
            )}
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default AIInsightsPanel;
