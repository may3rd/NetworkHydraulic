import React, { useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarExpanded] = useState(true); // Always expanded for simplicity

  const navigationItems = [
    {
      id: 'config',
      label: 'Configuration',
      icon: <HomeIcon />,
      path: '/config',
    },
    {
      id: 'results',
      label: 'Results',
      icon: <AnalyticsIcon />,
      path: '/results',
    },
    {
      id: 'history',
      label: 'History',
      icon: <HistoryIcon />,
      path: '/history',
    },
  ];

  return (
    <div style={{ width: sidebarExpanded ? 240 : 64 }}>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.id}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: (theme) => theme.palette.action.selected,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.action.hover,
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </div>
  );
};

export default Navigation;