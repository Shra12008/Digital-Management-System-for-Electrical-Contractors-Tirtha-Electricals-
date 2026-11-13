import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Navbar({ title, subtitle, onQuickAction, onMenuClick }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close the dropdown on an outside click - standard expected behavior for
  // any notification bell, and cheap to implement with a single listener.
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleNotificationClick(n) {
    if (!n.read) markAsRead(n.id);
    setOpen(false);
    if (n.relatedEntityType === "ROLE_UPGRADE_REQUEST") {
      navigate("/role-requests");
    } else if (n.relatedEntityType === "PROJECT") {
      navigate("/projects");
    }
  }

  const recent = notifications.slice(0, 8);

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="header-right" style={{ position: "relative" }}>
        <button
          className="notification-btn"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="notification-panel" ref={panelRef}>
            <div className="notification-panel-header">
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <button className="notification-mark-all" onClick={markAllAsRead}>
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <p className="notification-panel-status">Loading...</p>
            ) : error ? (
              <p className="notification-panel-status" style={{ color: "#ef4444" }}>{error}</p>
            ) : recent.length === 0 ? (
              <div className="notification-panel-empty">
                <i className="fas fa-bell-slash"></i>
                <p>You're all caught up</p>
              </div>
            ) : (
              <div className="notification-panel-list">
                {recent.map((n) => (
                  <button
                    key={n.id}
                    className={`notification-item${n.read ? "" : " unread"}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="notification-item-title">{n.title}</div>
                    <div className="notification-item-message">{n.message}</div>
                    <div className="notification-item-time">{timeAgo(n.createdAt)}</div>
                  </button>
                ))}
              </div>
            )}

            <button className="notification-panel-viewall" onClick={() => { setOpen(false); navigate("/notifications"); }}>
              View all notifications
            </button>
          </div>
        )}

        <button
          className="quick-action-btn"
          onClick={
            onQuickAction ||
            (() =>
              alert(
                "Quick Action menu would open here. This is where you can add new projects, create invoices, or perform other quick tasks."
              ))
          }
        >
          <span className="btn-text">Quick Action</span>
        </button>
      </div>
    </header>
  );
}
