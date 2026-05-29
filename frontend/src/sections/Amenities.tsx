import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import PoolIcon from "@mui/icons-material/Pool";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import ParkIcon from "@mui/icons-material/Park";
import SecurityIcon from "@mui/icons-material/Security";
import ChildFriendlyIcon from "@mui/icons-material/ChildFriendly";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import EmojiNatureIcon from "@mui/icons-material/EmojiNature";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import GroupsIcon from "@mui/icons-material/Groups";
import VideocamIcon from "@mui/icons-material/Videocam";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SectionHeading from "../components/SectionHeading";
import { palette } from "../theme";

const AMENITIES = [
  { icon: <PoolIcon />, title: "Swimming Pool", desc: "Resort-style pool deck with poolside seating." },
  { icon: <FitnessCenterIcon />, title: "Modern Gym", desc: "Fully equipped fitness studio with cardio & strength." },
  { icon: <GroupsIcon />, title: "Clubhouse", desc: "Multipurpose hall for community gatherings & events." },
  { icon: <ParkIcon />, title: "Landscaped Gardens", desc: "Lush themed gardens and shaded sit-outs." },
  { icon: <SportsTennisIcon />, title: "Sports Courts", desc: "Tennis, badminton, and indoor games arena." },
  { icon: <ChildFriendlyIcon />, title: "Kids' Play Area", desc: "Safe, fun, and engaging play zones for children." },
  { icon: <EmojiNatureIcon />, title: "Jogging Trail", desc: "Tree-lined walking and jogging pathways." },
  { icon: <SecurityIcon />, title: "24×7 Security", desc: "Manned gates and round-the-clock patrolling." },
  { icon: <VideocamIcon />, title: "CCTV Surveillance", desc: "Community-wide camera coverage." },
  { icon: <LocalParkingIcon />, title: "Visitor Parking", desc: "Ample, organized parking bays for guests." },
  { icon: <LocalFireDepartmentIcon />, title: "Fire Safety", desc: "Hydrants and detection systems community-wide." },
  { icon: <WaterDropIcon />, title: "Rainwater Harvesting", desc: "Sustainable water management at scale." },
];

export default function Amenities() {
  return (
    <Box id="amenities" sx={{ py: { xs: 8, md: 12 }, background: "#fff" }}>
      <Container maxWidth="lg">
        <SectionHeading
          eyebrow="World-Class Amenities"
          title="Everything You Need, A Step Away"
        />

        <Grid container spacing={3}>
          {AMENITIES.map((a) => (
            <Grid item xs={6} sm={4} md={3} key={a.title}>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 3,
                  height: "100%",
                  textAlign: "center",
                  border: `1px solid ${palette.border}`,
                  background: "#fff",
                  transition: "all 250ms ease",
                  cursor: "default",
                  "&:hover": {
                    borderColor: palette.gold,
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 40px rgba(11,20,38,0.08)",
                  },
                  "&:hover .icon-wrap": {
                    background: palette.gold,
                    color: palette.ink,
                  },
                }}
              >
                <Box
                  className="icon-wrap"
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: palette.cream,
                    color: palette.gold,
                    transition: "all 250ms ease",
                    "& svg": { fontSize: 28 },
                  }}
                >
                  {a.icon}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "0.08em",
                    color: palette.ink,
                  }}
                >
                  {a.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: palette.muted, lineHeight: 1.6 }}>
                  {a.desc}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
