import React, { useState } from "react";
import { describeApiError } from "../services/api";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES } from "../utils/financeUtils";

/** Edit the monthly spending limit for each expense category. */
export default function BudgetModal({ budgets, onSave, onClose }) {
  const [form, setForm] = useState(() => Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, budgets[c] ?? ""])));
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      await onSave(Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, Math.max(Number(form[c]) || 0, 0)])));
    } catch (err) {
      setError(describeApiError(err, "save the budgets"));
    }
  };
  return (
    <div className="modal-overlay" style={{ display: "flex" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Monthly budgets">
        <div className="modal-header">
          <div>
            <p className="section-label">Budgets</p>
            <h3 className="modal-title">Monthly spending limits</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <p>Set how much you plan to spend in each category every month. Leave a category at 0 to stop tracking it.</p>
          <div className="form-grid">
            {EXPENSE_CATEGORIES.map((c) => (
              <div className="form-group" key={c}>
                <label><i className="fin-dot" style={{ background: CATEGORY_COLORS[c] }} /> {c} (₹)</label>
                <input type="number" min="0" step="any" value={form[c]} onChange={(e) => setForm((f) => ({ ...f, [c]: e.target.value }))} />
              </div>
            ))}
          </div>
          {error && <p className="invoice-form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">Save budgets</button>
          </div>
        </form>
      </div>
    </div>
  );
}
