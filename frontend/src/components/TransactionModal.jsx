import React, { useState } from "react";
import { describeApiError } from "../services/api";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../utils/financeUtils";
import { toISODate } from "../utils/invoiceUtils";

const blank = () => ({
  type: "Expense",
  date: toISODate(new Date()),
  description: "",
  category: EXPENSE_CATEGORIES[0],
  party: "",
  method: PAYMENT_METHODS[0],
  reference: "",
  amount: "",
  status: "Completed",
  notes: "",
});

/** Add / edit a MONEY-OUT entry. (Money in is created by invoices, never typed here.) */
export default function TransactionModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, amount: String(initial.amount) } : blank());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const categories = EXPENSE_CATEGORIES;

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return setError("Please enter a description.");
    if (!form.date) return setError("Please choose the transaction date.");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than zero.");
    setSaving(true);
    try {
      await onSave({ ...form, description: form.description.trim(), party: form.party.trim(), reference: form.reference.trim(), amount: Number(form.amount) });
    } catch (err) {
      setError(describeApiError(err, "save the transaction"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: "flex" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={initial ? "Edit money out" : "Add money out"}>
        <div className="modal-header">
          <div>
            <p className="section-label">{initial ? "Edit expense" : "New expense"}</p>
            <h3 className="modal-title">{initial ? "Edit money out" : "Add money out"}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="modal-form" onSubmit={submit} noValidate>
          <p className="fin-modal-note">
            <i className="fas fa-circle-info"></i> Use this for money the company pays out. Money coming in is recorded by creating an invoice and marking it paid.
          </p>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Description <span className="required">*</span></label>
              <input type="text" name="description" placeholder="e.g., Copper wire purchase" value={form.description} onChange={set} autoFocus />
            </div>
            <div className="form-group">
              <label>Amount (₹) <span className="required">*</span></label>
              <input type="number" name="amount" min="0" step="any" placeholder="0.00" value={form.amount} onChange={set} />
            </div>
            <div className="form-group">
              <label>Date <span className="required">*</span></label>
              <input type="date" name="date" value={form.date} onChange={set} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={set}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Paid to</label>
              <input type="text" name="party" placeholder="Client or vendor name" value={form.party} onChange={set} />
            </div>
            <div className="form-group">
              <label>Payment method</label>
              <select name="method" value={form.method} onChange={set}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={set}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Reference / invoice no.</label>
              <input type="text" name="reference" placeholder="e.g., INV-0016 or cheque no." value={form.reference} onChange={set} />
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea name="notes" rows={2} placeholder="Optional" value={form.notes} onChange={set} style={{ minHeight: 64 }} />
            </div>
          </div>
          {error && <p className="invoice-form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Add money out"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
