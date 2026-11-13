import React, { useEffect, useMemo, useState } from "react";
import { usersApi } from "../services/api";

const ROLE_ICONS = {
  Admin: { icon: "fa-user-shield", bg: "bg-purple" },
  Accountant: { icon: "fa-user-tie", bg: "bg-blue" },
  "Site Engineer": { icon: "fa-hard-hat", bg: "bg-amber" },
  Supervisor: { icon: "fa-user-check", bg: "bg-green" },
  Client: { icon: "fa-user-clock", bg: "bg-cyan" },
};

const emptyForm = { name: "", email: "", role: "Admin", status: "Active", lastLogin: "" };

export default function Reports() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const data = await usersApi.getAll();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
  }, [users, search]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert("Please fill in name and email.");
      return;
    }
    await usersApi.create(form);
    await load();
    setForm(emptyForm);
    setShowModal(false);
  };

  return (
    <div className="users-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Reports & Users</p>
          <h2>System Reports and User Management</h2>
          <p className="section-description">
            Review high-level system reports and manage role-based user access.
          </p>
        </div>
        <button className="primary-btn user-add-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i>
          Add User
        </button>
      </div>

      <div className="billing-summary-grid users-summary-grid">
        {Object.keys(ROLE_ICONS).map((role) => (
          <div className="role-card" key={role}>
            <div className={`role-icon ${ROLE_ICONS[role].bg}`}>
              <i className={`fas ${ROLE_ICONS[role].icon}`}></i>
            </div>
            <span>{role}</span>
            <strong>{roleCounts[role] || 0}</strong>
          </div>
        ))}
      </div>

      <div className="system-users-panel">
        <div className="system-users-header">
          <div className="system-users-title">
            <div className="user-icon bg-blue">
              <i className="fas fa-users-cog"></i>
            </div>
            <div>
              <h3>System Users</h3>
              <p>Search users and manage access easily.</p>
            </div>
          </div>
          <label className="search-box user-search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <p style={{ padding: 16 }}>Loading users...</p>
        ) : (
          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td><span className={`status-pill ${(user.status || "active").toLowerCase()}`}>{user.status}</span></td>
                    <td>{user.lastLogin || "Never"}</td>
                    <td><button className="table-action">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          style={{ display: "flex" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="section-label">New User</p>
                <h3 className="modal-title">Add user details</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Name</label>
                  <input type="text" name="name" placeholder="Prakash Nair" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group full-width">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="prakash@gpm-dms.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    {Object.keys(ROLE_ICONS).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Last Login</label>
                  <input type="date" name="lastLogin" value={form.lastLogin} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
