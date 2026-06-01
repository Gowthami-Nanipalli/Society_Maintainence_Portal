import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Navigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { palette } from "../theme";
import {
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  expensesByCategory,
  getExpenses,
  totalExpenses,
  type Expense,
} from "../lib/expenses";
import { getCurrentUser } from "../lib/session";
import { getAccounts } from "../lib/accounts";

const TREASURER_ROLE = "Treasurer";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
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

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ExpenditureDashboard() {
  const user = getCurrentUser();
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    category: EXPENSE_CATEGORIES[0],
    description: "",
    amount: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Expenditure · CardMaster Enclave";
  }, []);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses]
  );

  const total = useMemo(() => totalExpenses(expenses), [expenses]);

  const byCategory = useMemo(() => {
    const map = expensesByCategory(expenses);
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const collected = useMemo(() => {
    return getAccounts().reduce((s, a) => s + a.lastPaidAmount, 0);
  }, []);
  const net = collected - total;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isTreasurer = user.role === TREASURER_ROLE;

  const resetForm = () => {
    setForm({
      date: todayISO(),
      category: EXPENSE_CATEGORIES[0],
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
    setOpenForm(false);
    setFormError(null);
  };

  const submitExpense = () => {
    const amount = Number(form.amount);
    const category = form.category.trim();
    const description = form.description.trim();
    if (!form.date) {
      setFormError("Please pick a date.");
      return;
    }
    if (!category) {
      setFormError("Category is required.");
      return;
    }
    if (!description) {
      setFormError("Description is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a valid amount greater than zero.");
      return;
    }
    addExpense({ date: form.date, category, description, amount });
    setExpenses(getExpenses());
    closeExpenseDialog();
  };

  const removeExpense = (id: number) => {
    deleteExpense(id);
    setExpenses(getExpenses());
  };

  return (
    <DashboardShell user={user}>
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <StatTile
          label="Total Expenditure"
          value={formatINR(total)}
          sub={`${expenses.length} entries`}
          accent="#c62828"
        />
        <StatTile
          label="Maintenance Collected"
          value={formatINR(collected)}
          sub="Sum of last payments"
          accent="#2e7d32"
        />
        <StatTile
          label="Net Balance"
          value={formatINR(net)}
          sub="Collected − spent"
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
                <HeaderCell align="right">Amount</HeaderCell>
                {isTreasurer && <HeaderCell align="right">Action</HeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isTreasurer ? 5 : 4}
                    sx={{ textAlign: "center", py: 5, color: palette.muted }}
                  >
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedExpenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ color: palette.muted }}>{formatDate(e.date)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{e.category}</TableCell>
                    <TableCell>{e.description}</TableCell>
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
        {sortedExpenses.length > 0 && (
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
              {EXPENSE_CATEGORIES.map((c) => (
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
              <Alert severity="error" sx={{ borderRadius: 0 }}>
                {formError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeExpenseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={submitExpense}
            sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Save Expense
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
