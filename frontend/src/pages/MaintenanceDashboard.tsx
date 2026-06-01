import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import { Navigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { palette } from "../theme";
import {
  getAccounts,
  recordPayment,
  updateAccount,
  type Account,
} from "../lib/accounts";
import { getCurrentUser, updateCurrentUser } from "../lib/session";

const TREASURER_ROLE = "Treasurer";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusOf(a: Account): "Cleared" | "Pending" {
  return a.amountDue === 0 ? "Cleared" : "Pending";
}

export default function MaintenanceDashboard() {
  const user = getCurrentUser();
  const [accounts, setAccounts] = useState<Account[]>(() => getAccounts());
  const [payingFor, setPayingFor] = useState<Account | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payError, setPayError] = useState<string | null>(null);

  const [showMyPayments, setShowMyPayments] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", mobile: "", house: "" });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    document.title = "Maintenance · CardMaster Enclave";
  }, []);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.house.localeCompare(b.house)),
    [accounts]
  );

  const totals = useMemo(() => {
    const due = accounts.reduce((s, a) => s + a.amountDue, 0);
    const cleared = accounts.filter((a) => statusOf(a) === "Cleared").length;
    const collected = accounts.reduce((s, a) => s + a.lastPaidAmount, 0);
    return { due, cleared, total: accounts.length, collected };
  }, [accounts]);

  const myAccount = useMemo(
    () => accounts.find((a) => a.email.toLowerCase() === user?.email.toLowerCase()) ?? null,
    [accounts, user]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isTreasurer = user.role === TREASURER_ROLE;

  const openMyPayments = () => setShowMyPayments(true);
  const openMyProfile = () => {
    if (myAccount) {
      setProfileForm({
        name: myAccount.name,
        mobile: myAccount.mobile,
        house: myAccount.house,
      });
    }
    setProfileError(null);
    setProfileSaved(false);
    setShowMyProfile(true);
  };

  const submitProfile = () => {
    if (!user) return;
    const name = profileForm.name.trim();
    const mobile = profileForm.mobile.replace(/\D/g, "");
    const house = profileForm.house.trim();
    if (!name || mobile.length < 10 || !house) {
      setProfileError("Name, 10-digit mobile and villa are all required.");
      return;
    }
    const result = updateAccount(user.email, { name, mobile, house });
    if (!result.ok) {
      setProfileError(
        result.reason === "mobile-taken"
          ? "That mobile number is already used by another member."
          : "Could not update profile. Please try again."
      );
      return;
    }
    updateCurrentUser({
      name: result.account.name,
      mobile: result.account.mobile,
      house: result.account.house,
    });
    setAccounts(getAccounts());
    setProfileError(null);
    setProfileSaved(true);
  };

  const openPaymentDialog = (account: Account) => {
    setPayingFor(account);
    setPayAmount(String(account.amountDue || ""));
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayError(null);
  };

  const closePaymentDialog = () => {
    setPayingFor(null);
    setPayError(null);
  };

  const submitPayment = () => {
    if (!payingFor) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError("Enter a valid amount greater than zero.");
      return;
    }
    if (amount > payingFor.amountDue) {
      setPayError(
        `Amount exceeds outstanding due of ${formatINR(payingFor.amountDue)}.`
      );
      return;
    }
    const updated = recordPayment(payingFor.email, amount, payDate);
    if (!updated) {
      setPayError("Could not record this payment. Please try again.");
      return;
    }
    setAccounts(getAccounts());
    closePaymentDialog();
  };

  return (
    <DashboardShell user={user} onOpenMyPayments={openMyPayments} onOpenMyProfile={openMyProfile}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: palette.gold,
            letterSpacing: "0.32em",
          }}
        >
          MAINTENANCE DASHBOARD
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>
          Society Maintenance Bills
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: 14 }}>
          Every member's current cycle dues, last payment and status — at a glance.
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <StatTile label="Total Members" value={String(totals.total)} accent={palette.ink} />
        <StatTile
          label="Cleared This Cycle"
          value={`${totals.cleared} / ${totals.total}`}
          accent="#2e7d32"
        />
        <StatTile label="Maintenance Collected" value={formatINR(totals.collected)} accent={palette.gold} />
        <StatTile label="Outstanding Dues" value={formatINR(totals.due)} accent="#c62828" />
      </Stack>

      <Paper
        elevation={0}
        sx={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}
      >
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ background: palette.cream }}>
              <TableRow>
                <HeaderCell>Villa No.</HeaderCell>
                <HeaderCell>Member Name</HeaderCell>
                <HeaderCell>Contact</HeaderCell>
                <HeaderCell align="right">Amount Due</HeaderCell>
                <HeaderCell align="right">Last Paid Amount</HeaderCell>
                <HeaderCell>Last Paid On</HeaderCell>
                <HeaderCell>Payment Status</HeaderCell>
                {isTreasurer && <HeaderCell align="right">Action</HeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAccounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isTreasurer ? 8 : 7}
                    sx={{ textAlign: "center", py: 5, color: palette.muted }}
                  >
                    No members registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAccounts.map((a) => {
                  const status = statusOf(a);
                  return (
                    <TableRow key={a.email} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{a.house || "—"}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell sx={{ color: palette.muted }}>{a.mobile}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {a.amountDue > 0 ? formatINR(a.amountDue) : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {a.lastPaidAmount > 0 ? formatINR(a.lastPaidAmount) : "—"}
                      </TableCell>
                      <TableCell sx={{ color: palette.muted }}>
                        {formatDate(a.lastPaidOn)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            fontSize: 11,
                            background: status === "Cleared" ? "#e6f4ea" : "#fdecea",
                            color: status === "Cleared" ? "#2e7d32" : "#c62828",
                            borderRadius: 0,
                          }}
                        />
                      </TableCell>
                      {isTreasurer && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PaymentIcon sx={{ fontSize: 16 }} />}
                            disabled={a.amountDue === 0}
                            onClick={() => openPaymentDialog(a)}
                            sx={{
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              fontSize: 11,
                              py: 0.6,
                            }}
                          >
                            Record
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {!isTreasurer && (
        <Typography sx={{ mt: 2, fontSize: 12, color: palette.muted, fontStyle: "italic" }}>
          Only the Treasurer can record payments. Contact the community office to update your dues.
        </Typography>
      )}

      <Dialog open={!!payingFor} onClose={closePaymentDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif', fontSize: 18 }}>
          Record Payment
          {payingFor && (
            <Typography sx={{ fontSize: 13, color: palette.muted, mt: 0.5 }}>
              {payingFor.name} · Villa {payingFor.house}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {payingFor && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box
                sx={{
                  p: 1.5,
                  background: palette.cream,
                  border: `1px dashed ${palette.border}`,
                }}
              >
                <Typography sx={{ fontSize: 12, color: palette.muted, letterSpacing: "0.18em" }}>
                  OUTSTANDING DUE
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: palette.ink }}>
                  {formatINR(payingFor.amountDue)}
                </Typography>
              </Box>
              <TextField
                label="Amount received"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                fullWidth
                autoFocus
                inputProps={{ min: 1, max: payingFor.amountDue }}
              />
              <TextField
                label="Payment date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              {payError && (
                <Typography sx={{ color: "#c62828", fontSize: 13 }}>{payError}</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closePaymentDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={submitPayment}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showMyPayments} onClose={() => setShowMyPayments(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif', fontSize: 18 }}>
          My Payments
          <Typography sx={{ fontSize: 13, color: palette.muted, mt: 0.5 }}>
            {user.name} · Villa {user.house || "—"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {myAccount ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ p: 2, background: palette.cream, border: `1px dashed ${palette.border}` }}>
                <Typography sx={{ fontSize: 11, color: palette.muted, letterSpacing: "0.18em" }}>
                  OUTSTANDING DUE
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: palette.ink }}>
                  {formatINR(myAccount.amountDue)}
                </Typography>
                <Chip
                  label={statusOf(myAccount)}
                  size="small"
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    fontSize: 11,
                    background: statusOf(myAccount) === "Cleared" ? "#e6f4ea" : "#fdecea",
                    color: statusOf(myAccount) === "Cleared" ? "#2e7d32" : "#c62828",
                    borderRadius: 0,
                  }}
                />
              </Box>
              <Box sx={{ p: 2, border: `1px solid ${palette.border}` }}>
                <Typography sx={{ fontSize: 11, color: palette.muted, letterSpacing: "0.18em" }}>
                  LAST PAYMENT
                </Typography>
                {myAccount.lastPaidAmount > 0 ? (
                  <>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: palette.ink, mt: 0.5 }}>
                      {formatINR(myAccount.lastPaidAmount)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: palette.muted }}>
                      Received on {formatDate(myAccount.lastPaidOn)}
                    </Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 14, color: palette.muted, mt: 0.5 }}>
                    No payments recorded yet.
                  </Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: 12, color: palette.muted, fontStyle: "italic" }}>
                Payments are recorded by the Treasurer. Contact the community office to settle dues.
              </Typography>
            </Stack>
          ) : (
            <Typography sx={{ color: palette.muted }}>
              No payment record found for your account.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowMyPayments(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showMyProfile}
        onClose={() => setShowMyProfile(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif', fontSize: 18 }}>
          My Profile
          <Typography sx={{ fontSize: 13, color: palette.muted, mt: 0.5 }}>
            Update your personal details.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Full name"
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              value={user.email}
              fullWidth
              disabled
              helperText="Email is your login ID and can't be changed here."
            />
            <TextField
              label="Mobile number"
              value={profileForm.mobile}
              onChange={(e) => setProfileForm((f) => ({ ...f, mobile: e.target.value }))}
              fullWidth
              inputProps={{ inputMode: "numeric", maxLength: 13 }}
            />
            <TextField
              label="Villa / House no."
              value={profileForm.house}
              onChange={(e) => setProfileForm((f) => ({ ...f, house: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Role"
              value={user.role}
              fullWidth
              disabled
              helperText="Role is assigned by the community office."
            />
            {profileError && (
              <Alert severity="error" sx={{ borderRadius: 0 }}>
                {profileError}
              </Alert>
            )}
            {profileSaved && !profileError && (
              <Alert severity="success" sx={{ borderRadius: 0 }}>
                Profile updated.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowMyProfile(false)} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={submitProfile}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardShell>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <TableCell
      align={align}
      sx={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: palette.muted,
      }}
    >
      {children}
    </TableCell>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2.5,
        border: `1px solid ${palette.border}`,
        borderLeft: `4px solid ${accent}`,
        background: "#fff",
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: palette.muted,
        }}
      >
        {label.toUpperCase()}
      </Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 700, mt: 0.5, color: palette.ink }}>
        {value}
      </Typography>
    </Paper>
  );
}
