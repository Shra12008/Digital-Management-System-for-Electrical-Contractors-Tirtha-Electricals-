import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import InvoiceThumb from "../components/InvoiceThumb";
import InvoiceViewer from "../components/InvoiceViewer";
import { useAuth } from "../context/AuthContext";
import { describeApiError, invoiceApi } from "../services/api";
import { getInvoiceImage } from "../utils/invoiceImage";
import { settingsStore } from "../utils/preferences";
import {
  GST_OPTIONS,
  addDays,
  calcTotals,
  effectiveStatus,
  formatINR,
  nextInvoiceCode,
  toISODate,
} from "../utils/invoiceUtils";

const emptyItem = () => ({ description: "", qty: 1, rate: "" });

const emptyForm = () => {
  const today = toISODate(new Date());
  const defaults = settingsStore.get();
  return {
    client: "",
    clientPhone: "",
    clientEmail: "",
    clientAddress: "",
    clientGstin: "",
    title: "",
    issueDate: today,
    dueDate: addDays(today, Number(defaults.dueDays) || 14),
    status: "Unpaid",
    paidDate: today,
    items: [emptyItem()],
    gstRate: Number(defaults.defaultGst),
    discount: "",
    notes: "",
  };
};

// The form holds strings while typing; this turns it into a real invoice.
const toInvoice = (form, code) => {
  const items = form.items.map((it) => ({
    description: it.description.trim(),
    qty: Number(it.qty) || 0,
    rate: Number(it.rate) || 0,
  }));
  const draft = { ...form, code, items, gstRate: Number(form.gstRate) || 0, discount: Number(form.discount) || 0 };
  return { ...draft, amount: calcTotals(draft).total };
};

function useWide(query = "(min-width: 1100px)") {
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return wide;
}

function validate(form) {
  if (!form.client.trim()) return "Please enter the client name.";
  if (!form.title.trim()) return "Please enter the project / work description.";
  if (!form.issueDate || !form.dueDate) return "Please choose the issue date and due date.";
  if (form.dueDate < form.issueDate) return "Due date cannot be before the issue date.";
  if (form.status === "Paid" && (!form.paidDate || form.paidDate < form.issueDate || form.paidDate > toISODate(new Date())))
    return "Payment date must be between the issue date and today.";
  if (form.clientEmail && !/^\S+@\S+\.\S+$/.test(form.clientEmail)) return "Please enter a valid client email.";
  const valid = form.items.filter((it) => it.description.trim());
  if (!valid.length) return "Add at least one line item with a description.";
  if (form.items.some((it) => it.description.trim() && !(Number(it.qty) > 0))) return "Every line item needs a quantity above 0.";
  if (form.items.some((it) => it.description.trim() && !(Number(it.rate) >= 0 && it.rate !== ""))) return "Every line item needs a rate.";
  const t = calcTotals({ ...form, items: valid.map((it) => ({ qty: Number(it.qty), rate: Number(it.rate) })) });
  if (t.total <= 0) return "The invoice total must be greater than zero.";
  return "";
}

export default function Invoice() {
  const { user } = useAuth();
  const canEdit = user?.role !== "CLIENT";

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [preview, setPreview] = useState(null);
  const wide = useWide();

  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setInvoices(await invoiceApi.getAll());
      setLoadError("");
    } catch (err) {
      setLoadError(describeApiError(err, "load the invoices"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const withStatus = (inv) => ({ ...inv, status: effectiveStatus(inv) });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.map(withStatus).filter((inv) => {
      const matchesFilter = filter === "All" || inv.status === filter;
      const matchesSearch =
        !q ||
        String(inv.code).toLowerCase().includes(q) ||
        String(inv.client).toLowerCase().includes(q) ||
        String(inv.title || "").toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [invoices, filter, search]);

  const totals = useMemo(() => {
    const sum = (s) =>
      invoices.map(withStatus).filter((i) => i.status === s).reduce((a, i) => a + Number(i.amount || 0), 0);
    return { paid: sum("Paid"), unpaid: sum("Unpaid"), overdue: sum("Overdue") };
  }, [invoices]);

  const count = (s) => invoices.filter((i) => effectiveStatus(i) === s).length;

  // ---------- create form ----------
  const nextCode = useMemo(() => nextInvoiceCode(invoices), [invoices]);
  const draft = useMemo(() => toInvoice(form, nextCode), [form, nextCode]);
  const draftTotals = useMemo(() => calcTotals(draft), [draft]);

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const setItem = (idx, key, value) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }));

  const openModal = () => {
    setForm(emptyForm());
    setError("");
    setPreview(null);
    setShowModal(true);
  };

  // Live preview of the invoice while the form is being filled in.
  useEffect(() => {
    if (!showModal || !wide) return undefined;
    let live = true;
    const timer = setTimeout(() => {
      const shown = { ...draft, items: draft.items.filter((it) => it.description) };
      getInvoiceImage(shown.items.length ? shown : { ...shown, items: [{ description: "Line items will appear here", qty: 1, rate: 0 }] },
        { scale: 0.6, type: "image/jpeg", quality: 0.85, useCache: false }).then((r) => live && setPreview(r));
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [draft, showModal, wide]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      const cleaned = toInvoice({ ...form, items: form.items.filter((it) => it.description.trim()) }, nextCode);
      const created = await invoiceApi.create(cleaned);
      await load();
      setShowModal(false);
      setViewing(created); // open the freshly generated invoice straight away
    } catch (err) {
      setError(describeApiError(err, "create the invoice"));
    } finally {
      setSaving(false);
    }
  };

  // ---------- row actions ----------
  const markPaid = async (inv) => {
    try {
      const updated = await invoiceApi.update(inv.id, { status: "Paid" });
      await load();
      setViewing((v) => (v && v.id === inv.id ? { ...v, ...updated, status: "Paid" } : v));
    } catch (err) {
      alert(describeApiError(err, "mark the invoice as paid"));
    }
  };

  const remove = async (inv) => {
    if (!window.confirm(`Delete invoice ${inv.code}? This cannot be undone.`)) return;
    try {
      await invoiceApi.remove(inv.id);
      await load();
    } catch (err) {
      alert(describeApiError(err, "delete the invoice"));
    }
  };

  const formBody = (
    <form className="modal-form invoice-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="invoice-fieldset">
        <legend>Client</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Client name <span className="required">*</span></label>
            <input type="text" name="client" placeholder="e.g., Tirth Builders" value={form.client} onChange={setField} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="clientPhone" placeholder="+91 98765 43210" value={form.clientPhone} onChange={setField} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="clientEmail" placeholder="accounts@client.com" value={form.clientEmail} onChange={setField} />
          </div>
          <div className="form-group">
            <label>Client GSTIN</label>
            <input type="text" name="clientGstin" placeholder="Optional" value={form.clientGstin} onChange={setField} />
          </div>
          <div className="form-group full-width">
            <label>Billing address</label>
            <textarea name="clientAddress" rows={2} placeholder="Street, area, city, PIN" value={form.clientAddress} onChange={setField} />
          </div>
        </div>
      </fieldset>

      <fieldset className="invoice-fieldset">
        <legend>Invoice details</legend>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Project / work <span className="required">*</span></label>
            <input type="text" name="title" placeholder="e.g., Electrical fit-out, 3rd floor" value={form.title} onChange={setField} />
          </div>
          <div className="form-group">
            <label>Invoice no.</label>
            <input type="text" value={`#${nextCode}`} readOnly className="readonly-input" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={setField}>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          {form.status === "Paid" && (
            <div className="form-group">
              <label>Payment received on</label>
              <input type="date" name="paidDate" min={form.issueDate} max={toISODate(new Date())} value={form.paidDate} onChange={setField} />
            </div>
          )}
          <div className="form-group">
            <label>Issue date <span className="required">*</span></label>
            <input type="date" name="issueDate" value={form.issueDate} onChange={setField} />
          </div>
          <div className="form-group">
            <label>Due date <span className="required">*</span></label>
            <input type="date" name="dueDate" min={form.issueDate} value={form.dueDate} onChange={setField} />
          </div>
        </div>
      </fieldset>

      <fieldset className="invoice-fieldset">
        <legend>Line items</legend>
        <div className="line-items">
          <div className="line-item line-item-head">
            <span>Description</span><span>Qty</span><span>Rate (₹)</span><span>Amount</span><span></span>
          </div>
          {form.items.map((it, i) => (
            <div className="line-item" key={i}>
              <input type="text" placeholder="e.g., LED panel light 2x2" value={it.description}
                onChange={(e) => setItem(i, "description", e.target.value)} aria-label={`Item ${i + 1} description`} />
              <input type="number" min="0" step="any" value={it.qty}
                onChange={(e) => setItem(i, "qty", e.target.value)} aria-label={`Item ${i + 1} quantity`} />
              <input type="number" min="0" step="any" placeholder="0.00" value={it.rate}
                onChange={(e) => setItem(i, "rate", e.target.value)} aria-label={`Item ${i + 1} rate`} />
              <div className="line-item-amount">{formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0))}</div>
              <button type="button" className="line-item-remove" onClick={() => removeItem(i)}
                disabled={form.items.length === 1} aria-label={`Remove item ${i + 1}`}>
                <i className="fas fa-trash-can"></i>
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="secondary-btn add-item-btn" onClick={addItem}>
          <i className="fas fa-plus"></i> Add item
        </button>
      </fieldset>

      <fieldset className="invoice-fieldset">
        <legend>Tax, discount and notes</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>GST</label>
            <select name="gstRate" value={form.gstRate} onChange={setField}>
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>{g === 0 ? "No GST" : `${g}% (CGST ${g / 2}% + SGST ${g / 2}%)`}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Discount (₹)</label>
            <input type="number" min="0" step="any" name="discount" placeholder="0" value={form.discount} onChange={setField} />
          </div>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea name="notes" rows={2} placeholder="Payment instructions or a thank-you note (optional)" value={form.notes} onChange={setField} />
          </div>
        </div>
        <div className="invoice-total-strip">
          <span>Invoice total</span>
          <strong>{formatINR(draftTotals.total)}</strong>
        </div>
      </fieldset>

      {error && <p className="invoice-form-error" role="alert">{error}</p>}

      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
        <button type="submit" className="primary-btn" disabled={saving}>
          <i className="fas fa-file-invoice"></i> {saving ? "Generating..." : "Create & view invoice"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="billing-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Billing & Invoicing</p>
          <h2>Invoice management</h2>
          <p className="section-description">Create invoices, track payment status, and share them with clients.</p>
        </div>
        {canEdit && <button className="primary-btn" onClick={openModal}><i className="fas fa-plus"></i> Create Invoice</button>}
      </div>

      <div className="billing-summary-grid">
        <Card label="Total Invoices" value={invoices.length} meta={`${invoices.length - count("Paid")} awaiting payment`} />
        <Card label="Paid" value={formatINR(totals.paid)} meta={`${count("Paid")} invoices paid`} />
        <Card label="Unpaid" value={formatINR(totals.unpaid)} meta={`${count("Unpaid")} invoices pending`} />
        <Card label="Overdue" value={formatINR(totals.overdue)} meta={`${count("Overdue")} overdue invoices`} />
      </div>

      <div className="billing-controls">
        <label className="search-box">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search invoice #, client, or status" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="billing-filters">
          {["All", "Paid", "Unpaid", "Overdue"].map((f) => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="invoice-table-card">
        <div className="invoice-table-header">
          <h3>Recent invoices</h3>
          <span>Showing {filtered.length} of {invoices.length} invoices. Click an invoice to open it.</span>
        </div>
        {loading ? (
          <p style={{ padding: 16 }}>Loading invoices...</p>
        ) : loadError ? (
          <p className="invoice-form-error" role="alert" style={{ margin: 16 }}>
            {loadError} <button type="button" className="link-btn" onClick={load}>Try again</button>
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 16 }}>{invoices.length === 0 ? "No invoices yet. Click Create Invoice to add the first one." : "No invoices match your search."}</p>
        ) : (
          <div className="invoice-table-scroll">
            <table className="invoice-table">
              <thead>
                <tr><th>Invoice</th><th>Client</th><th>Due Date</th><th>Status</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td><InvoiceThumb invoice={inv} onOpen={setViewing} /></td>
                    <td>{inv.client}</td>
                    <td>{inv.dueDate}</td>
                    <td><span className={`status-pill ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                    <td>{formatINR(inv.amount)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="table-action" onClick={() => setViewing(inv)}>View</button>
                        {canEdit && inv.status !== "Paid" && (
                          <button className="table-action" onClick={() => markPaid(inv)}>Mark paid</button>
                        )}
                        {canEdit && (
                          <button className="table-action table-action-danger" onClick={() => remove(inv)} aria-label={`Delete ${inv.code}`}>
                            <i className="fas fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ display: "flex" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={`modal-card invoice-modal ${wide ? "with-preview" : ""}`}>
            <div className="modal-header">
              <div>
                <p className="section-label">New Invoice</p>
                <h3 className="modal-title">Create Invoice</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="invoice-modal-body">
              <div className="invoice-modal-form">{formBody}</div>
              {wide && (
                <aside className="invoice-live-preview" aria-label="Live invoice preview">
                  <p className="section-label">Live preview</p>
                  <div className="invoice-live-paper">
                    {preview ? <img src={preview.url} alt="Invoice preview" /> : <div className="invoice-thumb-skeleton tall" />}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <InvoiceViewer invoice={viewing} canEdit={canEdit} onClose={() => setViewing(null)} onMarkPaid={markPaid} />
      )}
    </div>
  );
}
