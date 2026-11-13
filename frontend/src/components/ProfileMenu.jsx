import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { roleLabel } from "../config/roles";
import { useNotifications } from "../context/NotificationContext";
import { settingsStore } from "../utils/preferences";
import Avatar from "./Avatar";
import pkg from "../../package.json";

/**
 * Popover opened from the avatar at the bottom of the sidebar. Rendered in a
 * portal so the sidebar's overflow / collapsed width can never clip it.
 */
export default function ProfileMenu({ anchorRef, open, onClose, user, profile, displayName, onLogout }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { unreadCount } = useNotifications();
  const settings = settingsStore.use();
  const [pos, setPos] = useState({ left: 12, bottom: 12 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const collapsed = r.width < 120;
    setPos({
      left: collapsed ? r.right + 10 : Math.max(r.left, 10),
      bottom: Math.max(window.innerHeight - r.bottom, 10),
    });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return createPortal(
    <div className="profile-menu" role="menu" aria-label="Account menu" ref={menuRef} style={{ left: pos.left, bottom: pos.bottom }}>
      <div className="profile-menu-head">
        <Avatar name={displayName} src={profile.avatar} size={52} />
        <div className="profile-menu-id">
          <strong>{displayName}</strong>
          <span>{user?.email || "No email on file"}</span>
          <em className="role-badge">{roleLabel(user?.role)}</em>
        </div>
      </div>

      <div className="profile-menu-list">
        <button role="menuitem" onClick={() => go("/settings?tab=profile")}>
          <i className="fas fa-user"></i> My profile
        </button>
        <button role="menuitem" onClick={() => go("/settings")}>
          <i className="fas fa-gear"></i> Settings
        </button>
        <button role="menuitem" onClick={() => go("/notifications")}>
          <i className="fas fa-bell"></i> Notifications
          {unreadCount > 0 && <span className="menu-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        <div className="profile-menu-theme" role="group" aria-label="Theme">
          <span><i className="fas fa-circle-half-stroke"></i> Theme</span>
          <div className="mini-seg">
            {["dark", "light"].map((t) => (
              <button key={t} className={settings.theme === t ? "active" : ""} onClick={() => settingsStore.set({ theme: t })}>
                {t === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-menu-foot">
        <button role="menuitem" className="logout" onClick={onLogout}>
          <i className="fas fa-right-from-bracket"></i> Log out
        </button>
        <small>Tirth ERP v{pkg.version}</small>
      </div>
    </div>,
    document.body
  );
}
