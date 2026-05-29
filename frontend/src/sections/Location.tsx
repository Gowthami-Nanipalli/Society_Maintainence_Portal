import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import DirectionsIcon from "@mui/icons-material/Directions";
import SectionHeading from "../components/SectionHeading";
import { palette } from "../theme";

const NEARBY = [
  { icon: <SchoolIcon />, label: "St. Patrick's High School", distance: "8 min" },
  { icon: <LocalHospitalIcon />, label: "Yashoda Hospital, Secunderabad", distance: "12 min" },
  { icon: <ShoppingBagIcon />, label: "Sujana Forum Mall", distance: "10 min" },
  { icon: <FlightTakeoffIcon />, label: "Rajiv Gandhi Intl. Airport", distance: "45 min" },
];

const ADDRESS_LINES = [
  "CardMaster Enclave,",
  "Akbar Road, New Bowenpally,",
  "Secunderabad,",
  "Telangana – 500009, India",
];

const LAT = 17.4747;
const LNG = 78.4940;
const DELTA = 0.008;

const MAP_SRC =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${LNG - DELTA}%2C${LAT - DELTA}%2C${LNG + DELTA}%2C${LAT + DELTA}` +
  `&layer=mapnik&marker=${LAT}%2C${LNG}`;

const DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1` +
  `&destination=${encodeURIComponent(
    "CardMaster Enclave, Akbar Rd, New Bowenpally, Secunderabad, Telangana 500009"
  )}`;

const VIEW_ON_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=` +
  encodeURIComponent("CardMaster Enclave, Akbar Rd, New Bowenpally, Secunderabad, Telangana 500009");

export default function Location() {
  return (
    <Box id="location" sx={{ py: { xs: 8, md: 12 }, background: "#fff" }}>
      <Container maxWidth="lg">
        <SectionHeading eyebrow="Prime Location" title="Connected to What Matters" />

        <Grid container spacing={5} alignItems="stretch">
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 320, md: 460 },
                overflow: "hidden",
                border: `1px solid ${palette.border}`,
              }}
            >
              <Box
                component="iframe"
                title="CardMaster Enclave Location"
                src={MAP_SRC}
                sx={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                  filter: "saturate(0.9)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  background: "rgba(11,20,38,0.92)",
                  border: `1px solid ${palette.gold}`,
                  px: 1.6,
                  py: 0.8,
                }}
              >
                <Box
                  component="a"
                  href={VIEW_ON_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: palette.gold,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  View on Google Maps ↗
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={2.5} sx={{ height: "100%", justifyContent: "center" }}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <LocationOnIcon sx={{ color: palette.gold }} />
                  <Typography
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 600,
                      fontSize: 18,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Our Address
                  </Typography>
                </Stack>
                <Box sx={{ color: palette.muted, lineHeight: 1.7, ml: 4.5 }}>
                  {ADDRESS_LINES.map((line) => (
                    <Typography key={line} sx={{ color: palette.muted }}>
                      {line}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ ml: 4.5, mt: 2 }}>
                  <Button
                    component="a"
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<DirectionsIcon />}
                    sx={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    Get Directions
                  </Button>
                </Box>
              </Box>

              <Box sx={{ borderTop: `1px solid ${palette.border}`, pt: 3 }}>
                <Typography
                  sx={{
                    color: palette.gold,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.32em",
                    mb: 2,
                  }}
                >
                  WHAT'S NEARBY
                </Typography>
                <Stack spacing={2}>
                  {NEARBY.map((n) => (
                    <Stack
                      key={n.label}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        border: `1px solid ${palette.border}`,
                        transition: "all 200ms ease",
                        "&:hover": { borderColor: palette.gold, background: palette.cream },
                      }}
                    >
                      <Box sx={{ color: palette.gold, display: "flex" }}>{n.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: palette.ink }}>
                          {n.label}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: palette.gold,
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {n.distance}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
