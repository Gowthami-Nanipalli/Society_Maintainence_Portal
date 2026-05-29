import { useEffect, useState } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { palette } from "../theme";

const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80",
    eyebrow: "PREMIUM GATED COMMUNITY",
    title: "A Royal Address",
    sub: "Crafted residences set within manicured gardens and tree-lined avenues.",
  },
  {
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80",
    eyebrow: "ELEGANT VILLAS",
    title: "Distinguished Living",
    sub: "Spacious independent villas designed for privacy, comfort, and timeless style.",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
    eyebrow: "LANDSCAPED ENCLAVE",
    title: "Nature at Your Doorstep",
    sub: "Lush gardens, jogging trails, and open green courtyards across the community.",
  },
];

const SLIDE_MS = 6000;

export default function Hero() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <Box
      id="home"
      sx={{
        position: "relative",
        height: { xs: "100vh", md: "100vh" },
        minHeight: { xs: 620, md: 720 },
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {SLIDES.map((s, i) => (
        <Box
          key={s.url}
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${s.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: i === idx ? "scale(1.04)" : "scale(1)",
            opacity: i === idx ? 1 : 0,
            transition: "opacity 1200ms ease, transform 7000ms ease",
          }}
        />
      ))}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(11,20,38,0.55) 0%, rgba(11,20,38,0.35) 40%, rgba(11,20,38,0.85) 100%)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box sx={{ maxWidth: 760, py: { xs: 10, md: 0 } }}>
          <Typography
            sx={{
              color: palette.gold,
              fontSize: { xs: 11, md: 13 },
              fontWeight: 700,
              letterSpacing: "0.36em",
              mb: 2,
            }}
          >
            {SLIDES[idx].eyebrow}
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 56, md: 76 },
              lineHeight: 1.05,
              mb: 3,
              textShadow: "0 4px 30px rgba(0,0,0,0.45)",
            }}
          >
            CardMaster Enclave
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 16, md: 20 },
              maxWidth: 580,
              lineHeight: 1.6,
              opacity: 0.94,
              mb: 4,
            }}
          >
            {SLIDES[idx].sub}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="primary"
              size="large"
              sx={{ letterSpacing: "0.16em", textTransform: "uppercase", px: 4, py: 1.5 }}
            >
              Sign In / Sign Up
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              sx={{ letterSpacing: "0.16em", textTransform: "uppercase", px: 4, py: 1.5 }}
            >
              Explore Community
            </Button>
          </Stack>
        </Box>
      </Container>

      <Stack
        direction="row"
        spacing={1.2}
        sx={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        {SLIDES.map((_, i) => (
          <Box
            key={i}
            onClick={() => setIdx(i)}
            sx={{
              width: i === idx ? 32 : 10,
              height: 3,
              background: i === idx ? palette.gold : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 250ms ease",
            }}
          />
        ))}
      </Stack>

      <Box
        onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
        sx={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          color: palette.gold,
          cursor: "pointer",
          animation: "bounce 2s infinite",
          "@keyframes bounce": {
            "0%, 100%": { transform: "translate(-50%, 0)" },
            "50%": { transform: "translate(-50%, 8px)" },
          },
        }}
        aria-label="Scroll down"
      >
        <KeyboardArrowDownIcon sx={{ fontSize: 36 }} />
      </Box>
    </Box>
  );
}
