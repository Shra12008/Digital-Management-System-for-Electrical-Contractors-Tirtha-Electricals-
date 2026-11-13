import React, { useEffect, useState } from "react";
import { roleRequestsApi, authApi, describeApiError } from "../services/api";

const ALL_ROLES = ["ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR", "ACCOUNTANT", "CLIENT"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // must match RoleUpgradeRequestServiceImpl.MAX_ID_PROOF_IMAGE_BYTES

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
        display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12,
        fontWeight: 600, color, background: `${color}22`, border: `1px solid ${color}55`,
      }}
    >
      {role}
    </span>
  );
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Reads a File into a data URL, splitting it into the raw base64 payload
// (what the backend stores/validates) and the content type (needed to
// reconstruct a displayable <img> later). Rejects non-images and anything
// over MAX_IMAGE_BYTES client-side - the backend re-checks the byte size
// independently, this is just to fail fast with a clear message.
function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload an image file (JPG, PNG, etc.)."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Image is too large - max 3 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const [, base64] = dataUrl.split(",");
      resolve({ dataUrl, base64, contentType: file.type });
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

export default function RoleRequests() {
  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const isReviewer = isAdmin || user?.role === "PROJECT_MANAGER";
  const canRequest = !isAdmin;

  const [myRequests, setMyRequests] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [requestedRole, setRequestedRole] = useState("");
  const [reason, setReason] = useState("");
  const [applicantFullName, setApplicantFullName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [idProof, setIdProof] = useState(null); // { dataUrl, base64, contentType }
  const [idProofError, setIdProofError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reviewComments, setReviewComments] = useState({}); // { [requestId]: comment }
  const [reviewingId, setReviewingId] = useState(null);

  const hasPendingOfMyOwn = myRequests.some((r) => r.status === "PENDING");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const calls = [roleRequestsApi.getMine()];
      if (isReviewer) calls.push(roleRequestsApi.getPending());
      const results = await Promise.all(calls);
      setMyRequests(results[0]);
      if (isReviewer) setPending(results[1]);
    } catch (err) {
      setError(describeApiError(err, "load role upgrade requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleIdProofChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdProofError("");
    try {
      const result = await readImageFile(file);
      setIdProof(result);
    } catch (err) {
      setIdProof(null);
      setIdProofError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requestedRole || !reason.trim() || !applicantFullName.trim() || !contactEmail.trim() || !contactPhone.trim()) return;
    if (!idProof) {
      setIdProofError("An ID proof image is required.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await roleRequestsApi.submit({
        requestedRole,
        reason: reason.trim(),
        applicantFullName: applicantFullName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        idProofImageBase64: idProof.base64,
        idProofImageContentType: idProof.contentType,
      });
      setFeedback({ type: "success", message: "Your request has been submitted." });
      setRequestedRole("");
      setReason("");
      setContactPhone("");
      setIdProof(null);
      await load();
    } catch (err) {
      setFeedback({ type: "error", message: describeApiError(err, "submit your request") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(request, decision) {
    const comment = (reviewComments[request.id] || "").trim();
    if (decision === "reject" && !comment) {
      setFeedback({ type: "error", message: "A comment is required when rejecting a request." });
      return;
    }

    const confirmed = window.confirm(
      decision === "approve"
        ? `Approve ${request.requesterName}'s request to become ${request.requestedRole}?`
        : `Reject ${request.requesterName}'s request to become ${request.requestedRole}?`
    );
    if (!confirmed) return;

    setReviewingId(request.id);
    setFeedback(null);
    try {
      if (decision === "approve") {
        await roleRequestsApi.approve(request.id, comment || undefined);
      } else {
        await roleRequestsApi.reject(request.id, comment);
      }
      setFeedback({ type: "success", message: `Request ${decision === "approve" ? "approved" : "rejected"}.` });
      setReviewComments((prev) => ({ ...prev, [request.id]: "" }));
      await load();
    } catch (err) {
      setFeedback({ type: "error", message: describeApiError(err, "review this request") });
    } finally {
      setReviewingId(null);
    }
  }

  const roleOptions = ALL_ROLES.filter((r) => r !== "ADMIN" && r !== user?.role);

  return (
    <div className="projects-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">ROLE ACCESS</p>
          <h2>Role Upgrade Request</h2>
          <p className="section-description">
            {isAdmin
              ? "Review role change requests waiting on you."
              : isReviewer
              ? "Request a role change for yourself, or review requests waiting on you."
              : "Request a change to your account's role. An administrator will review it."}
          </p>
        </div>
      </div>

      {feedback && (
        <p style={{ color: feedback.type === "success" ? "#22c55e" : "#ef4444", marginBottom: 12, fontSize: 13 }}>
          {feedback.message}
        </p>
      )}
      {error && <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error}</p>}

      {/* ---- Submit form (everyone except ADMIN, and only when no request is already pending) ---- */}
      {canRequest && (
        <div className="projects-container" style={{ marginBottom: 24 }}>
          {hasPendingOfMyOwn ? (
            <p style={{ padding: 16, color: "var(--text-secondary)", fontSize: 14 }}>
              You already have a pending request. You can submit a new one once it's been reviewed.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={applicantFullName}
                    onChange={(e) => setApplicantFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Requested Role</label>
                  <select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value)} required>
                    <option value="" disabled>Select a role</option>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Why are you requesting this role?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>ID Proof (Aadhaar card image) - for the reviewer to verify your identity</label>
                <input type="file" accept="image/*" onChange={handleIdProofChange} />
                {idProofError && <span style={{ color: "#ef4444", fontSize: 12 }}>{idProofError}</span>}
                {idProof && (
                  <img
                    src={idProof.dataUrl}
                    alt="ID proof preview"
                    style={{ maxWidth: 200, maxHeight: 140, borderRadius: 8, border: "1px solid var(--border-color)", marginTop: 6 }}
                  />
                )}
              </div>

              <div>
                <button type="submit" className="primary-btn" disabled={submitting} style={{ width: "fit-content" }}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ---- Requests awaiting this reviewer (ADMIN sees all; PROJECT_MANAGER sees only their scope - filtered server-side) ---- */}
      {isReviewer && (
        <>
          <h3 style={{ marginBottom: 12 }}>Requests Awaiting Your Review</h3>
          <div className="projects-container" style={{ marginBottom: 24 }}>
            {loading ? (
              <p style={{ padding: 16 }}>Loading...</p>
            ) : pending.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-circle-check"></i>
                <h3>Nothing waiting on you right now</h3>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
                {pending.map((r) => (
                  <div key={r.id} style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div>
                        <strong>{r.requesterName}</strong>
                        <span style={{ color: "var(--text-secondary)", marginLeft: 8, fontSize: 13 }}>{r.requesterEmail}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <RoleBadge role={r.currentRole} /> <i className="fas fa-arrow-right" style={{ fontSize: 11, color: "var(--text-dim)" }}></i> <RoleBadge role={r.requestedRole} />
                      </div>
                    </div>

                    <p style={{ color: "var(--text-secondary-light)", fontSize: 14, marginBottom: 12 }}>{r.reason}</p>

                    {/* Declared identity info, for manual verification against the ID image below */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12, fontSize: 13 }}>
                      <div><span style={{ color: "var(--text-dim)" }}>Declared name: </span>{r.applicantFullName || "—"}</div>
                      <div><span style={{ color: "var(--text-dim)" }}>Contact email: </span>{r.contactEmail || "—"}</div>
                      <div><span style={{ color: "var(--text-dim)" }}>Contact phone: </span>{r.contactPhone || "—"}</div>
                    </div>

                    {r.idProofImageBase64 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 6 }}>ID proof submitted for verification:</p>
                        <img
                          src={`data:${r.idProofImageContentType};base64,${r.idProofImageBase64}`}
                          alt="Submitted ID proof"
                          style={{ maxWidth: 240, maxHeight: 160, borderRadius: 8, border: "1px solid var(--border-color)" }}
                        />
                      </div>
                    )}

                    <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 12 }}>Submitted {formatDate(r.createdAt)}</p>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <textarea
                        rows={2}
                        placeholder="Comment (required to reject, optional to approve)"
                        value={reviewComments[r.id] || ""}
                        onChange={(e) => setReviewComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="primary-btn" disabled={reviewingId === r.id} onClick={() => handleReview(r, "approve")}>
                        {reviewingId === r.id ? "Working..." : "Approve"}
                      </button>
                      <button className="table-action" disabled={reviewingId === r.id} onClick={() => handleReview(r, "reject")}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ---- My own requests - ADMIN can never submit one, so this section is skipped for ADMIN entirely ---- */}
      {!isAdmin && (
        <>
          <h3 style={{ marginBottom: 12 }}>My Requests</h3>
          <div className="projects-container">
            {loading ? (
              <p style={{ padding: 16 }}>Loading...</p>
            ) : myRequests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-pen"></i>
                <h3>You haven't submitted any role requests</h3>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Requested Role</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Reviewer</th>
                      <th>Comment</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((r) => (
                      <tr key={r.id}>
                        <td><RoleBadge role={r.requestedRole} /></td>
                        <td style={{ maxWidth: 240 }}>{r.reason}</td>
                        <td><StatusPill status={r.status} /></td>
                        <td>{r.reviewerName || "—"}</td>
                        <td style={{ maxWidth: 200 }}>{r.reviewerComment || "—"}</td>
                        <td>{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
