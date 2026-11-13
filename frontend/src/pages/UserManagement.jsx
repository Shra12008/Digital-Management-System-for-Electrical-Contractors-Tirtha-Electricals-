import React, { useEffect, useState } from "react";
import { userManagementApi, authApi, describeApiError } from "../services/api";

const ALL_ROLES = ["ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR", "ACCOUNTANT", "CLIENT"];

const ROLE_COLORS = {
  ADMIN: "#a855f7",
  PROJECT_MANAGER: "#3b82f6",
  LABOUR_MANAGER: "#22c55e",
  LABOUR: "#f59e0b",
  ACCOUNTANT: "#06b6d4",
  CLIENT: "#94a3b8",
};

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || "#9ca3af";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}22`,
        border: `1px solid ${color}55`,
      }}
    >
      {role}
    </span>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRoles, setPendingRoles] = useState({}); // { [userId]: selectedRole }
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"error", message }

  const currentUserId = authApi.getCurrentUser()?.userId;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userManagementApi.getAll();
      setUsers(data);
    } catch (err) {
      setError(describeApiError(err, "load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleSelect = (userId, role) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSave = async (user) => {
    const newRole = pendingRoles[user.id];
    if (!newRole || newRole === user.role) return;

    const confirmed = window.confirm(
      `Change ${user.fullName}'s role from ${user.role} to ${newRole}?`
    );
    if (!confirmed) return;

    setSavingId(user.id);
    setFeedback(null);
    try {
      await userManagementApi.updateRole(user.id, newRole);
      setFeedback({ type: "success", message: `${user.fullName}'s role is now ${newRole}.` });
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      await load(); // refresh the list from the backend, per spec
    } catch (err) {
      setFeedback({ type: "error", message: describeApiError(err, "update this user's role") });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="projects-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Admin</p>
          <h2>User Management</h2>
          <p className="section-description">
            View every registered user and change their role. Only ADMIN can see or use this page.
          </p>
        </div>
      </div>

      {feedback && (
        <p
          style={{
            color: feedback.type === "success" ? "#22c55e" : "#ef4444",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {feedback.message}
        </p>
      )}
      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      <div className="projects-container">
        {loading ? (
          <p style={{ padding: 16 }}>Loading users...</p>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <h3>No users found</h3>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Current Role</th>
                  <th>Change Role To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const pending = pendingRoles[user.id] ?? user.role;
                  const hasChange = pending !== user.role;
                  // Mirrors the backend's own self-demotion guard - disabled here too so
                  // it's obvious in the UI rather than only failing after clicking Save.
                  const lockedForSelfDemotion = isSelf && user.role === "ADMIN";

                  return (
                    <tr key={user.id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td>
                        <select
                          value={pending}
                          disabled={lockedForSelfDemotion || savingId === user.id}
                          onChange={(e) => handleRoleSelect(user.id, e.target.value)}
                          title={lockedForSelfDemotion ? "You can't change your own role." : undefined}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="primary-btn"
                          disabled={!hasChange || lockedForSelfDemotion || savingId === user.id}
                          onClick={() => handleSave(user)}
                        >
                          {savingId === user.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
