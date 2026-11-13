import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { projectsApi, authApi, describeApiError } from "../services/api";

const emptyForm = {
  projectName: "",
  clientName: "",
  location: "",
  budget: "",
  startDate: "",
  managerId: "",
  labourManagerId: "",
  status: "Planning",
};

export default function Projects() {
  // Who may assign what is enforced server-side (ProjectServiceImpl.authorizeAssignments);
  // these flags only make the form reflect that up front instead of failing on save.
  const currentUser = authApi.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const myId = currentUser?.userId;

  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [labourManagers, setLabourManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = creating, else the project being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, managerData, labourManagerData] = await Promise.all([
        projectsApi.getAll(),
        projectsApi.getManagers(),
        projectsApi.getLabourManagers(),
      ]);
      setProjects(projectData);
      setManagers(managerData);
      setLabourManagers(labourManagerData);
    } catch (err) {
      setError(describeApiError(err, "load projects"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.projectName?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.managerName?.toLowerCase().includes(q) ||
        p.labourManagerName?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const plannedProjects = projects.filter((p) => p.status === "Planning").length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingProject(null);
    // A PROJECT_MANAGER creating a project leads it themselves (only an
    // ADMIN can assign someone else), so preselect them.
    setForm({ ...emptyForm, managerId: !isAdmin && myId ? String(myId) : "" });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setForm({
      projectName: project.projectName || "",
      clientName: project.clientName || "",
      location: project.location || "",
      budget: project.budget ?? "",
      startDate: project.startDate || "",
      managerId: project.managerId != null ? String(project.managerId) : "",
      labourManagerId: project.labourManagerId != null ? String(project.labourManagerId) : "",
      status: project.status || "Planning",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only an ADMIN picks the manager (a PM's own field is locked), so only
    // require it for them - otherwise a PM couldn't save edits to older
    // projects that have no manager yet.
    if (!form.projectName || !form.clientName || !form.location || !form.budget || !form.startDate || (isAdmin && !form.managerId)) {
      alert("Please fill all fields before saving the project.");
      return;
    }
    const isDuplicate = projects.some(
      (p) => p.projectName.toLowerCase() === form.projectName.toLowerCase() && p.id !== editingProject?.id
    );
    if (isDuplicate) {
      alert("A project with this name already exists. Please use a different name.");
      return;
    }

    const payload = {
      ...form,
      managerId: form.managerId ? Number(form.managerId) : null,
      labourManagerId: form.labourManagerId ? Number(form.labourManagerId) : null,
    };

    setSaving(true);
    try {
      if (editingProject) {
        await projectsApi.update(editingProject.id, payload);
        alert(`Project "${form.projectName}" has been updated successfully!`);
      } else {
        await projectsApi.create(payload);
        alert(`Project "${form.projectName}" has been created successfully!`);
      }
      await loadProjects();
      setForm(emptyForm);
      setEditingProject(null);
      setShowModal(false);
    } catch (err) {
      alert(describeApiError(err, editingProject ? "update the project" : "create the project"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Are you sure you want to delete the project "${project.projectName}"?`)) return;
    try {
      await projectsApi.remove(project.id);
      await loadProjects();
    } catch (err) {
      alert(describeApiError(err, "delete the project"));
    }
  };

  // Mirrors ProjectServiceImpl.authorizeAssignments: ADMIN always; a
  // PROJECT_MANAGER only on a project they manage (form.managerId is
  // their own id when creating, and the project's current manager when editing).
  const canAssignLabourManager = isAdmin || (myId != null && String(form.managerId) === String(myId));

  return (
    <div className="projects-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Projects</p>
          <h2>Manage ongoing and upcoming electrical contracting projects.</h2>
          <p className="section-description">
            Track project progress, budgets, timelines, and team assignments all in one place.
          </p>
        </div>
        <button className="primary-btn" onClick={openCreateModal}>
          <i className="fas fa-plus"></i>
          <span className="btn-text">New Project</span>
        </button>
      </div>

      <div className="projects-summary-grid">
        <Card label="Total Projects" value={totalProjects} meta="All electrical projects" />
        <Card label="Active Projects" value={activeProjects} meta="Currently in progress" />
        <Card label="Planned Projects" value={plannedProjects} meta="Upcoming projects" />
        <Card label="Total Budget" value={`₹${totalBudget.toLocaleString()}`} meta="Combined project budgets" />
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      <div className="projects-container">
        <div className="projects-header">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search project by name or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 16 }}>Loading projects...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-briefcase"></i>
            <h3>No projects found</h3>
            <p>Create a new project to get started.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client Name</th>
                  <th>Location</th>
                  <th>Budget (₹)</th>
                  <th>Start Date</th>
                  <th>Manager</th>
                  <th>Labour Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td><strong>{project.projectName}</strong></td>
                    <td>{project.clientName}</td>
                    <td>{project.location}</td>
                    <td>₹{Number(project.budget || 0).toLocaleString()}</td>
                    <td>{project.startDate || "—"}</td>
                    <td>{project.managerName || "—"}</td>
                    <td>{project.labourManagerName || "—"}</td>
                    <td>
                      <span className={`status-pill ${project.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                        {project.status}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="table-action" onClick={() => openEditModal(project)}>
                        Edit
                      </button>
                      <button className="table-action" onClick={() => handleDelete(project)}>
                        Delete
                      </button>
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
                <p className="section-label">{editingProject ? "Edit Project" : "New Project"}</p>
                <h3 className="modal-title">{editingProject ? `Edit "${editingProject.projectName}"` : "Create New Project"}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Project Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="projectName"
                    placeholder="e.g., Mumbai Airport Terminal 3"
                    value={form.projectName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Client Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="e.g., Airport Authority"
                    value={form.clientName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location <span className="required">*</span></label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Budget (₹) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="budget"
                    placeholder="e.g., 500000"
                    min="0"
                    value={form.budget}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Date <span className="required">*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Project Manager {isAdmin && <span className="required">*</span>}</label>
                  <select name="managerId" value={form.managerId} onChange={handleChange} required={isAdmin} disabled={!isAdmin}>
                    <option value="" disabled>{isAdmin ? "Select a project manager" : "Not assigned"}</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                  {isAdmin && managers.length === 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      No PROJECT_MANAGER accounts exist yet - promote one in User Management first.
                    </span>
                  )}
                  {!isAdmin && (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Only an ADMIN can change the project manager.</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Labour Manager</label>
                  <select
                    name="labourManagerId"
                    value={form.labourManagerId}
                    onChange={handleChange}
                    disabled={!canAssignLabourManager}
                  >
                    <option value="">Not assigned</option>
                    {labourManagers.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                  {!canAssignLabourManager ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      Only this project's manager or an ADMIN can assign a labour manager.
                    </span>
                  ) : labourManagers.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      No LABOUR_MANAGER accounts exist yet - promote one in User Management first.
                    </span>
                  ) : null}
                </div>
                <div className="form-group full-width">
                  <label>Initial Status <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-option">
                      <input
                        type="radio"
                        id="statusPlanning"
                        name="status"
                        value="Planning"
                        checked={form.status === "Planning"}
                        onChange={handleChange}
                      />
                      <label htmlFor="statusPlanning" className="radio-label">
                        <span className="radio-dot"></span>
                        Planning
                      </label>
                    </div>
                    <div className="radio-option">
                      <input
                        type="radio"
                        id="statusActive"
                        name="status"
                        value="Active"
                        checked={form.status === "Active"}
                        onChange={handleChange}
                      />
                      <label htmlFor="statusActive" className="radio-label">
                        <span className="radio-dot"></span>
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
