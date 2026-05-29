import { createTheme } from "@mui/material/styles";

export const palette = {
  gold: "#C9A961",
  goldDeep: "#A8884A",
  goldSoft: "#E2C988",
  ink: "#0B1426",
  inkSoft: "#162237",
  paper: "#FFFFFF",
  cream: "#F8F4EC",
  border: "#E6DFCE",
  muted: "#6B7280",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: palette.gold, contrastText: palette.ink },
    secondary: { main: palette.ink, contrastText: palette.gold },
    background: { default: palette.paper, paper: palette.paper },
    text: { primary: palette.ink, secondary: palette.muted },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
    h1: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.04em" },
    h2: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.04em" },
    h3: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.04em" },
    h4: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.05em" },
    h5: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.05em" },
    h6: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: "0.06em" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.04em" },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { paddingInline: 22, paddingBlock: 10 },
        containedPrimary: {
          color: palette.ink,
          boxShadow: "none",
          "&:hover": { background: palette.goldDeep, boxShadow: "none" },
        },
        outlinedPrimary: {
          borderColor: palette.gold,
          color: palette.gold,
          "&:hover": { borderColor: palette.goldDeep, background: "rgba(201,169,97,0.08)" },
        },
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
  },
});
