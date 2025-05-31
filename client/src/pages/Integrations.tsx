import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  CalendarToday,
  VideoCall,
  Search,
  Security,
  Webhook,
  Api,
  Home,
  Settings,
} from '@mui/icons-material';
import CalendarIntegrationComponent from '../components/CalendarIntegration';
import MeetingPlatformsIntegration from '../components/MeetingPlatformsIntegration';
import AdvancedSearch from '../components/AdvancedSearch';
import EnterpriseAdmin from '../components/EnterpriseAdmin';

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
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Integrations: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link underline="hover" color="inherit" href="/settings" sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 0.5 }} fontSize="inherit" />
          Settings
        </Link>
        <Typography color="text.primary">Integrations</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Integrations & Advanced Features
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Connect external services, configure enterprise features, and manage advanced functionality
        </Typography>
      </Box>

      {/* Feature Overview Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🚀 Advanced Features Available
        </Typography>
        <Typography variant="body2">
          This page provides access to enterprise-grade features including calendar integrations, 
          external meeting platforms, advanced search with Elasticsearch, SSO authentication, 
          and comprehensive permission management.
        </Typography>
      </Alert>

      {/* Main Content */}
      <Paper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="integration tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<CalendarToday />} 
            label="Calendar Sync" 
            id="integration-tab-0"
            aria-controls="integration-tabpanel-0"
          />
          <Tab 
            icon={<VideoCall />} 
            label="Meeting Platforms" 
            id="integration-tab-1"
            aria-controls="integration-tabpanel-1"
          />
          <Tab 
            icon={<Search />} 
            label="Advanced Search" 
            id="integration-tab-2"
            aria-controls="integration-tabpanel-2"
          />
          <Tab 
            icon={<Security />} 
            label="Enterprise Admin" 
            id="integration-tab-3"
            aria-controls="integration-tabpanel-3"
          />
          <Tab 
            icon={<Webhook />} 
            label="Webhooks" 
            id="integration-tab-4"
            aria-controls="integration-tabpanel-4"
          />
          <Tab 
            icon={<Api />} 
            label="API Access" 
            id="integration-tab-5"
            aria-controls="integration-tabpanel-5"
          />
        </Tabs>

        {/* Calendar Integration Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Calendar Integration
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Connect your calendar services to automatically sync meetings and events. 
              Supports Google Calendar, Outlook, and Apple Calendar with two-way synchronization.
            </Typography>
            <CalendarIntegrationComponent />
          </Box>
        </TabPanel>

        {/* Meeting Platforms Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              External Meeting Platforms
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Integrate with popular meeting platforms like Zoom, Microsoft Teams, Google Meet, and WebEx. 
              Create meetings, sync recordings, and manage participants across platforms.
            </Typography>
            <MeetingPlatformsIntegration />
          </Box>
        </TabPanel>

        {/* Advanced Search Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Advanced Search & Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Powerful search capabilities powered by Elasticsearch. Search across meetings, recordings, 
              transcripts, and AI insights with natural language processing and semantic search.
            </Typography>
            <AdvancedSearch />
          </Box>
        </TabPanel>

        {/* Enterprise Admin Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Enterprise Administration
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Manage SSO providers, user roles and permissions, security policies, and enterprise features. 
              Configure SAML, OAuth, LDAP authentication and fine-grained access controls.
            </Typography>
            <EnterpriseAdmin />
          </Box>
        </TabPanel>

        {/* Webhooks Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Webhooks & Real-time Events
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Configure webhooks to receive real-time notifications about meeting events, 
              recording completions, AI insights, and system updates.
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Coming Soon</Typography>
              <Typography variant="body2">
                Webhook configuration interface is under development. 
                Contact support for custom webhook setup.
              </Typography>
            </Alert>
          </Box>
        </TabPanel>

        {/* API Access Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box>
            <Typography variant="h6" gutterBottom>
              API Access & Developer Tools
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Generate API keys, view documentation, and manage developer access to the AI Meeting Co-pilot API. 
              Build custom integrations and automate workflows.
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Developer Portal</Typography>
              <Typography variant="body2">
                API documentation and key management will be available in the developer portal. 
                Visit our documentation site for API reference and examples.
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Integrations;
