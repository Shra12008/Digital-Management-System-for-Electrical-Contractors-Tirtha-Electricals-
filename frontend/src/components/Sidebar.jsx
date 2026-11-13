import React, { useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { authApi } from "../services/api";
import { ROUTE_ROLES, roleLabel } from "../config/roles";
import { useAuth } from "../context/AuthContext";
import { profileStoreFor } from "../utils/preferences";
import Avatar from "./Avatar";
import ProfileMenu from "./ProfileMenu";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "fa-table-columns", label: "Dashboard" },
  { to: "/projects", icon: "fa-briefcase", label: "Projects" },
  { to: "/invoice", icon: "fa-file-invoice", label: "Billing & Invoicing" },
  { to: "/accounts", icon: "fa-wallet", label: "Accounts & Finance" },
  { to: "/inventory", icon: "fa-box", label: "Inventory" },
  { to: "/labour", icon: "fa-users", label: "Labour & HR" },
  { to: "/daily-work", icon: "fa-clipboard-list", label: "Daily Work" },
  { to: "/reports", icon: "fa-gear", label: "Reports & Users" },
  { to: "/admin/users", icon: "fa-user-shield", label: "User Management" },
  { to: "/role-requests", icon: "fa-user-pen", label: "Role Upgrade Request" },
];

const COLLAPSED_STORAGE_KEY = "sidebarCollapsed";

// `isOpen`/`onClose` only matter on small screens (they control the
// off-canvas drawer via CSS in style.css). The desktop collapse/expand
// toggle below is a separate, independent piece of state - see the
// min-width media query in style.css that keeps the two from fighting
// each other.
export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const user = authApi.getCurrentUser();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true"
  );
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const profile = profileStoreFor(user).use();
  const displayName = profile.displayName || user?.name || "Admin User";

  const visibleItems = NAV_ITEMS.filter((item) => {
    const allowed = ROUTE_ROLES[item.to];
    return !allowed || allowed.includes(user?.role);
  });

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <>
      <aside className={"sidebar" + (isOpen ? " mobile-open" : "") + (collapsed ? " collapsed" : "")}>
        <div className="logo-container">
          <div className="logo">
            <img src={logo} alt="logo" className="logo-icon" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div className="logo-text">
            <div className="logo-title">Tirth Electrical & Services</div>
            <div className="logo-subtitle">Jalgaon</div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <i className="fas fa-xmark"></i>
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>

        <nav className="nav-menu">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              title={item.label}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-profile">
          <button
            ref={triggerRef}
            className={"user-profile-trigger" + (menuOpen ? " open" : "")}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Account menu"
          >
            <Avatar name={displayName} src={profile.avatar} size={40} />
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-email">{roleLabel(user?.role)}</div>
            </div>
            <i className="fas fa-chevron-up user-caret"></i>
          </button>
          <button
            className={"settings-btn" + (location.pathname === "/settings" ? " active" : "")}
            title="Settings"
            aria-label="Open settings"
            onClick={() => {
              setMenuOpen(false);
              onClose();
              navigate("/settings");
            }}
          >
            <i className="fas fa-gear"></i>
          </button>
        </div>

        <ProfileMenu
          anchorRef={triggerRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={user}
          profile={profile}
          displayName={displayName}
          onLogout={handleLogout}
        />
      </aside>

      {/* Dims the page behind the drawer on mobile; invisible/inactive on desktop */}
      <div
        className={"sidebar-overlay" + (isOpen ? " active" : "")}
        onClick={onClose}
        aria-hidden="true"
      ></div>
    </>
  );
}
