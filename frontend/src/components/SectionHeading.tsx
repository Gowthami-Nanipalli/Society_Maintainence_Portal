import { Box, Typography } from "@mui/material";
import { palette } from "../theme";

type Props = {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  light?: boolean;
};

export default function SectionHeading({ eyebrow, title, align = "center", light = false }: Props) {
  const color = light ? "#fff" : palette.ink;
  return (
    <Box sx={{ textAlign: align, mb: 6, maxWidth: 760, mx: align === "center" ? "auto" : 0 }}>
      {eyebrow && (
        <Typography
          sx={{
            color: palette.gold,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        variant="h3"
        sx={{
          color,
          fontSize: { xs: 28, md: 38 },
          mb: 2,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          width: 60,
          height: 2,
          background: palette.gold,
          mx: align === "center" ? "auto" : 0,
        }}
      />
    </Box>
  );
}
