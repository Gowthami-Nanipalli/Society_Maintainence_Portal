import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { palette } from "../theme";

const NAV_LINKS = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Amenities", id: "amenities" },
  { label: "Gallery", id: "gallery" },
  { label: "Location", id: "location" },
  { label: "Contact", id: "contact" },
];

export default function Navbar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const offsets = NAV_LINKS.map((l) => {
        const el = document.getElementById(l.id);
        return { id: l.id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      const current =
        offsets.filter((o) => o.top <= 110).sort((a, b) => b.top - a.top)[0]?.id ?? "home";
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isHome = location.pathname === "/";
  const showSolid = scrolled || !isHome;

  const barBg = showSolid ? "rgba(11, 20, 38, 0.96)" : "rgba(11, 20, 38, 0.35)";
  const barBorder = showSolid ? "1px solid rgba(201,169,97,0.18)" : "1px solid transparent";

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: barBg,
          backdropFilter: "blur(10px)",
          transition: "background 250ms ease, border-color 250ms ease",
          borderBottom: barBorder,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 80 } }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}
              onClick={() => isHome && scrollTo("home")}
            >
              <Logo variant="dark" />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {isDesktop ? (
              <Stack direction="row" spacing={0.5} alignItems="center">
                {NAV_LINKS.map((link) => {
                  const active = activeId === link.id && isHome;
                  return (
                    <Button
                      key={link.id}
                      onClick={() => scrollTo(link.id)}
                      sx={{
                        color: active ? palette.gold : "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        px: 1.8,
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: "20%",
                          right: "20%",
                          bottom: 10,
                          height: 2,
                          background: palette.gold,
                          transform: active ? "scaleX(1)" : "scaleX(0)",
                          transformOrigin: "center",
                          transition: "transform 200ms ease",
                        },
                        "&:hover": { color: palette.gold, background: "transparent" },
                        "&:hover::after": { transform: "scaleX(1)" },
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ ml: 1.5, fontSize: 12.5, letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  Sign In / Sign Up
                </Button>
              </Stack>
            ) : (
              <IconButton
                onClick={() => setOpen(true)}
                sx={{ color: palette.gold }}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "82%", sm: 360 },
            background: palette.ink,
            color: "#fff",
            borderLeft: `1px solid rgba(201,169,97,0.25)`,
          },
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo variant="dark" />
          <IconButton onClick={() => setOpen(false)} sx={{ color: palette.gold }} aria-label="Close menu">
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={0} sx={{ mt: 3, px: 2 }}>
          {NAV_LINKS.map((link) => {
            const active = activeId === link.id && isHome;
            return (
              <Button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                sx={{
                  justifyContent: "center",
                  color: active ? palette.gold : "#fff",
                  fontFamily: '"Cinzel", serif',
                  fontWeight: active ? 700 : 500,
                  fontSize: 18,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  py: 2,
                  borderRadius: 0,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  "&:hover": { color: palette.gold, background: "rgba(201,169,97,0.06)" },
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Stack>

        <Box sx={{ p: 3, mt: "auto" }}>
          <Button
            component={RouterLink}
            to="/login"
            onClick={() => setOpen(false)}
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ letterSpacing: "0.16em", textTransform: "uppercase" }}
          >
            Sign In / Sign Up
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
