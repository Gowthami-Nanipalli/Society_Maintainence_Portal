import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { palette } from "../theme";
import { logout } from "../lib/auth";
import { roleLabel, type AuthUser } from "../lib/types";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
  onOpenMyPayments?: () => void;
  onOpenMyProfile?: () => void;
  onOpenRecordPayment?: () => void;
  onOpenAssignMaintenance?: () => void;
  onLogout?: () => void;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DashboardShell({
  user,
  children,
  onOpenMyPayments,
  onOpenMyProfile,
  onOpenRecordPayment,
  onOpenAssignMaintenance,
  onLogout,
}: Props) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const handleLogout = () => {
    closeMenu();
    if (onLogout) {
      onLogout();
      return;
    }
    logout();
    navigate("/login");
  };

  const isSecretary = user.role === "secretary";

  return (
    <Box sx={{ minHeight: "100vh", background: palette.cream }}>
      <AppBar
        position="static"
        color="default"
        sx={{ background: "#fff", borderBottom: `1px solid ${palette.border}` }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Logo variant="light" size={32} />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.ink }}>
                {user.name}
              </Typography>
            </Box>
            <IconButton
              onClick={openMenu}
              size="small"
              aria-label="Open profile menu"
              sx={{ p: 0.5 }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: palette.ink,
                  color: palette.gold,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  border: `2px solid ${palette.gold}`,
                }}
              >
                {initialsOf(user.name) || <PersonIcon fontSize="small" />}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={closeMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 220,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 0,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.ink }}>
                  {user.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: palette.muted, letterSpacing: "0.1em" }}>
                  {roleLabel(user.role).toUpperCase()}
                  {user.house || user.plot_no
                    ? ` · ${user.house || user.plot_no}`
                    : ""}
                </Typography>
              </Box>
              <Divider />
              {onOpenMyPayments && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    onOpenMyPayments();
                  }}
                >
                  <ListItemIcon>
                    <ReceiptLongIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
                    My Payments
                  </ListItemText>
                </MenuItem>
              )}
              {onOpenMyProfile && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    onOpenMyProfile();
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
                    My Profile
                  </ListItemText>
                </MenuItem>
              )}
              {onOpenRecordPayment && user.role === "treasurer" && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    onOpenRecordPayment();
                  }}
                >
                  <ListItemIcon>
                    <PaymentsOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
                    Record Payment
                  </ListItemText>
                </MenuItem>
              )}
              {onOpenAssignMaintenance && user.role === "treasurer" && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    onOpenAssignMaintenance();
                  }}
                >
                  <ListItemIcon>
                    <PostAddOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
                    Assign Maintenance
                  </ListItemText>
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
                  Log out
                </ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ background: "#fff", borderBottom: `1px solid ${palette.border}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1} sx={{ py: 1.5 }}>
            <SubNavLink
              to="/dashboard/maintenance"
              icon={<PaymentsOutlinedIcon sx={{ fontSize: 18 }} />}
            >
              Maintenance
            </SubNavLink>
            <SubNavLink
              to="/dashboard/expenditure"
              icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />}
            >
              Expenditure
            </SubNavLink>
            {isSecretary && (
              <SubNavLink
                to="/dashboard/approvals"
                icon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
              >
                Approvals
              </SubNavLink>
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
}

function SubNavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <Button
          startIcon={icon}
          sx={{
            color: isActive ? palette.ink : palette.muted,
            background: isActive ? palette.cream : "transparent",
            borderRadius: 0,
            borderBottom: `2px solid ${isActive ? palette.gold : "transparent"}`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: 12,
            fontWeight: 700,
            px: 2,
            py: 1,
            "&:hover": {
              background: palette.cream,
              color: palette.ink,
            },
          }}
        >
          {children}
        </Button>
      )}
    </NavLink>
  );
}
