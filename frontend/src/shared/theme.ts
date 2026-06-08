import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#08080e",
      paper: "#111118",
    },
    primary: {
      main: "#7c66ff",
      light: "#a78bfa",
      dark: "#5b45d9",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#c026d3",
      light: "#e879f9",
      dark: "#8b1aa3",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef6f6c",
    },
    warning: {
      main: "#f59e0b",
    },
    success: {
      main: "#22c55e",
    },
    text: {
      primary: "#e4e4f2",
      secondary: "#8888b8",
    },
    divider: "rgba(255,255,255,0.07)",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      '"Outfit", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 760,
      letterSpacing: 0,
      fontFamily: '"Playfair Display", Georgia, serif',
    },
    h2: {
      fontWeight: 720,
      letterSpacing: 0,
      fontFamily: '"Playfair Display", Georgia, serif',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: 0,
      fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
