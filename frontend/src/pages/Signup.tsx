import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
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
import { addAccount } from "../lib/accounts";
import {
  digitsOnly,
  validateConfirmPassword,
  validateEmail,
  validateHouse,
  validateMobile,
  validateName,
  validatePassword,
} from "../lib/validators";

const ROLES = [
  {
    value: "Community Member",
    desc: "Standard resident — view dues, pay maintenance, raise complaints.",
  },
  {
    value: "Secretary",
    desc: "Oversight role — read-only view of all dues, complaints and expenses.",
  },
  {
    value: "President",
    desc: "Oversight role — read-only view of all dues, complaints and expenses.",
  },
  {
    value: "Treasurer",
    desc: "Admin role — records payments, manages expenses and plans.",
  },
];

type FormField = "name" | "email" | "mobile" | "house" | "password" | "confirm";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    house: "",
    role: ROLES[0].value,
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (hasErrors) return;

    const result = addAccount({
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: digitsOnly(form.mobile),
      house: form.house.trim(),
      role: form.role,
      password: form.password,
    });

    if (!result.ok) {
      setError(
        result.reason === "email-taken"
          ? "An account with this email already exists. Please sign in instead."
          : "An account with this mobile number already exists. Please sign in instead."
      );
      return;
    }

    setDone(true);
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
              <Typography variant="h5">Account request submitted</Typography>
              <Typography sx={{ color: palette.muted, textAlign: "center", maxWidth: 480 }}>
                Thanks <b>{form.name || "resident"}</b>. Your account will be created with the
                role <b>{form.role}</b> for house{" "}
                <b>{form.house || "—"}</b>. The community office will verify the details and
                approve your account within one business day. You'll receive an email at{" "}
                <b>{form.email}</b> once it's ready.
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
              <Typography variant="h4" sx={{ textAlign: "center", mb: 0.5, fontSize: { xs: 24, md: 28 } }}>
                Create your resident account
              </Typography>
              <Typography
                sx={{ textAlign: "center", color: palette.muted, fontSize: 14, mb: 4 }}
              >
                Sign up to access the maintenance portal at CardMaster Enclave.
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
                      select
                      label="Your role at the society"
                      fullWidth
                      value={form.role}
                      onChange={set("role")}
                      helperText={
                        ROLES.find((r) => r.value === form.role)?.desc ?? " "
                      }
                    >
                      {ROLES.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.value}
                        </MenuItem>
                      ))}
                    </TextField>
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
                    sx={{
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      py: 1.4,
                    }}
                  >
                    Create Account
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
