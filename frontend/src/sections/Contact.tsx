import { Box, Button, Container, Grid, Stack, TextField, Typography } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SectionHeading from "../components/SectionHeading";
import { palette } from "../theme";

const CONTACTS = [
  { icon: <PhoneIcon />, label: "Phone", value: "+91 9XXXX XXXXX" },
  { icon: <EmailIcon />, label: "Email", value: "office@cardmasterenclave.in" },
  { icon: <LocationOnIcon />, label: "Office", value: "Community Clubhouse, Block A" },
];

export default function Contact() {
  return (
    <Box id="contact" sx={{ py: { xs: 8, md: 12 }, background: palette.cream }}>
      <Container maxWidth="lg">
        <SectionHeading
          eyebrow="Get in Touch"
          title="We're Here to Help"
        />

        <Grid container spacing={5}>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Typography sx={{ color: palette.muted, lineHeight: 1.8 }}>
                For residency enquiries, community visits, or assistance with the resident
                portal, reach out to the community office. We'll respond within one business day.
              </Typography>

              {CONTACTS.map((c) => (
                <Stack key={c.label} direction="row" spacing={2.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: "#fff",
                      border: `1px solid ${palette.border}`,
                      color: palette.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {c.icon}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        letterSpacing: "0.28em",
                        color: palette.gold,
                        fontWeight: 700,
                        mb: 0.5,
                      }}
                    >
                      {c.label.toUpperCase()}
                    </Typography>
                    <Typography sx={{ color: palette.ink, fontSize: 15, fontWeight: 500 }}>
                      {c.value}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you! The community office will get back to you shortly.");
              }}
              sx={{
                background: "#fff",
                p: { xs: 3, md: 4.5 },
                border: `1px solid ${palette.border}`,
              }}
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Full Name" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required type="email" label="Email Address" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Subject" variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={5}
                    label="Your Message"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ px: 5, letterSpacing: "0.16em", textTransform: "uppercase" }}
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
