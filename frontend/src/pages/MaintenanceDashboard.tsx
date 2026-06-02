import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import { Navigate, useNavigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { palette } from "../theme";
import { getCurrentUser, logout } from "../lib/auth";
import {
  assignMaintenance,
  fetchBillDetail,
  fetchLedger,
  recordPayment,
} from "../lib/maintenance";
import type {
  BillDetail,
  MaintenanceBillRow,
  MaintenanceLedger,
  PaymentMethod,
} from "../lib/types";
import { formatDate, formatINR, todayISO, toNumber } from "../lib/format";
import ProfileDialog from "../components/ProfileDialog";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

// Match the prototype: the dashboard is pinned to FY 2025-26 so the
// treasurer always lands on the FY their bills live in.
const FY_START_YEAR = 2025;
const FY_PERIOD_FROM = "2025-04-01";
const FY_PERIOD_TO = "2026-03-31";
const DEFAULT_ASSIGN_AMOUNT = 88000;

// Prototype palette tokens, kept local so the rest of the app's theme is untouched.
const PROTO = {
  headBg: "#d9e1f2",
  headRule: "#c3d0e8",
  greenBg: "#c6efce",
  greenInk: "#0f6f3a",
  redBg: "#ffc7ce",
  redInk: "#9c0006",
  rowHover: "#f8fbff",
  totalBg: "#f1f5fb",
};

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [ledger, setLedger] = useState<MaintenanceLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Multi-select Record Payment dialog (Treasurer-only)
  const [payOpen, setPayOpen] = useState(false);
  const [payDate, setPayDate] = useState(() => todayISO());
  const [payAmount, setPayAmount] = useState("88000");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [paySelected, setPaySelected] = useState<Set<number>>(new Set());
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payNotice, setPayNotice] = useState<string | null>(null);

  // Multi-select Assign Maintenance dialog (Treasurer-only)
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignFrom, setAssignFrom] = useState(FY_PERIOD_FROM);
  const [assignTo, setAssignTo] = useState(FY_PERIOD_TO);
  const [assignAmount, setAssignAmount] = useState(String(DEFAULT_ASSIGN_AMOUNT));
  const [assignSelected, setAssignSelected] = useState<Set<number>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Transaction history dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<BillDetail | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const isTreasurer = user?.role === "treasurer";

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchLedger(FY_START_YEAR);
      setLedger(data);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Could not load the maintenance ledger."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Maintenance · CardMaster Enclave";
  }, []);

  // Run once on mount. `reload` is wrapped in useCallback([]) so it's stable;
  // depending on `user` here would re-fire every render because
  // getCurrentUser() returns a fresh object reference each call → infinite loop.
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myRow = useMemo(() => {
    if (!ledger || !user) return null;
    return ledger.rows.find((r) => r.member_id === user.id) ?? null;
  }, [ledger, user]);

  // Display rows sorted by plot number ascending. Plot numbers may be
  // alphanumeric (e.g. "A-12"), so use locale-aware numeric comparison.
  const sortedRows = useMemo(() => {
    if (!ledger) return [];
    return [...ledger.rows].sort((a, b) =>
      (a.plot_no ?? "").localeCompare(b.plot_no ?? "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [ledger]);

  const totalDue = useMemo(
    () => sortedRows.reduce((acc, r) => acc + toNumber(r.closing_balance), 0),
    [sortedRows]
  );

  if (!user) return <Navigate to="/login" replace />;

  const openHistory = async (row: MaintenanceBillRow) => {
    setHistoryOpen(true);
    setHistoryDetail(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const detail = await fetchBillDetail(row.bill_id);
      setHistoryDetail(detail);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Could not load payment history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryDetail(null);
  };

  const openMyHistory = async () => {
    if (!myRow) {
      setHistoryOpen(true);
      setHistoryDetail(null);
      setHistoryError("No bill is associated with your account yet.");
      return;
    }
    await openHistory(myRow);
  };

  const openRecordPayment = () => {
    setPayDate(todayISO());
    setPayAmount("88000");
    setPayMethod("cash");
    setPaySelected(new Set());
    setPayError(null);
    setPayNotice(null);
    setPayOpen(true);
  };

  const closeRecordPayment = () => {
    if (paySaving) return;
    setPayOpen(false);
  };

  const openAssignMaintenance = () => {
    setAssignFrom(FY_PERIOD_FROM);
    setAssignTo(FY_PERIOD_TO);
    setAssignAmount(String(DEFAULT_ASSIGN_AMOUNT));
    setAssignSelected(new Set());
    setAssignError(null);
    setAssignOpen(true);
  };

  const closeAssignMaintenance = () => {
    if (assignSaving) return;
    setAssignOpen(false);
  };

  const toggleAssignSelected = (billId: number) => {
    setAssignSelected((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  };

  const allAssignSelected =
    sortedRows.length > 0 &&
    sortedRows.every((r) => assignSelected.has(r.bill_id));
  const someAssignSelected =
    assignSelected.size > 0 && !allAssignSelected;

  const toggleAssignSelectAll = () => {
    if (allAssignSelected) {
      setAssignSelected(new Set());
    } else {
      setAssignSelected(new Set(sortedRows.map((r) => r.bill_id)));
    }
  };

  const enteredAssignAmount = Number(assignAmount) || 0;
  const totalToAssign = enteredAssignAmount * assignSelected.size;

  const submitAssign = async () => {
    if (assignSelected.size === 0) {
      setAssignError("Pick at least one member.");
      return;
    }
    if (!Number.isFinite(enteredAssignAmount) || enteredAssignAmount <= 0) {
      setAssignError("Enter a valid amount greater than zero.");
      return;
    }
    if (!assignFrom || !assignTo) {
      setAssignError("Pick a from-date and to-date.");
      return;
    }
    if (assignFrom > assignTo) {
      setAssignError("From-date cannot be after To-date.");
      return;
    }

    setAssignSaving(true);
    setAssignError(null);

    try {
      const result = await assignMaintenance({
        bill_ids: Array.from(assignSelected),
        amount: enteredAssignAmount,
        from_date: assignFrom,
        to_date: assignTo,
      });
      setAssignOpen(false);
      setPayNotice(
        `Assigned ${formatINR(enteredAssignAmount)} to ${result.updated_count} member(s).`
      );
      await reload();
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Could not assign maintenance."
      );
    } finally {
      setAssignSaving(false);
    }
  };

  const toggleSelected = (billId: number) => {
    setPaySelected((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  };

  const selectablePendingRows = useMemo(
    () => sortedRows.filter((r) => toNumber(r.closing_balance) > 0),
    [sortedRows]
  );

  const allPendingSelected =
    selectablePendingRows.length > 0 &&
    selectablePendingRows.every((r) => paySelected.has(r.bill_id));

  const someSelected = paySelected.size > 0 && !allPendingSelected;

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setPaySelected(new Set());
    } else {
      setPaySelected(new Set(selectablePendingRows.map((r) => r.bill_id)));
    }
  };

  const enteredAmount = Number(payAmount) || 0;
  const totalToReceive = enteredAmount * paySelected.size;

  const submitMultiPayment = async () => {
    if (paySelected.size === 0) {
      setPayError("Pick at least one member.");
      return;
    }
    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      setPayError("Enter a valid amount greater than zero.");
      return;
    }
    if (!payDate) {
      setPayError("Pick a payment date.");
      return;
    }

    setPaySaving(true);
    setPayError(null);
    setPayNotice(null);

    const targets = sortedRows.filter((r) => paySelected.has(r.bill_id));
    const results = await Promise.allSettled(
      targets.map((row) => {
        const outstanding = toNumber(row.closing_balance);
        // Cap per-member contribution at their remaining balance so the
        // backend's "amount exceeds outstanding" guard never trips.
        const amount = Math.min(enteredAmount, outstanding);
        if (amount <= 0) {
          return Promise.reject(new Error("already cleared"));
        }
        return recordPayment({
          bill_id: row.bill_id,
          amount,
          paid_on: payDate,
          method: payMethod,
        });
      })
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;

    setPaySaving(false);

    if (ok === 0) {
      setPayError(
        failed === results.length
          ? "Could not record any payment. Please retry."
          : null
      );
      return;
    }

    setPayOpen(false);
    setPayNotice(
      failed === 0
        ? `Recorded ${ok} payment${ok === 1 ? "" : "s"}.`
        : `Recorded ${ok} payment${ok === 1 ? "" : "s"}; ${failed} skipped.`
    );
    await reload();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DashboardShell
      user={user}
      onOpenMyPayments={isTreasurer ? undefined : openMyHistory}
      onOpenMyProfile={() => setProfileOpen(true)}
      onLogout={handleLogout}
      onOpenRecordPayment={isTreasurer ? openRecordPayment : undefined}
      onOpenAssignMaintenance={isTreasurer ? openAssignMaintenance : undefined}
    >
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
          Maintenance Payable / Due Accounts
          {ledger ? ` · ${ledger.fiscal_year.label}` : ""}
        </Typography>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
          {loadError}
        </Alert>
      )}

      {payNotice && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 0 }}
          onClose={() => setPayNotice(null)}
        >
          {payNotice}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${palette.border}`,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            background: PROTO.headBg,
            color: palette.ink,
            px: 2.5,
            py: 1.5,
            fontWeight: 700,
            fontSize: 15,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          Members {ledger ? `· ${ledger.fiscal_year.label}` : ""}
        </Box>

        <TableContainer sx={{ maxHeight: 620 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <ProtoHeader width={56}>S.No</ProtoHeader>
                <ProtoHeader width={92}>Plot No</ProtoHeader>
                <ProtoHeader align="left">Name of the Member</ProtoHeader>
                <ProtoHeader align="right">Amount To Be Paid</ProtoHeader>
                <ProtoHeader>Status</ProtoHeader>
                <ProtoHeader>Transaction History</ProtoHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                    <CircularProgress size={24} sx={{ color: palette.gold }} />
                  </TableCell>
                </TableRow>
              ) : sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ textAlign: "center", py: 5, color: palette.muted }}
                  >
                    No approved members with plots yet. New signups need to be
                    approved by the Secretary before they appear here.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row, idx) => {
                  const due = toNumber(row.closing_balance);
                  const cleared = due <= 0;
                  return (
                    <TableRow
                      key={row.bill_id}
                      sx={{ "&:hover": { background: PROTO.rowHover } }}
                    >
                      <TableCell sx={{ textAlign: "center" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                        {row.plot_no || "—"}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.member_name}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 700,
                          background: cleared ? "transparent" : PROTO.redBg,
                          color: cleared ? PROTO.greenInk : PROTO.redInk,
                          pr: 2,
                        }}
                      >
                        {cleared
                          ? "0"
                          : new Intl.NumberFormat("en-IN").format(due)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Chip
                          label={cleared ? "cleared" : "pending"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            background: cleared ? PROTO.greenBg : PROTO.redBg,
                            color: cleared ? PROTO.greenInk : PROTO.redInk,
                            borderRadius: 20,
                            px: 0.5,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openHistory(row)}
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "none",
                            borderColor: PROTO.headRule,
                            color: "#1f6feb",
                            "&:hover": {
                              background: "#eef5ff",
                              borderColor: PROTO.headRule,
                            },
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {ledger && sortedRows.length > 0 && (
              <TableBody>
                <TableRow sx={{ background: PROTO.totalBg }}>
                  <TableCell
                    colSpan={3}
                    sx={{
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      borderTop: `2px solid ${PROTO.headRule}`,
                    }}
                  >
                    TOTAL
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      borderTop: `2px solid ${PROTO.headRule}`,
                      pr: 2,
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(totalDue)}
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{ borderTop: `2px solid ${PROTO.headRule}` }}
                  />
                </TableRow>
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </Paper>

      {!isTreasurer && (
        <Typography sx={{ fontSize: 12, color: palette.muted, fontStyle: "italic" }}>
          Only the Treasurer can record payments. President, Secretary and
          community members have read-only access to this ledger.
        </Typography>
      )}

      {/* ---- Multi-select Record Payment dialog (Treasurer only) ---- */}
      <Dialog
        open={payOpen}
        onClose={closeRecordPayment}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: '"Cinzel", serif',
            fontSize: 17,
            background: palette.ink,
            color: "#fff",
          }}
        >
          Record Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ pt: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              label="Payment date"
              type="date"
              size="small"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              label="Amount Received (₹)"
              type="number"
              size="small"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              inputProps={{ min: 1, step: 1000 }}
              sx={{ flex: 1, minWidth: 140 }}
            />
            <TextField
              label="Mode"
              select
              size="small"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              sx={{ flex: 1, minWidth: 140 }}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ border: `1px solid ${palette.border}`, borderRadius: 1 }}>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                background: "#eef5ff",
                borderBottom: `1px solid ${palette.border}`,
                px: 2,
                py: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <Checkbox
                size="small"
                checked={allPendingSelected}
                indeterminate={someSelected}
                onChange={toggleSelectAll}
                disabled={selectablePendingRows.length === 0}
                sx={{ p: 0.5 }}
              />
              <span>
                Select All ({selectablePendingRows.length} pending)
              </span>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: "auto" }}>
              {sortedRows.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", color: palette.muted }}>
                  No members in the ledger yet.
                </Box>
              ) : (
                sortedRows.map((row) => {
                  const due = toNumber(row.closing_balance);
                  const cleared = due <= 0;
                  return (
                    <Box
                      key={row.bill_id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        borderBottom: "1px solid #f1f3f6",
                        opacity: cleared ? 0.55 : 1,
                        "&:hover": { background: PROTO.rowHover },
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={paySelected.has(row.bill_id)}
                        onChange={() => toggleSelected(row.bill_id)}
                        disabled={cleared}
                        sx={{ p: 0.5 }}
                      />
                      <Box sx={{ flex: 1, fontSize: 13.5 }}>
                        <b>{row.plot_no}</b> · {row.member_name}
                      </Box>
                      <Box
                        sx={{
                          fontSize: 12,
                          color: palette.muted,
                        }}
                      >
                        Due:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: cleared ? PROTO.greenInk : PROTO.redInk,
                          }}
                        >
                          {cleared ? "cleared" : formatINR(due)}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {payError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 0 }}>
              {payError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            justifyContent: "space-between",
            borderTop: `1px solid ${palette.border}`,
            background: "#f9fafc",
          }}
        >
          <Typography sx={{ fontSize: 13, color: palette.muted }}>
            Selected: <b style={{ color: palette.ink }}>{paySelected.size}</b> ·
            Total received:{" "}
            <b style={{ color: palette.ink }}>{formatINR(totalToReceive)}</b>
          </Typography>
          <Box>
            <Button
              onClick={closeRecordPayment}
              color="inherit"
              disabled={paySaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={submitMultiPayment}
              disabled={paySaving || paySelected.size === 0}
              sx={{
                ml: 1,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {paySaving ? "Saving…" : "Record Payment"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ---- Multi-select Assign Maintenance dialog (Treasurer only) ---- */}
      <Dialog
        open={assignOpen}
        onClose={closeAssignMaintenance}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: '"Cinzel", serif',
            fontSize: 17,
            background: palette.ink,
            color: "#fff",
          }}
        >
          Assign Maintenance
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ pt: 2, mb: 2, flexWrap: "wrap" }}
          >
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={assignFrom}
              onChange={(e) => setAssignFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              label="Amount Payable (₹)"
              type="number"
              size="small"
              value={assignAmount}
              onChange={(e) => setAssignAmount(e.target.value)}
              inputProps={{ min: 1, step: 1000 }}
              sx={{ flex: 1, minWidth: 140 }}
            />
          </Stack>

          <Box sx={{ border: `1px solid ${palette.border}`, borderRadius: 1 }}>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                background: "#eef5ff",
                borderBottom: `1px solid ${palette.border}`,
                px: 2,
                py: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <Checkbox
                size="small"
                checked={allAssignSelected}
                indeterminate={someAssignSelected}
                onChange={toggleAssignSelectAll}
                disabled={sortedRows.length === 0}
                sx={{ p: 0.5 }}
              />
              <span>Select All ({sortedRows.length} members)</span>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: "auto" }}>
              {sortedRows.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", color: palette.muted }}>
                  No members in the ledger yet.
                </Box>
              ) : (
                sortedRows.map((row) => {
                  const due = toNumber(row.closing_balance);
                  const cleared = due <= 0;
                  return (
                    <Box
                      key={row.bill_id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        borderBottom: "1px solid #f1f3f6",
                        "&:hover": { background: PROTO.rowHover },
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={assignSelected.has(row.bill_id)}
                        onChange={() => toggleAssignSelected(row.bill_id)}
                        sx={{ p: 0.5 }}
                      />
                      <Box sx={{ flex: 1, fontSize: 13.5 }}>
                        <b>{row.plot_no}</b> · {row.member_name}
                      </Box>
                      <Box sx={{ fontSize: 12, color: palette.muted }}>
                        Due:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: cleared ? PROTO.greenInk : PROTO.redInk,
                          }}
                        >
                          {cleared ? "cleared" : formatINR(due)}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {assignError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 0 }}>
              {assignError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            justifyContent: "space-between",
            borderTop: `1px solid ${palette.border}`,
            background: "#f9fafc",
          }}
        >
          <Typography sx={{ fontSize: 13, color: palette.muted }}>
            Selected:{" "}
            <b style={{ color: palette.ink }}>{assignSelected.size}</b> · Total
            charged:{" "}
            <b style={{ color: palette.ink }}>{formatINR(totalToAssign)}</b>
          </Typography>
          <Box>
            <Button
              onClick={closeAssignMaintenance}
              color="inherit"
              disabled={assignSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={submitAssign}
              disabled={assignSaving || assignSelected.size === 0}
              sx={{
                ml: 1,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {assignSaving ? "Saving…" : "Assign Maintenance"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ---- Transaction History dialog ---- */}
      <Dialog open={historyOpen} onClose={closeHistory} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontFamily: '"Cinzel", serif',
            fontSize: 17,
            background: palette.ink,
            color: "#fff",
          }}
        >
          Transaction
          {historyDetail && ` — ${historyDetail.bill.member_name}`}
          {historyDetail && (
            <Typography sx={{ fontSize: 12, color: "#cdd9ec", mt: 0.5 }}>
              Plot {historyDetail.bill.plot_no} ·{" "}
              {historyDetail.bill.fiscal_year_label}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {historyLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress size={24} sx={{ color: palette.gold }} />
            </Box>
          ) : historyError ? (
            <Alert severity="error" sx={{ borderRadius: 0, mt: 1 }}>
              {historyError}
            </Alert>
          ) : historyDetail ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {historyDetail.payments.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    color: palette.muted,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  No transactions recorded yet for this member.
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 0 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <ProtoHeader>From Date</ProtoHeader>
                        <ProtoHeader>To Date</ProtoHeader>
                        <ProtoHeader align="right">Amount Paid</ProtoHeader>
                        <ProtoHeader align="right">Outstanding Amount</ProtoHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Payments are returned newest-first; walk oldest-first
                        // so the running outstanding ticks down correctly.
                        const ordered = [...historyDetail.payments].sort(
                          (a, b) => a.paid_on.localeCompare(b.paid_on)
                        );
                        let running = toNumber(historyDetail.bill.payable_amount);
                        return ordered.map((p) => {
                          running = Math.max(running - toNumber(p.amount), 0);
                          return (
                            <TableRow key={p.id}>
                              <TableCell sx={{ textAlign: "center" }}>
                                {formatDate(p.paid_on)}
                              </TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                {formatDate(p.paid_on)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontVariantNumeric: "tabular-nums",
                                  fontWeight: 700,
                                  color: PROTO.greenInk,
                                }}
                              >
                                {formatINR(p.amount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontVariantNumeric: "tabular-nums",
                                  fontWeight: 700,
                                  color:
                                    running > 0
                                      ? PROTO.redInk
                                      : PROTO.greenInk,
                                }}
                              >
                                {formatINR(running)}
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* "Amount need to be paid" footer (matches prototype) */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  background:
                    toNumber(historyDetail.bill.closing_balance) > 0
                      ? "#fff5f5"
                      : "#f1faf5",
                  border: `1px solid ${
                    toNumber(historyDetail.bill.closing_balance) > 0
                      ? "#f3c2c2"
                      : "#c3ead4"
                  }`,
                  borderRadius: 1,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: 13, color: palette.muted, fontWeight: 600 }}
                  >
                    Amount need to be paid
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#9aa3af" }}>
                    {historyDetail.bill.fiscal_year_label} · from main maintenance dashboard
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 800,
                    color:
                      toNumber(historyDetail.bill.closing_balance) > 0
                        ? PROTO.redInk
                        : PROTO.greenInk,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatINR(historyDetail.bill.closing_balance)}
                </Typography>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeHistory} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </DashboardShell>
  );
}

function ProtoHeader({
  children,
  align = "center",
  width,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: number;
}) {
  return (
    <TableCell
      align={align}
      sx={{
        fontSize: 12,
        fontWeight: 700,
        color: palette.ink,
        background: PROTO.headBg,
        borderBottom: `2px solid ${PROTO.headRule}`,
        width,
        py: 1.2,
      }}
    >
      {children}
    </TableCell>
  );
}
