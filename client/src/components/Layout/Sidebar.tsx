import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  VideoCall,
  History,
  Analytics,
  Settings,
  Integration,
  Help,
  Person,
  ExpandLess,
  ExpandMore,
  Schedule,
  RecordVoiceOver,
  SmartToy,
  Extension,
  Security,
  Notifications,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';
import { useTranslation } from 'react-i18next';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  children?: NavigationItem[];
}

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);

  const [openSections, setOpenSections] = React.useState<string[]>(['meetings']);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: <Dashboard />,
      path: '/',
    },
    {
      id: 'meetings',
      label: t('navigation.meetings'),
      icon: <VideoCall />,
      path: '/meetings',
      children: [
        {
          id: 'schedule',
          label: 'Schedule Meeting',
          icon: <Schedule />,
          path: '/meetings/schedule',
        },
        {
          id: 'history',
          label: 'Meeting History',
          icon: <History />,
          path: '/meetings/history',
        },
        {
          id: 'recordings',
          label: 'Recordings',
          icon: <RecordVoiceOver />,
          path: '/meetings/recordings',
        },
      ],
    },
    {
      id: 'analytics',
      label: t('navigation.analytics'),
      icon: <Analytics />,
      path: '/analytics',
      badge: 'New',
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: <SmartToy />,
      path: '/ai-insights',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Integration />,
      path: '/integrations',
      badge: 'Enterprise',
    },
  ];

  const settingsItems: NavigationItem[] = [
    {
      id: 'profile',
      label: t('navigation.profile'),
      icon: <Person />,
      path: '/profile',
    },
    {
      id: 'settings',
      label: t('navigation.settings'),
      icon: <Settings />,
      path: '/settings',
      children: [
        {
          id: 'general',
          label: 'General',
          icon: <Settings />,
          path: '/settings/general',
        },
        {
          id: 'security',
          label: 'Security',
          icon: <Security />,
          path: '/settings/security',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Notifications />,
          path: '/settings/notifications',
        },
      ],
    },
    {
      id: 'help',
      label: t('navigation.help'),
      icon: <Help />,
      path: '/help',
    },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections.includes(item.id);
    const active = isActive(item.path);

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleSectionToggle(item.id);
              } else {
                handleNavigation(item.path);
              }
            }}
            selected={active}
            sx={{
              pl: 2 + level * 2,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: active ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: active ? 600 : 400,
              }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                color="secondary"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          marginTop: '64px', // Account for navbar height
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {user?.displayName?.charAt(0) || 'U'}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.displayName || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Navigation */}
        <Box sx={{ flex: 1, py: 1 }}>
          <List>{navigationItems.map((item) => renderNavigationItem(item))}</List>

          <Divider sx={{ my: 2 }} />

          <List>{settingsItems.map((item) => renderNavigationItem(item))}</List>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            AI Meeting Co-Pilot v2.0
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            © 2024 All rights reserved
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
