import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Labour from "./pages/Labour";
import DailyWork from "./pages/DailyWork";
import Accounts from "./pages/Accounts";
import Invoice from "./pages/Invoice";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/UserManagement";
import RoleRequests from "./pages/RoleRequests";
import NotificationsPage from "./pages/NotificationsPage";
import Settings from "./pages/Settings";

// Public site (moved in from the landing project)
import PublicNavbar from "./components/PublicNavbar";
import PublicFooter from "./components/PublicFooter";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Wraps the public marketing/auth pages so styles/public.css (scoped to
// .public-site) applies only here and never touches the ERP dashboard.
function PublicSite({ children }) {
  return (
    <div className="public-site">
      <PublicNavbar />
      {children}
      <PublicFooter />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite><Home /></PublicSite>} />
      <Route path="/about" element={<PublicSite><About /></PublicSite>} />
      <Route path="/services" element={<PublicSite><Services /></PublicSite>} />
      <Route path="/contact" element={<PublicSite><Contact /></PublicSite>} />
      <Route path="/login" element={<PublicSite><Login /></PublicSite>} />
      <Route path="/signup" element={<PublicSite><Signup /></PublicSite>} />

      {/* Layout already redirects to /login when there's no logged-in
          user (see components/Layout.jsx), so every route nested here
          is effectively a protected ERP route. */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/labour" element={<Labour />} />
        <Route path="/daily-work" element={<DailyWork />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/role-requests" element={<RoleRequests />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
