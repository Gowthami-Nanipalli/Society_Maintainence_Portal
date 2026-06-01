import { useState } from "react";
import { Box, Container, Dialog, Grid, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SectionHeading from "../components/SectionHeading";
import { palette } from "../theme";

type Item = { url: string; title: string; tag: string };

const ITEMS: Item[] = [
  {
    url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    title: "Signature Villa",
    tag: "Villas",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80",
    title: "Premium Villa Exterior",
    tag: "Villas",
  },
  {
    url: "https://images.unsplash.com/photo-1542621334-a254cf47733d?auto=format&fit=crop&w=1400&q=80",
    title: "Tree-lined Community Avenue",
    tag: "Roads",
  },
  {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1400&q=80",
    title: "Landscaped Garden",
    tag: "Gardens",
  },
  {
    url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80",
    title: "Garden Pathway",
    tag: "Gardens",
  },
  {
    url: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1400&q=80",
    title: "Internal Driveway",
    tag: "Roads",
  },
  {
    url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80",
    title: "Modern Villa Facade",
    tag: "Villas",
  },
  {
    url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1400&q=80",
    title: "Manicured Lawns",
    tag: "Gardens",
  },
];

export default function Gallery() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <Box id="gallery" sx={{ py: { xs: 8, md: 12 }, background: palette.cream }}>
      <Container maxWidth="lg">
        <SectionHeading
          eyebrow="Community Gallery"
          title="A Glimpse Inside the Enclave"
        />

        <Grid container spacing={2}>
          {ITEMS.map((it, i) => (
            <Grid item xs={12} sm={6} md={3} key={it.url}>
              <Box
                onClick={() => setOpenIdx(i)}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  aspectRatio: "1 / 1",
                  "&:hover img": { transform: "scale(1.08)" },
                  "&:hover .overlay": { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={it.url}
                  alt={it.title}
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 600ms ease",
                    display: "block",
                  }}
                />
                <Box
                  className="overlay"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(11,20,38,0) 30%, rgba(11,20,38,0.85) 100%)",
                    opacity: 0,
                    transition: "opacity 300ms ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    p: 2.5,
                    color: "#fff",
                  }}
                >
                  <Typography
                    sx={{
                      color: palette.gold,
                      fontSize: 11,
                      letterSpacing: "0.28em",
                      mb: 0.5,
                    }}
                  >
                    {it.tag.toUpperCase()}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {it.title}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        maxWidth="lg"
        PaperProps={{ sx: { background: "transparent", boxShadow: "none" } }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setOpenIdx(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: palette.gold,
              background: "rgba(11,20,38,0.7)",
              "&:hover": { background: "rgba(11,20,38,0.9)" },
              zIndex: 2,
            }}
          >
            <CloseIcon />
          </IconButton>
          {openIdx !== null && (
            <Box
              component="img"
              src={ITEMS[openIdx].url}
              alt={ITEMS[openIdx].title}
              sx={{
                maxWidth: "92vw",
                maxHeight: "88vh",
                display: "block",
                margin: "0 auto",
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
