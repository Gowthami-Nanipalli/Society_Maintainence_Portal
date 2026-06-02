import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { palette } from "../theme";
import { getCurrentUser, logout } from "../lib/auth";
import {
  addExpense,
  deleteExpense,
  fetchExpenseCategories,
  fetchExpenseTotals,
  fetchExpenses,
} from "../lib/expenseApi";
import { fetchLedger } from "../lib/maintenance";
import type { Expense, ExpenseTotals } from "../lib/types";
import { formatDate, formatINR, todayISO, toNumber } from "../lib/format";

export default function ExpenditureDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<ExpenseTotals | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [collected, setCollected] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    category: "",
    description: "",
    amount: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isTreasurer = user?.role === "treasurer";

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [items, t, cats, ledger] = await Promise.all([
        fetchExpenses(),
        fetchExpenseTotals(),
        fetchExpenseCategories(),
        fetchLedger().catch(() => null),
      ]);
      setExpenses(items);
      setTotals(t);
      setCategories(cats);
      if (ledger) {
        setCollected(toNumber(ledger.totals.total_received));
      }
      setForm((f) => ({ ...f, category: f.category || cats[0] || "" }));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Expenditure · CardMaster Enclave";
  }, []);

  // Mount-only fetch. See MaintenanceDashboard for why `user` cannot be a dep.
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const total = useMemo(() => toNumber(totals?.total ?? null), [totals]);
  const net = collected - total;

  const byCategory = useMemo<[string, number][]>(() => {
    const spent: Record<string, number> = {};
    if (totals) {
      for (const [cat, val] of Object.entries(totals.by_category)) {
        spent[cat] = toNumber(val);
      }
    }
    const known = new Set(categories);
    const merged: [string, number][] = categories.map((c) => [c, spent[c] ?? 0]);
    for (const [cat, val] of Object.entries(spent)) {
      if (!known.has(cat)) merged.push([cat, val]);
    }
    return merged.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [totals, categories]);

  const resetForm = () => {
    setForm({
      date: todayISO(),
      category: categories[0] ?? "",
      description: "",
      amount: "",
    });
    setFormError(null);
  };

  const openExpenseDialog = () => {
    resetForm();
    setOpenForm(true);
  };

  const closeExpenseDialog = () => {
    if (saving) return;
    setOpenForm(false);
    setFormError(null);
  };

  const submitExpense = async () => {
    const amount = Number(form.amount);
    const category = form.category.trim();
    const description = form.description.trim();
    if (!form.date) return setFormError("Please pick a date.");
    if (!category) return setFormError("Category is required.");
    if (!description) return setFormError("Description is required.");
    if (!Number.isFinite(amount) || amount <= 0)
      return setFormError("Enter a valid amount greater than zero.");
    setSaving(true);
    try {
      await addExpense({ spent_on: form.date, category, description, amount });
      await reload();
      setOpenForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id: number) => {
    try {
      await deleteExpense(id);
      await reload();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not delete expense.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: palette.gold,
            letterSpacing: "0.32em",
          }}
        >
          EXPENDITURE DASHBOARD
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>
          Society Expenditure
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: 14 }}>
          Money spent on upkeep, services and shared facilities.
        </Typography>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{loadError}</Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <StatTile
          label="Total Expenditure"
          value={formatINR(total)}
          sub={`${expenses.length} entries`}
          accent="#c62828"
        />
        <StatTile
          label="Maintenance Received (FY)"
          value={formatINR(collected)}
          sub="Sum of FY payments"
          accent="#2e7d32"
        />
        <StatTile
          label="Net Balance"
          value={formatINR(net)}
          sub="Received − spent"
          accent={palette.gold}
        />
      </Stack>

      <Paper
        elevation={0}
        sx={{ border: `1px solid ${palette.border}`, mb: 3, overflow: "hidden" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${palette.border}`,
            background: palette.cream,
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 600 }}>
              Expenditure Ledger
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.muted }}>
              Every expense recorded by the Treasurer.
            </Typography>
          </Box>
          {isTreasurer ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={openExpenseDialog}
              sx={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: 12 }}
            >
              Add Expense
            </Button>
          ) : (
            <Typography sx={{ fontSize: 12, color: palette.muted, fontStyle: "italic" }}>
              Read-only view
            </Typography>
          )}
        </Box>

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <HeaderCell>Date</HeaderCell>
                <HeaderCell>Category</HeaderCell>
                <HeaderCell>Description</HeaderCell>
                <HeaderCell>Recorded by</HeaderCell>
                <HeaderCell align="right">Amount</HeaderCell>
                {isTreasurer && <HeaderCell align="right">Action</HeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={isTreasurer ? 6 : 5}
                    sx={{ textAlign: "center", py: 5 }}
                  >
                    <CircularProgress size={24} sx={{ color: palette.gold }} />
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isTreasurer ? 6 : 5}
                    sx={{ textAlign: "center", py: 5, color: palette.muted }}
                  >
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ color: palette.muted }}>{formatDate(e.spent_on)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{e.category}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell sx={{ color: palette.muted, fontSize: 13 }}>
                      {e.created_by_name || "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatINR(e.amount)}
                    </TableCell>
                    {isTreasurer && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="Delete expense"
                          onClick={() => removeExpense(e.id)}
                          sx={{ color: palette.muted }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {expenses.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 6,
              px: 3,
              py: 2,
              borderTop: `2px solid ${palette.border}`,
              background: "#fff",
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: palette.muted }}>
              TOTAL
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: palette.ink }}>
              {formatINR(total)}
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${palette.border}`, p: 3 }}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 600 }}>
          Spend by Category
        </Typography>
        <Typography sx={{ fontSize: 12, color: palette.muted, mb: 2 }}>
          Share of total expenditure across categories.
        </Typography>
        {byCategory.length === 0 ? (
          <Typography sx={{ color: palette.muted, fontSize: 13 }}>
            No expenses yet — add one to see breakdowns.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {byCategory.map(([cat, value]) => {
              const pct = total > 0 ? (value / total) * 100 : 0;
              return (
                <Stack key={cat} direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 130, fontSize: 13, fontWeight: 600 }}>{cat}</Box>
                  <Box
                    sx={{
                      flex: 1,
                      height: 12,
                      background: palette.cream,
                      borderRadius: 0,
                      overflow: "hidden",
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct.toFixed(0)}%`,
                        background: palette.gold,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: 110,
                      textAlign: "right",
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatINR(value)}
                  </Box>
                  <Box
                    sx={{
                      width: 50,
                      textAlign: "right",
                      fontSize: 12,
                      color: palette.muted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {pct.toFixed(0)}%
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Dialog open={openForm} onClose={closeExpenseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif', fontSize: 18 }}>
          Add Expense
          <Typography sx={{ fontSize: 13, color: palette.muted, mt: 0.5 }}>
            Record society expenditure (Treasurer only).
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              placeholder="What was it for?"
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label="Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              fullWidth
              inputProps={{ min: 1, step: 100 }}
            />
            {formError && (
              <Alert severity="error" sx={{ borderRadius: 0 }}>{formError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeExpenseDialog} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={submitExpense}
            disabled={saving}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {saving ? "Saving…" : "Save Expense"}
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
        background: palette.cream,
      }}
    >
      {children}
    </TableCell>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
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
      {sub && (
        <Typography sx={{ fontSize: 12, color: palette.muted, mt: 0.5 }}>{sub}</Typography>
      )}
    </Paper>
  );
}
