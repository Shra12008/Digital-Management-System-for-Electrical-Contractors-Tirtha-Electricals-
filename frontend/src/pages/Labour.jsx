import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { labourApi, describeApiError } from "../services/api";

const emptyForm = {
  fullName: "",
  skill: "",
  phone: "",
  address: "",
  type: "Own",
  site: "",
  dailyWage: "",
  status: "Active",
};

export default function Labour() {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadLabours = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await labourApi.getAll();
      setLabours(data);
    } catch (err) {
      setError(describeApiError(err, "load workers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabours();
  }, []);

  const totalWorkers = labours.length;
  const activeSites = useMemo(
    () => new Set(labours.map((l) => l.site).filter(Boolean)).size,
    [labours]
  );
  const avgWage = totalWorkers
    ? Math.round(labours.reduce((sum, l) => sum + Number(l.dailyWage || 0), 0) / totalWorkers)
    : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      alert("Please fill at least the name and phone number.");
      return;
    }
    setSaving(true);
    try {
      await labourApi.create({ ...form, dailyWage: Number(form.dailyWage || 0) });
      await loadLabours();
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      alert("Failed to add worker. Please check the backend connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="labour-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Labour & HR</p>
          <h2>Manage site workers, daily wagers, and assignments.</h2>
          <p className="section-description">
            Track worker categories, daily wages, site assignments, and employment status from one clean panel.
          </p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          Add Worker
        </button>
      </div>

      <div className="billing-summary-grid labour-summary-grid">
        <Card label="Total Workers" value={totalWorkers} meta="Active labour and HR roster" />
        <Card label="Active Sites" value={activeSites} meta="Assigned electrical site teams" />
        <Card label="Average Wage" value={`₹${avgWage.toLocaleString()}`} meta="Daily average for active workers" />
        <Card label="Worker Type" value="Own / Contractor" meta="Managed in one place" />
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      <div className="workers-card">
        <div className="workers-header">
          <div>
            <h3>Worker List</h3>
            <p>View worker details organized by role, site, wage, and status.</p>
          </div>
        </div>
        {loading ? (
          <p style={{ padding: 16 }}>Loading workers...</p>
        ) : (
          <div className="table-scroll">
            <table className="workers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Current Site</th>
                  <th>Daily Wage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {labours.map((worker) => (
                  <tr key={worker.id}>
                    <td>{worker.fullName}</td>
                    <td>{worker.skill}</td>
                    <td>{worker.phone}</td>
                    <td>
                      <span className={`type-pill ${(worker.type || "own").toLowerCase()}`}>
                        {worker.type || "Own"}
                      </span>
                    </td>
                    <td>{worker.site || "—"}</td>
                    <td>₹{Number(worker.dailyWage || 0).toLocaleString()}</td>
                    <td>
                      <span className={`status-pill ${(worker.status || "active").toLowerCase()}`}>
                        {worker.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="labour-note">Use Add Worker to include new labour or HR team members instantly.</p>
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
                <p className="section-label">New Worker</p>
                <h3 className="modal-title">Add worker details</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="fullName" placeholder="Suresh Yadav" value={form.fullName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" name="skill" placeholder="Electrician" value={form.skill} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" placeholder="9876543210" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Own">Own</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Site</label>
                  <input
                    type="text"
                    name="site"
                    placeholder="Mumbai Airport Terminal 3 Electrical"
                    value={form.site}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Daily Wage</label>
                  <input type="number" name="dailyWage" placeholder="850" value={form.dailyWage} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" name="address" placeholder="City, State" value={form.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Adding..." : "Add Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
