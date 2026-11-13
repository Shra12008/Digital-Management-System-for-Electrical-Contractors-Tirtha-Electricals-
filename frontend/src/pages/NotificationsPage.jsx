import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const TYPE_ICON = {
  ROLE_REQUEST_SUBMITTED: "fa-user-pen",
  ROLE_REQUEST_APPROVED: "fa-circle-check",
  ROLE_REQUEST_REJECTED: "fa-circle-xmark",
  PROJECT_ASSIGNED: "fa-briefcase",
  SYSTEM_NOTIFICATION: "fa-gear",
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications();

  function handleClick(n) {
    if (!n.read) markAsRead(n.id);
    if (n.relatedEntityType === "ROLE_UPGRADE_REQUEST") {
      navigate("/role-requests");
    } else if (n.relatedEntityType === "PROJECT") {
      navigate("/projects");
    }
  }

  return (
    <div className="projects-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">NOTIFICATIONS</p>
          <h2>All Notifications</h2>
          <p className="section-description">Everything the system has sent you, most recent first.</p>
        </div>
        {unreadCount > 0 && (
          <button className="primary-btn" onClick={markAllAsRead}>Mark all as read</button>
        )}
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      <div className="projects-container">
        {loading ? (
          <p style={{ padding: 16 }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <h3>No notifications yet</h3>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, width: "100%", textAlign: "left",
                  background: n.read ? "transparent" : "rgba(255,255,255,0.03)",
                  borderLeft: n.read ? "2px solid transparent" : "2px solid var(--accent)",
                  border: "none", borderBottom: "1px solid var(--border-color-soft)",
                  padding: "16px", cursor: "pointer",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "var(--bg-surface-2)", border: "1px solid var(--border-color)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
                }}>
                  <i className={`fas ${TYPE_ICON[n.type] || "fa-bell"}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.read ? 500 : 700, color: "var(--text-primary)", marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 6 }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{formatDate(n.createdAt)}</div>
                </div>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 6, flexShrink: 0 }}></span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
