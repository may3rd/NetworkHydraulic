import React from 'react';
import { Box, Drawer, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Navigation from '@components/layout/Navigation';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: sidebarExpanded ? 'calc(100% - 240px)' : 'calc(100% - 64px)',
          ml: sidebarExpanded ? '240px' : '64px',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Hydraulic Network Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: sidebarExpanded ? 240 : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarExpanded ? 240 : 64,
            boxSizing: 'border-box',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open={sidebarExpanded}
      >
        <Navigation />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: (theme) => theme.palette.background.default,
          marginLeft: sidebarExpanded ? '240px' : '64px',
          transition: (theme) => theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;