import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',
    },
    secondary: {
      main: '#F57F17',
    },
    background: {
      default: '#F4F6FD',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;
