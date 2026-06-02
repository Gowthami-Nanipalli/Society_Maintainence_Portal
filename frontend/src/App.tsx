import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import ExpenditureDashboard from "./pages/ExpenditureDashboard";
import Approvals from "./pages/Approvals";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/maintenance" replace />} />
      <Route path="/dashboard/maintenance" element={<MaintenanceDashboard />} />
      <Route path="/dashboard/expenditure" element={<ExpenditureDashboard />} />
      <Route path="/dashboard/approvals" element={<Approvals />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
