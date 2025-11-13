import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useUIStore } from '@stores/ui';

const Navigation: React.FC = () => {
  const activeView = useUIStore((state) => state.activeView);
  const setActiveView = useUIStore((state) => state.actions.setActiveView);

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
    <div>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.id}
            selected={activeView === item.id}
            onClick={() => setActiveView(item.id as any)}
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