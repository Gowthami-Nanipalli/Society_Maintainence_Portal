import { Box, Container, Grid, Typography, Stack } from "@mui/material";
import SectionHeading from "../components/SectionHeading";
import { palette } from "../theme";

const STATS = [
  { value: "120+", label: "Premium Villas" },
  { value: "12 Ac", label: "Lush Landscape" },
  { value: "30+", label: "Amenities" },
  { value: "24×7", label: "Security" },
];

export default function About() {
  return (
    <Box
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        background: palette.cream,
      }}
    >
      <Container maxWidth="lg">
        <SectionHeading eyebrow="About the Enclave" title="A Community Crafted with Care" />

        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: "-14px -14px auto auto",
                  width: "70%",
                  height: "70%",
                  border: `2px solid ${palette.gold}`,
                  zIndex: 0,
                },
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
                alt="CardMaster Enclave villa"
                sx={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: { xs: 280, md: 460 },
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography
              sx={{
                color: palette.gold,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.32em",
                mb: 2,
              }}
            >
              WELCOME HOME
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 32 }, mb: 3 }}>
              Where Elegance Meets Everyday Life
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: 16, lineHeight: 1.8, mb: 2 }}>
              CardMaster Enclave is a thoughtfully planned gated community of premium villas, set
              within tree-lined avenues, manicured gardens, and curated open spaces. Every
              residence is designed to balance privacy, comfort, and timeless architectural
              detail.
            </Typography>
            <Typography sx={{ color: palette.muted, fontSize: 16, lineHeight: 1.8, mb: 4 }}>
              From morning walks along landscaped trails to evenings at the clubhouse, the
              enclave is built around the idea that home should feel like a quiet retreat — yet
              connected, social, and alive.
            </Typography>

            <Grid container spacing={2}>
              {STATS.map((s) => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Stack alignItems="flex-start">
                    <Typography
                      sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        color: palette.ink,
                        fontSize: { xs: 22, md: 28 },
                      }}
                    >
                      {s.value}
                    </Typography>
                    <Box sx={{ width: 30, height: 2, background: palette.gold, my: 1 }} />
                    <Typography sx={{ fontSize: 12, letterSpacing: "0.18em", color: palette.muted, textTransform: "uppercase" }}>
                      {s.label}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
