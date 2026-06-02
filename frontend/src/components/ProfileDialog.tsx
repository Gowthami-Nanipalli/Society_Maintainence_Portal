import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { palette } from "../theme";
import { getCurrentUser, setCurrentUser } from "../lib/auth";
import {
  changeMyEmail,
  changeMyPassword,
  updateMyProfile,
} from "../lib/members";
import type { AuthUser } from "../lib/types";
import { roleLabel } from "../lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = "profile" | "email" | "password";

export default function ProfileDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Profile form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [house, setHouse] = useState("");
  const [plotNo, setPlotNo] = useState("");
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [emailOk, setEmailOk] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const u = getCurrentUser();
    setUser(u);
    setName(u?.name ?? "");
    setMobile(u?.mobile ?? "");
    setHouse(u?.house ?? "");
    setPlotNo(u?.plot_no ?? "");
    setProfileErr(null);
    setProfileOk(false);
    setNewEmail("");
    setEmailPwd("");
    setEmailErr(null);
    setEmailOk(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdErr(null);
    setPwdOk(false);
    setTab("profile");
  }, [open]);

  if (!user) return null;

  const submitProfile = async () => {
    setProfileErr(null);
    setProfileOk(false);
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!name.trim() || cleanMobile.length !== 10) {
      setProfileErr("Name and a 10-digit mobile number are required.");
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        mobile: cleanMobile,
        house: house.trim() || null,
        plot_no: plotNo.trim() || null,
      });
      setCurrentUser(updated);
      setUser(updated);
      setProfileOk(true);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const submitEmail = async () => {
    setEmailErr(null);
    setEmailOk(false);
    if (!newEmail.trim()) {
      setEmailErr("Enter a new email.");
      return;
    }
    if (!emailPwd) {
      setEmailErr("Enter your current password to confirm.");
      return;
    }
    setEmailSaving(true);
    try {
      const updated = await changeMyEmail(newEmail.trim(), emailPwd);
      setCurrentUser(updated);
      setUser(updated);
      setEmailOk(true);
      setNewEmail("");
      setEmailPwd("");
    } catch (err) {
      setEmailErr(err instanceof Error ? err.message : "Could not change email.");
    } finally {
      setEmailSaving(false);
    }
  };

  const submitPassword = async () => {
    setPwdErr(null);
    setPwdOk(false);
    if (!currentPwd) {
      setPwdErr("Enter your current password.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdErr("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdErr("New password and confirmation do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      await changeMyPassword(currentPwd, newPwd);
      setPwdOk(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdErr(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Cinzel", serif', fontSize: 18 }}>
        My Account
        <Typography sx={{ fontSize: 13, color: palette.muted, mt: 0.5 }}>
          {user.name} · {roleLabel(user.role)}
        </Typography>
      </DialogTitle>
      <Box sx={{ borderBottom: `1px solid ${palette.border}`, px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v as Tab)}>
          <Tab label="Profile" value="profile" />
          <Tab label="Email" value="email" />
          <Tab label="Password" value="password" />
        </Tabs>
      </Box>
      <DialogContent>
        {tab === "profile" && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              fullWidth
              inputProps={{ inputMode: "numeric", maxLength: 13 }}
            />
            <TextField
              label="House / Villa No."
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              fullWidth
            />
            <TextField
              label="Plot No. (used in maintenance ledger)"
              value={plotNo}
              onChange={(e) => setPlotNo(e.target.value)}
              helperText="Examples: 7, 8 & 9, 30 & 31"
              fullWidth
            />
            <TextField label="Email" value={user.email} fullWidth disabled />
            <TextField label="Role" value={roleLabel(user.role)} fullWidth disabled />
            {profileErr && (
              <Alert severity="error" sx={{ borderRadius: 0 }}>{profileErr}</Alert>
            )}
            {profileOk && !profileErr && (
              <Alert severity="success" sx={{ borderRadius: 0 }}>
                Profile updated.
              </Alert>
            )}
          </Stack>
        )}
        {tab === "email" && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Current email" value={user.email} disabled fullWidth />
            <TextField
              label="New email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Current password (to confirm)"
              type="password"
              value={emailPwd}
              onChange={(e) => setEmailPwd(e.target.value)}
              fullWidth
            />
            {emailErr && (
              <Alert severity="error" sx={{ borderRadius: 0 }}>{emailErr}</Alert>
            )}
            {emailOk && !emailErr && (
              <Alert severity="success" sx={{ borderRadius: 0 }}>
                Email updated. Use the new email on your next sign-in.
              </Alert>
            )}
          </Stack>
        )}
        {tab === "password" && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Current password"
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              helperText="At least 6 characters, no spaces."
              fullWidth
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              fullWidth
            />
            {pwdErr && <Alert severity="error" sx={{ borderRadius: 0 }}>{pwdErr}</Alert>}
            {pwdOk && !pwdErr && (
              <Alert severity="success" sx={{ borderRadius: 0 }}>
                Password updated.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Close</Button>
        {tab === "profile" && (
          <Button
            variant="contained"
            color="primary"
            onClick={submitProfile}
            disabled={profileSaving}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {profileSaving ? "Saving…" : "Save Profile"}
          </Button>
        )}
        {tab === "email" && (
          <Button
            variant="contained"
            color="primary"
            onClick={submitEmail}
            disabled={emailSaving}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {emailSaving ? "Saving…" : "Update Email"}
          </Button>
        )}
        {tab === "password" && (
          <Button
            variant="contained"
            color="primary"
            onClick={submitPassword}
            disabled={pwdSaving}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {pwdSaving ? "Saving…" : "Change Password"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
