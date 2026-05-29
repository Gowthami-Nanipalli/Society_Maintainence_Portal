import { Box, Typography } from "@mui/material";
import logo from "../assets/logo.svg";
import { palette } from "../theme";

type Props = {
  variant?: "dark" | "light";
  showText?: boolean;
  size?: number;
};

export default function Logo({ variant = "light", showText = true, size = 38 }: Props) {
  const textColor = variant === "light" ? palette.ink : palette.gold;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box
        component="img"
        src={logo}
        alt="CardMaster Enclave"
        sx={{
          height: size,
          width: size,
          objectFit: "contain",
          background: variant === "light" ? palette.ink : "transparent",
          borderRadius: "4px",
          p: variant === "light" ? "4px" : 0,
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      {showText && (
        <Box sx={{ lineHeight: 1.05 }}>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.16em",
              color: textColor,
            }}
          >
            CARDMASTER
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 500,
              fontSize: 10.5,
              letterSpacing: "0.32em",
              color: textColor,
              opacity: 0.85,
            }}
          >
            ENCLAVE
          </Typography>
        </Box>
      )}
    </Box>
  );
}
