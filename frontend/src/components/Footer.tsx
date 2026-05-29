import { Box, Container, Grid, Stack, Typography, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link as RouterLink } from "react-router-dom";
import Logo from "./Logo";
import { palette } from "../theme";

const QUICK_LINKS = ["Home", "About", "Amenities", "Gallery", "Location", "Contact"];

export default function Footer() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ background: palette.ink, color: "#fff", pt: 8, pb: 3 }}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Logo variant="dark" />
            <Typography
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                lineHeight: 1.8,
                mt: 3,
                maxWidth: 320,
              }}
            >
              A premium gated villa community thoughtfully designed for comfort, privacy, and a
              vibrant community life.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              {[FacebookIcon, InstagramIcon, YouTubeIcon].map((Icon, i) => (
                <IconButton
                  key={i}
                  sx={{
                    color: palette.gold,
                    border: `1px solid rgba(201,169,97,0.4)`,
                    "&:hover": {
                      background: palette.gold,
                      color: palette.ink,
                      borderColor: palette.gold,
                    },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.18em",
                color: palette.gold,
                mb: 3,
              }}
            >
              QUICK LINKS
            </Typography>
            <Stack spacing={1.5}>
              {QUICK_LINKS.map((l) => (
                <Box
                  key={l}
                  onClick={() => scrollTo(l)}
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "color 200ms ease",
                    "&:hover": { color: palette.gold },
                  }}
                >
                  {l}
                </Box>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.18em",
                color: palette.gold,
                mb: 3,
              }}
            >
              PORTAL
            </Typography>
            <Stack spacing={1.5}>
              <Box
                component={RouterLink}
                to="/login"
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                  textDecoration: "none",
                  "&:hover": { color: palette.gold },
                }}
              >
                Resident Login
              </Box>
              <Box
                sx={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 14,
                  cursor: "default",
                }}
              >
                Help & Support
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.18em",
                color: palette.gold,
                mb: 3,
              }}
            >
              CONTACT
            </Typography>
            <Stack spacing={1.5} sx={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>
              <Box>Community Clubhouse, Block A</Box>
              <Box>Hyderabad, Telangana</Box>
              <Box>+91 9XXXX XXXXX</Box>
              <Box>office@cardmasterenclave.in</Box>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            © {new Date().getFullYear()} CardMaster Enclave. All rights reserved.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.08em" }}>
            Built for the community, by the community.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
