import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { palette } from "../theme";
import { findAccount } from "../lib/accounts";
import { setCurrentUser } from "../lib/session";

const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
];

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const canSubmit = identifier.trim().length > 0 && password.length >= 6;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const match = findAccount(identifier, password);

    if (!match) {
      setError(
        "Sorry, your email/mobile number or password is incorrect. Please check and try again."
      );
      return;
    }
    setCurrentUser({
      name: match.name,
      email: match.email,
      mobile: match.mobile,
      house: match.house,
      role: match.role,
    });
    navigate("/dashboard");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${palette.ink} 0%, ${palette.inkSoft} 100%)`,
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Button
          component={RouterLink}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{
            color: palette.gold,
            mb: 3,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 12,
          }}
        >
          Back to Community Home
        </Button>

        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
            overflow: "hidden",
            background: "#fff",
            border: `1px solid ${palette.border}`,
            minHeight: { md: 620 },
          }}
        >
          {/* ---- Left: rotating brand visual ---- */}
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 240, md: "auto" },
              background: palette.ink,
              overflow: "hidden",
              display: { xs: "none", md: "block" },
            }}
          >
            {HERO_SLIDES.map((src, i) => (
              <Box
                key={src}
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: i === slide ? 0.55 : 0,
                  transform: i === slide ? "scale(1.04)" : "scale(1)",
                  transition: "opacity 1500ms ease, transform 7000ms ease",
                }}
              />
            ))}

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(11,20,38,0.55) 0%, rgba(11,20,38,0.85) 100%)",
              }}
            />

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 5,
                color: "#fff",
              }}
            >
              <Logo variant="dark" />

              <Box>
                <Typography
                  sx={{
                    color: palette.gold,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.32em",
                    mb: 1.5,
                  }}
                >
                  RESIDENT PORTAL
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    color: "#fff",
                    fontSize: { md: 34, lg: 42 },
                    lineHeight: 1.15,
                    mb: 2,
                  }}
                >
                  Welcome home,
                  <Box component="span" sx={{ display: "block", color: palette.gold }}>
                    CardMaster Enclave.
                  </Box>
                </Typography>
                <Typography sx={{ opacity: 0.85, fontSize: 14.5, lineHeight: 1.75, maxWidth: 400 }}>
                  Track maintenance dues, settle bills, raise complaints with photos, and stay
                  connected with the community office — all from one secure resident portal.
                </Typography>

                <Stack direction="row" spacing={1.2} sx={{ mt: 4 }}>
                  {HERO_SLIDES.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setSlide(i)}
                      sx={{
                        width: i === slide ? 32 : 10,
                        height: 3,
                        background: i === slide ? palette.gold : "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        transition: "all 250ms ease",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>

          {/* ---- Right: login form ---- */}
          <Box
            sx={{
              p: { xs: 3.5, sm: 5, md: 6 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 3 }}>
              <Logo variant="light" />
            </Box>

            <Typography
              variant="h4"
              sx={{
                textAlign: "center",
                fontSize: { xs: 24, md: 28 },
                mb: 0.5,
              }}
            >
              Sign in to your account
            </Typography>
            <Typography
              sx={{
                textAlign: "center",
                color: palette.muted,
                fontSize: 14,
                mb: 4,
              }}
            >
              Manage your maintenance dues and community updates.
            </Typography>

            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextField
                  label="Email or registered mobile number"
                  variant="outlined"
                  fullWidth
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
                <TextField
                  label="Password"
                  variant="outlined"
                  fullWidth
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPass((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showPass ? "Hide password" : "Show password"}
                        >
                          {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 0 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!canSubmit}
                  sx={{
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    py: 1.4,
                  }}
                >
                  Sign In
                </Button>

                <Box sx={{ textAlign: "center" }}>
                  <Button
                    component={RouterLink}
                    to="/forgot-password"
                    startIcon={<KeyIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      color: palette.muted,
                      fontSize: 13,
                      textTransform: "none",
                      letterSpacing: 0,
                      "&:hover": { color: palette.goldDeep, background: "transparent" },
                    }}
                  >
                    Forgot password?
                  </Button>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ my: 3 }}>
              <Divider sx={{ "&::before, &::after": { borderColor: palette.border } }}>
                <Typography
                  sx={{ color: palette.muted, fontSize: 11, letterSpacing: "0.28em", px: 1 }}
                >
                  OR
                </Typography>
              </Divider>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ color: palette.muted, fontSize: 14 }}>
                Don't have an account?{" "}
                <Box
                  component={RouterLink}
                  to="/signup"
                  sx={{
                    color: palette.goldDeep,
                    fontWeight: 700,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign up
                </Box>
              </Typography>
            </Box>

          </Box>
        </Paper>

        <Typography
          sx={{
            textAlign: "center",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            mt: 3,
            letterSpacing: "0.12em",
          }}
        >
          © CardMaster Enclave Resident Welfare Association
        </Typography>
      </Container>
    </Box>
  );
}
