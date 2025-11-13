import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { useUIStore } from '@stores/ui';
import createTheme from './themes';
import Layout from '@layouts/Layout';
import ConfigurationPage from '@pages/ConfigurationPage';
import ResultsPage from '@pages/ResultsPage';
import HistoryPage from '@pages/HistoryPage';

const App: React.FC = () => {
  const themeMode = useUIStore((state) => state.theme);
  const theme = createTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/config" replace />} />
            <Route path="/config" element={<ConfigurationPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/config" replace />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      />
    </ThemeProvider>
  );
};

export default App;
