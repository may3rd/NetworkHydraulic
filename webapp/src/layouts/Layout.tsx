import React from 'react';
import { Box, Drawer, AppBar, Toolbar, IconButton, Typography, Container } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode } from '@mui/icons-material';

import { useUIStore } from '@stores/ui';
import Navigation from '@components/layout/Navigation';
import Header from '@components/layout/Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sidebarExpanded = useUIStore((state) => state.sidebarExpanded);
  const theme = useUIStore((state) => state.theme);
  const toggleSidebar = useUIStore((state) => state.actions.toggleSidebar);
  const toggleTheme = useUIStore((state) => state.actions.toggleTheme);

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
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Hydraulic Network Analysis
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {theme === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>
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
          '&.MuiDrawer-docked': {
            width: sidebarExpanded ? 240 : 64,
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
        <Container maxWidth={false}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;