import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';

// Import pages directly to avoid lazy loading issues
import ConfigurationPage from './pages/ConfigurationPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import TestPage from './pages/TestPage';
import SimpleTestPage from './pages/SimpleTestPage';
import MinimalTest from './pages/MinimalTest';

// Create a simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* Simple AppBar */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Hydraulic Network Analysis
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: '100%',
              minHeight: '100vh',
              backgroundColor: (theme) => theme.palette.background.default,
              marginTop: '64px', // Account for AppBar height
            }}
          >
            <Container maxWidth={false}>
              <Routes>
                 <Route path="/" element={<ConfigurationPage />} />
                 <Route path="/config" element={<ConfigurationPage />} />
                 <Route path="/results" element={<ConfigurationPage />} />
                 <Route path="/history" element={<ConfigurationPage />} />
               </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
