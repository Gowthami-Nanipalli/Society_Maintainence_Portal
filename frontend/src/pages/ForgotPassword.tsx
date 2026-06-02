import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../components/Logo";
import { palette } from "../theme";
import { forgotPassword } from "../lib/auth";
import { validateLoginIdentifier } from "../lib/validators";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identifierError = validateLoginIdentifier(identifier);
  const showIdentifierError = (touched || submitAttempted) && identifierError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    if (identifierError) return;
    setSubmitting(true);
    try {
      await forgotPassword(identifier.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the request.");
    } finally {
      setSubmitting(false);
    }
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
      <Container maxWidth="sm">
        <Button
          component={RouterLink}
          to="/login"
          startIcon={<ArrowBackIcon />}
          sx={{
            color: palette.gold,
            mb: 3,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 12,
          }}
        >
          Back to Sign In
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            background: "#fff",
            border: `1px solid ${palette.border}`,
          }}
        >
          <Stack alignItems="center" sx={{ mb: 3 }}>
            <Logo variant="light" />
          </Stack>

          {sent ? (
            <Stack alignItems="center" spacing={2.5} sx={{ py: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: `2px solid ${palette.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2.4s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { boxShadow: `0 0 0 0 rgba(201,169,97,0.5)` },
                    "50%": { boxShadow: `0 0 0 14px rgba(201,169,97,0)` },
                  },
                }}
              >
                <MarkEmailReadIcon sx={{ color: palette.gold, fontSize: 40 }} />
              </Box>

              <Typography variant="h5" sx={{ textAlign: "center", mt: 1 }}>
                Request received
              </Typography>
              <Typography
                sx={{
                  color: palette.muted,
                  textAlign: "center",
                  maxWidth: 380,
                  lineHeight: 1.7,
                }}
              >
                If an account exists for <b>{identifier}</b>, password reset
                instructions will be sent shortly. The link will expire in 30 minutes.
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => {
                    setSent(false);
                    setIdentifier("");
                  }}
                  variant="outlined"
                  color="primary"
                  sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Try another
                </Button>
              </Stack>

              <Typography
                sx={{ color: palette.muted, fontSize: 12.5, textAlign: "center", mt: 2 }}
              >
                Didn't receive it? Contact the community office at{" "}
                <b style={{ color: palette.ink }}>office@cardmasterenclave.in</b>.
              </Typography>
            </Stack>
          ) : (
            <>
              <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: `2px solid ${palette.gold}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LockResetIcon sx={{ color: palette.gold, fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ textAlign: "center" }}>
                  Trouble signing in?
                </Typography>
                <Typography
                  sx={{
                    color: palette.muted,
                    textAlign: "center",
                    fontSize: 14,
                    maxWidth: 380,
                    lineHeight: 1.6,
                  }}
                >
                  Enter the email or mobile number linked to your resident account and we'll
                  send password reset instructions if an account exists.
                </Typography>
              </Stack>

              <Box component="form" onSubmit={submit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Email or mobile number"
                    fullWidth
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => setTouched(true)}
                    autoFocus
                    error={Boolean(showIdentifierError)}
                    helperText={showIdentifierError || " "}
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
                    disabled={submitting}
                    sx={{
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      py: 1.4,
                    }}
                  >
                    {submitting ? "Sending…" : "Send Reset Instructions"}
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  textAlign: "center",
                  mt: 3,
                  pt: 3,
                  borderTop: `1px solid ${palette.border}`,
                }}
              >
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
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
