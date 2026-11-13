import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { dailyWorkApi, projectsApi, labourApi, describeApiError } from "../services/api";

const emptyForm = {
  taskName: "",
  description: "",
  workDate: "",
  projectId: "",
  labourId: "",
  status: "Pending",
};

export default function DailyWork() {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    // Promise.allSettled, same reasoning as Dashboard.jsx: the logs
    // themselves (dailyWorkApi) should still load and display even if,
    // for this role, the projects/labours dropdown data came back denied.
    const [logResult, projectResult, labourResult] = await Promise.allSettled([
      dailyWorkApi.getAll(),
      projectsApi.getAll(),
      labourApi.getAll(),
    ]);

    if (logResult.status === "fulfilled") setLogs(logResult.value);
    if (projectResult.status === "fulfilled") setProjects(projectResult.value);
    if (labourResult.status === "fulfilled") setLabours(labourResult.value);

    // The logs themselves are the core of this page - if THAT call failed,
    // it's a real error worth showing. A denied dropdown source alone
    // isn't (the form will just have a shorter list to pick from).
    if (logResult.status === "rejected") {
      setError(describeApiError(logResult.reason, "load daily work logs"));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const approvedCount = logs.filter((l) => l.status === "Approved").length;
  const pendingCount = logs.filter((l) => l.status === "Pending").length;
  const siteCount = useMemo(
    () => new Set(logs.map((l) => l.projectId).filter(Boolean)).size,
    [logs]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.taskName || !form.description || !form.workDate) {
      alert("Please fill in task name, description and date.");
      return;
    }
    setSaving(true);
    try {
      await dailyWorkApi.create({
        ...form,
        projectId: form.projectId ? Number(form.projectId) : null,
        labourId: form.labourId ? Number(form.labourId) : null,
      });
      await loadAll();
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      alert("Failed to submit report. Please check the backend connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dailywork-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Daily Work</p>
          <h2>Daily Progress Report (DPR)</h2>
          <p className="section-description">Site activity logs, BOQ quantities executed daily.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          Log Work
        </button>
      </div>

      <div className="billing-summary-grid dailywork-summary-grid">
        <Card label="Log Entries" value={logs.length} meta="Recent daily work reports" />
        <Card label="Current Sites" value={siteCount} meta="Active progress locations" />
        <Card label="Approved Reports" value={approvedCount} meta="Verified progress updates" />
        <Card label="Pending Review" value={pendingCount} meta="Awaiting supervisor approval" />
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      <div className="dpr-card">
        <div className="workers-header">
          <div>
            <h3>Daily Progress Report</h3>
            <p>Review daily logs, executed quantities, supervisors, and status updates.</p>
          </div>
        </div>
        {loading ? (
          <p style={{ padding: 16 }}>Loading logs...</p>
        ) : (
          <div className="table-scroll">
            <table className="workers-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Task</th>
                  <th>Work Executed</th>
                  <th>Labour</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.workDate}</td>
                    <td>{log.projectName || "—"}</td>
                    <td>{log.taskName}</td>
                    <td>{log.description}</td>
                    <td>{log.labourName || "—"}</td>
                    <td>
                      <span className={`status-pill ${(log.status || "pending").toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
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
                <p className="section-label">Submit Daily Work Log</p>
                <h3 className="modal-title">Submit Daily Work Log</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Project</label>
                  <select name="projectId" value={form.projectId} onChange={handleChange}>
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Task Name</label>
                  <input
                    type="text"
                    name="taskName"
                    placeholder="e.g., HT cable laying"
                    value={form.taskName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Work Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe the work executed today"
                    value={form.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="workDate" value={form.workDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Labour</label>
                  <select name="labourId" value={form.labourId} onChange={handleChange}>
                    <option value="">Select worker</option>
                    {labours.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
