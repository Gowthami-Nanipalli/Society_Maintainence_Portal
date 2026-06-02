import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { palette } from "../theme";
import { getCurrentUser, logout } from "../lib/auth";
import { decideApproval, listMembers, listPendingMembers } from "../lib/members";
import type { AuthUser } from "../lib/types";
import { roleLabel } from "../lib/types";
import { formatDate } from "../lib/format";

export default function Approvals() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [pending, setPending] = useState<AuthUser[]>([]);
  const [members, setMembers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRows, allRows] = await Promise.all([
        listPendingMembers(),
        listMembers(),
      ]);
      setPending(pendingRows);
      setMembers(allRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Approvals · CardMaster Enclave";
  }, []);

  // Mount-only fetch. Depending on `user` here would loop because
  // getCurrentUser() returns a fresh object every render.
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "secretary") return <Navigate to="/dashboard/maintenance" replace />;

  const decide = async (memberId: number, approve: boolean) => {
    setDeciding(memberId);
    setError(null);
    try {
      await decideApproval(memberId, approve);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update approval.");
    } finally {
      setDeciding(null);
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
          MEMBER APPROVALS
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>
          Pending Resident Signups
        </Typography>
        <Typography sx={{ color: palette.muted, fontSize: 14 }}>
          As Secretary, you approve or reject new resident accounts before they can sign in.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{error}</Alert>
      )}

      <Paper
        elevation={0}
        sx={{ border: `1px solid ${palette.border}`, overflow: "hidden", mb: 4 }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${palette.border}`,
            background: palette.cream,
          }}
        >
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 600 }}>
            Pending signups
          </Typography>
          <Typography sx={{ fontSize: 12, color: palette.muted }}>
            Accounts that have not yet been approved.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Mobile</HeaderCell>
                <HeaderCell>House</HeaderCell>
                <HeaderCell>Plot</HeaderCell>
                <HeaderCell>Requested</HeaderCell>
                <HeaderCell align="right">Action</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 5 }}>
                    <CircularProgress size={24} sx={{ color: palette.gold }} />
                  </TableCell>
                </TableRow>
              ) : pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 5, color: palette.muted }}>
                    No pending approvals.
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{m.name}</TableCell>
                    <TableCell sx={{ color: palette.muted }}>{m.email}</TableCell>
                    <TableCell sx={{ color: palette.muted }}>{m.mobile}</TableCell>
                    <TableCell>{m.house || "—"}</TableCell>
                    <TableCell>{m.plot_no || "—"}</TableCell>
                    <TableCell sx={{ color: palette.muted }}>{formatDate(m.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          disabled={deciding === m.id}
                          onClick={() => decide(m.id, true)}
                          sx={{
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            fontSize: 11,
                            py: 0.6,
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                          disabled={deciding === m.id}
                          onClick={() => decide(m.id, false)}
                          sx={{
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            fontSize: 11,
                            py: 0.6,
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${palette.border}`, overflow: "hidden" }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${palette.border}`,
            background: palette.cream,
          }}
        >
          <Typography sx={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 600 }}>
            All accounts
          </Typography>
          <Typography sx={{ fontSize: 12, color: palette.muted }}>
            Roster of every account in PostgreSQL.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Role</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Joined</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress size={20} sx={{ color: palette.gold }} />
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{m.name}</TableCell>
                    <TableCell sx={{ color: palette.muted }}>{m.email}</TableCell>
                    <TableCell>{roleLabel(m.role)}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.status}
                        size="small"
                        sx={{
                          textTransform: "capitalize",
                          fontWeight: 700,
                          fontSize: 11,
                          borderRadius: 0,
                          background:
                            m.status === "active"
                              ? "#e6f4ea"
                              : m.status === "pending"
                              ? "#fff4e5"
                              : "#fdecea",
                          color:
                            m.status === "active"
                              ? "#2e7d32"
                              : m.status === "pending"
                              ? "#a15c00"
                              : "#c62828",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: palette.muted }}>
                      {formatDate(m.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
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
