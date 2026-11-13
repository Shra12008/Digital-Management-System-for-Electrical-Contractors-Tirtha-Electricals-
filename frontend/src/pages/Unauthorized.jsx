import React from "react";
import { NavLink } from "react-router-dom";

// Shown when a logged-in user's role doesn't allow the page they tried to
// reach (see Layout.jsx's canAccessRoute check) - previously this case
// just silently redirected to /dashboard with no explanation at all.
export default function Unauthorized() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
      <i className="fas fa-lock" style={{ fontSize: 40, color: "var(--danger, #ef4444)", marginBottom: 16 }}></i>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Access denied</h1>
      <p style={{ color: "#6b7280", marginBottom: 24, maxWidth: 420 }}>
        You don't have permission to view that page. If you think this is wrong, ask an admin to check your account's role.
      </p>
      <NavLink to="/dashboard" className="quick-action-btn" style={{ textDecoration: "none" }}>
        Back to Dashboard
      </NavLink>
    </div>
  );
}
