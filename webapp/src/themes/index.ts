import { createTheme as createMuiTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      z1: string;
      z2: string;
      z4: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
    };
  }
  interface ThemeOptions {
    customShadows?: {
      z1: string;
      z2: string;
      z4: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
    };
  }
}

const createTheme = (mode: PaletteMode): Theme => {
  const isLight = mode === 'light';

  return createMuiTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? '#ffffff' : '#121212',
        paper: isLight ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: isLight ? '#2c3e50' : '#ffffff',
        secondary: isLight ? '#7f8c8d' : '#bdc3c7',
      },
      grey: {
        50: isLight ? '#f8f9fa' : '#2c2c2c',
        100: isLight ? '#e9ecef' : '#3a3a3a',
        200: isLight ? '#dee2e6' : '#494949',
        300: isLight ? '#ced4da' : '#575757',
        400: isLight ? '#adb5bd' : '#6b6b6b',
        500: isLight ? '#6c757d' : '#8e8e8e',
        600: isLight ? '#495057' : '#a1a1a1',
        700: isLight ? '#343a40' : '#c8c8c8',
        800: isLight ? '#212529' : '#e2e2e2',
        900: isLight ? '#000000' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.125rem',
        fontWeight: 500,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 500,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.75rem',
        lineHeight: 1.43,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    spacing: 8,
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)',
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    customShadows: {
      z1: isLight ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.4)',
      z2: isLight ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.4)',
      z4: isLight ? '0 4px 16px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.4)',
      z8: isLight ? '0 8px 32px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.4)',
      z12: isLight ? '0 12px 48px rgba(0,0,0,0.12)' : '0 12px 48px rgba(0,0,0,0.4)',
      z16: isLight ? '0 16px 64px rgba(0,0,0,0.12)' : '0 16px 64px rgba(0,0,0,0.4)',
      z20: isLight ? '0 20px 80px rgba(0,0,0,0.12)' : '0 20px 80px rgba(0,0,0,0.4)',
      z24: isLight ? '0 24px 96px rgba(0,0,0,0.12)' : '0 24px 96px rgba(0,0,0,0.4)',
    },
  });
};

export default createTheme;