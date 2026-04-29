import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Licences from "./pages/Licences.jsx";
import Runtime from "./pages/Runtime.jsx";
import Payments from "./pages/Payments.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import Applications from "./pages/Applications.jsx";
import LandingLayout from "./layouts/LandingLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Pricing from "./pages/Pricing.jsx";
import Support from "./pages/Support.jsx";
import Settings from "./pages/Settings.jsx";
import Webhooks from "./pages/Webhooks.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Sdk from "./pages/Sdk.jsx";
import UserManagement from "./pages/UserManagement.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/support" element={<Support />} />
      </Route>
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/licences" element={<Licences />} />
        <Route path="/runtime" element={<Runtime />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/webhooks" element={<Webhooks />} />
        <Route path="/sdk" element={<Sdk />} />
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth role="admin"><UserManagement /></RequireAuth>} />
      </Route>
    </Routes>
  );
}
