import React, { useEffect, useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { authApi } from "../services/api";
import { canAccessRoute } from "../config/roles";
import { applyAppearance, clearAppearance, settingsStore } from "../utils/preferences";
import { syncCompany, syncProfile } from "../utils/serverSync";

const PAGE_META = {
  "/dashboard": { title: "Dashboard", subtitle: "Manage your electrical contracting operations." },
  "/projects": { title: "Projects", subtitle: "Manage ongoing and upcoming electrical contracting projects." },
  "/invoice": { title: "Billing & Invoicing", subtitle: "Manage invoices, check payment status, and send billing updates." },
  "/accounts": { title: "Accounts & Finance", subtitle: "Monitor financial performance, manage ledgers, and track profitability." },
  "/inventory": { title: "Inventory", subtitle: "Manage stock levels, materials, and issue logs to sites." },
  "/labour": { title: "Labour & HR", subtitle: "Manage site workers, daily wagers, and assignments." },
  "/daily-work": { title: "Daily Work", subtitle: "Site activity logs, BOQ quantities executed daily." },
  "/reports": { title: "Reports & Users", subtitle: "System reports and user access management." },
  "/admin/users": { title: "User Management", subtitle: "View every registered user and change their role." },
  "/role-requests": { title: "Role Upgrade Request", subtitle: "Request a role change, or review requests waiting on you." },
  "/settings": { title: "Settings", subtitle: "Manage your profile, appearance and billing preferences." },
  "/notifications": { title: "Notifications", subtitle: "Everything the system has sent you." },
};

export default function Layout() {
  const location = useLocation();
  const user = authApi.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const settings = settingsStore.use();

  // Theme / density live on <html>; only applied inside the ERP so the public
  // marketing site always keeps its own look.
  useEffect(() => {
    applyAppearance(settings);
    if (settings.theme !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyAppearance(settings);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings]);
  useEffect(() => clearAppearance, []);

  // Load the user's saved profile (photo, designation...) and the company
  // billing details from the backend into the local caches the UI reads.
  // Failures are silent: the cached copy keeps working if the server is slow.
  useEffect(() => {
    const u = authApi.getCurrentUser();
    if (!u) return;
    syncProfile(u).catch(() => {});
    syncCompany(u).catch(() => {});
  }, []);

  // Close the mobile drawer automatically whenever the page changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Test 7 (Direct URL access): a role manually entering a page it
  // shouldn't see gets a real "Access denied" page, not a silent
  // redirect to /dashboard (a blank/black-screen-feeling bounce). The
  // backend enforces the real security (see SecurityConfig.java) - this
  // is UX only.
  if (!canAccessRoute(user.role, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const meta = PAGE_META[location.pathname] || { title: "Dashboard", subtitle: "" };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}
