import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Chip,
  ListSubheader,
} from '@mui/material';
import {
  Dashboard,
  Gavel,
  Facebook,
  LiveTv,
  Settings,
  Schedule,
  Category,
  Language,
  Notifications,
  Analytics,
  Help,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const mainMenuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    description: 'Overview & Analytics'
  },
  {
    text: 'All Auctions',
    icon: <Gavel />,
    path: '/auctions',
    description: 'Manage Active Auctions'
  },
];

const createMenuItems = [
  {
    text: 'Facebook Post Auction',
    icon: <Facebook />,
    path: '/create-post-auction',
    description: 'Auto-detect bids from post comments',
    badge: 'AUTO'
  },
  {
    text: 'Live Feed Auction',
    icon: <LiveTv />,
    path: '/create-live-auction',
    description: 'Real-time live auction management',
    badge: 'LIVE'
  },
];

const settingsMenuItems = [
  {
    text: 'General Settings',
    icon: <Settings />,
    path: '/settings',
    description: 'App preferences'
  },
  {
    text: 'Timezone & Locale',
    icon: <Language />,
    path: '/settings/timezone',
    description: 'Time zones & language'
  },
  {
    text: 'Item Categories',
    icon: <Category />,
    path: '/settings/categories',
    description: 'Manage auction categories'
  },
  {
    text: 'Notifications',
    icon: <Notifications />,
    path: '/settings/notifications',
    description: 'Alert preferences'
  },
  {
    text: 'Facebook Integration',
    icon: <AutoAwesome />,
    path: '/settings/facebook',
    description: 'Webhook & API settings'
  },
];

const helpMenuItems = [
  {
    text: 'Help & Support',
    icon: <Help />,
    path: '/help',
    description: 'Documentation & FAQ'
  },
  {
    text: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
    description: 'Auction performance'
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const renderMenuItem = (item, isSubItem = false) => (
    <ListItem key={item.text} disablePadding sx={{ pl: isSubItem ? 2 : 0 }}>
      <ListItemButton
        selected={location.pathname === item.path}
        onClick={() => handleNavigation(item.path)}
        sx={{
          minHeight: 48,
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
            color: location.pathname === item.path ? 'inherit' : 'text.secondary',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.text}
          secondary={item.description}
          secondaryTypographyProps={{
            variant: 'caption',
            color: location.pathname === item.path ? 'inherit' : 'text.secondary',
            sx: { opacity: 0.7 }
          }}
        />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            color="secondary"
            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          🤖 Auction Manager
        </Typography>
      </Toolbar>

      <Divider />

      {/* Main Navigation */}
      <List>
        {mainMenuItems.map((item) => renderMenuItem(item))}
      </List>

      <Divider />

      {/* Create Section */}
      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent', fontWeight: 'bold' }}>
            CREATE AUCTIONS
          </ListSubheader>
        }
      >
        {createMenuItems.map((item) => renderMenuItem(item))}
      </List>

      <Divider />

      {/* Settings Section */}
      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent', fontWeight: 'bold' }}>
            SETTINGS
          </ListSubheader>
        }
        sx={{ flexGrow: 1 }}
      >
        {settingsMenuItems.map((item) => renderMenuItem(item))}
      </List>

      <Divider />

      {/* Help Section */}
      <List>
        {helpMenuItems.map((item) => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
