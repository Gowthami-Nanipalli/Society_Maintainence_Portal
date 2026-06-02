import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import Logo from "../components/Logo";
import { palette } from "../theme";
import { signup } from "../lib/auth";
import {
  digitsOnly,
  validateConfirmPassword,
  validateEmail,
  validateHouse,
  validateMobile,
  validateName,
  validatePassword,
} from "../lib/validators";

type FormField = "name" | "email" | "mobile" | "house" | "password" | "confirm";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    house: "",
    plot_no: "",
    password: "",
    confirm: "",
  });
  const [touched, setTouched] = useState<Record<FormField, boolean>>({
    name: false,
    email: false,
    mobile: false,
    house: false,
    password: false,
    confirm: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const markTouched = (k: FormField) => () =>
    setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  const errors: Record<FormField, string | null> = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    mobile: validateMobile(form.mobile),
    house: validateHouse(form.house),
    password: validatePassword(form.password),
    confirm: validateConfirmPassword(form.password, form.confirm),
  };

  const fieldErr = (k: FormField): string | null =>
    (touched[k] || submitAttempted) ? errors[k] : null;

  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    if (hasErrors) return;
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: digitsOnly(form.mobile),
        house: form.house.trim(),
        plot_no: form.plot_no.trim() || null,
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
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
      <Container maxWidth="md">
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
            p: { xs: 3.5, sm: 5, md: 6 },
            background: "#fff",
            border: `1px solid ${palette.border}`,
          }}
        >
          <Stack alignItems="center" sx={{ mb: 4 }}>
            <Logo variant="light" />
          </Stack>

          {done ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
              <CheckCircleIcon sx={{ color: palette.gold, fontSize: 56 }} />
              <Typography variant="h5">Account created</Typography>
              <Typography sx={{ color: palette.muted, textAlign: "center", maxWidth: 480 }}>
                Thanks <b>{form.name || "resident"}</b>. You can sign in now with{" "}
                <b>read-only</b> access to maintenance and expenditure records. Your
                account stays in <b>pending</b> state until the Secretary approves it —
                approval is what gets your plot added to the billing ledger.
                You will receive an email confirmation at <b>{form.email}</b>.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Go to Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="outlined"
                  color="primary"
                  sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Back to Home
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Typography
                variant="h4"
                sx={{ textAlign: "center", mb: 0.5, fontSize: { xs: 24, md: 28 } }}
              >
                Create your resident account
              </Typography>
              <Typography
                sx={{ textAlign: "center", color: palette.muted, fontSize: 14, mb: 4 }}
              >
                New accounts are reviewed by the Society Secretary before access is granted.
              </Typography>

              <Box component="form" onSubmit={submit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Full name"
                    fullWidth
                    required
                    value={form.name}
                    onChange={set("name")}
                    onBlur={markTouched("name")}
                    error={Boolean(fieldErr("name"))}
                    helperText={fieldErr("name") ?? " "}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Email address"
                      type="email"
                      fullWidth
                      required
                      value={form.email}
                      onChange={set("email")}
                      onBlur={markTouched("email")}
                      error={Boolean(fieldErr("email"))}
                      helperText={fieldErr("email") ?? " "}
                    />
                    <TextField
                      label="Mobile number"
                      fullWidth
                      required
                      value={form.mobile}
                      onChange={set("mobile")}
                      onBlur={markTouched("mobile")}
                      error={Boolean(fieldErr("mobile"))}
                      helperText={fieldErr("mobile") ?? "10-digit Indian mobile number."}
                      inputProps={{ inputMode: "numeric", maxLength: 10 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography sx={{ color: palette.muted, fontSize: 14 }}>+91</Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="House / Villa No."
                      placeholder="e.g. A-101"
                      fullWidth
                      required
                      value={form.house}
                      onChange={set("house")}
                      onBlur={markTouched("house")}
                      error={Boolean(fieldErr("house"))}
                      helperText={fieldErr("house") ?? " "}
                    />
                    <TextField
                      label="Plot No. (optional)"
                      placeholder="e.g. 7 or 8 & 9"
                      fullWidth
                      value={form.plot_no}
                      onChange={set("plot_no")}
                      helperText="Used in the maintenance ledger."
                    />
                  </Stack>
                  <TextField
                    label="Password"
                    type={showPass ? "text" : "password"}
                    fullWidth
                    required
                    value={form.password}
                    onChange={set("password")}
                    onBlur={markTouched("password")}
                    error={Boolean(fieldErr("password"))}
                    helperText={fieldErr("password") ?? "At least 6 characters, no spaces."}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPass((v) => !v)}
                            edge="end"
                            size="small"
                          >
                            {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Confirm password"
                    type={showPass ? "text" : "password"}
                    fullWidth
                    required
                    value={form.confirm}
                    onChange={set("confirm")}
                    onBlur={markTouched("confirm")}
                    error={Boolean(fieldErr("confirm"))}
                    helperText={fieldErr("confirm") ?? " "}
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
                    {submitting ? "Submitting…" : "Submit for Approval"}
                  </Button>
                </Stack>
              </Box>

              <Typography sx={{ textAlign: "center", color: palette.muted, fontSize: 14, mt: 3 }}>
                Already have an account?{" "}
                <Box
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: palette.goldDeep,
                    fontWeight: 700,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign in
                </Box>
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
