import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { inventoryApi, inventoryTransactionApi } from "../services/api";

const emptyMaterialForm = {
  itemName: "",
  category: "",
  unit: "Coil",
  location: "",
  stock: 0,
  minAlert: 5,
  unitRate: 0,
};

const emptyTxnForm = {
  transactionType: "ISSUE",
  transactionDate: "",
  inventoryId: "",
  quantity: "",
  referenceNumber: "",
  site: "",
  remarks: "",
  issuedBy: "",
};

// Backend doesn't store a "minimum alert" threshold per item yet, so it's
// kept client-side only (localStorage), keyed by inventory id, purely for
// the stock-level color badge in the UI. Doesn't affect the real data.
const MIN_ALERT_KEY = "inventory_min_alerts";
const readMinAlerts = () => {
  try {
    return JSON.parse(localStorage.getItem(MIN_ALERT_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveMinAlert = (id, value) => {
  const all = readMinAlerts();
  all[id] = Number(value);
  localStorage.setItem(MIN_ALERT_KEY, JSON.stringify(all));
};

function stockClass(stock, minAlert) {
  if (stock <= minAlert) return "critical";
  if (stock <= minAlert * 3) return "low";
  if (stock <= minAlert * 10) return "medium";
  return "high";
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [minAlerts, setMinAlerts] = useState(readMinAlerts());
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);
  const [view, setView] = useState("current-stock");
  const [showModal, setShowModal] = useState(false);
  const [materialForm, setMaterialForm] = useState(emptyMaterialForm);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);
  const [txnSearch, setTxnSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTxnLoading(true);
    try {
      const data = await inventoryTransactionApi.getAll();
      setTransactions(data);
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    loadTransactions();
  }, []);

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + (i.totalValue ?? Number(i.stock || 0) * Number(i.unitRate || 0)), 0),
    [items]
  );
  const lowStockItems = items.filter((i) => Number(i.stock) <= (minAlerts[i.id] || 10)).length;
  const locations = useMemo(() => new Set(items.map((i) => i.location)).size, [items]);

  const filteredTransactions = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      `${t.itemName} ${t.referenceNumber} ${t.issuedBy} ${t.transactionType}`.toLowerCase().includes(q)
    );
  }, [transactions, txnSearch]);

  const handleMaterialChange = (e) => {
    const { name, value } = e.target;
    setMaterialForm((f) => ({ ...f, [name]: value }));
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialForm.itemName || !materialForm.category || !materialForm.location) {
      alert("Please fill item name, category and location.");
      return;
    }
    setSaving(true);
    try {
      const { minAlert, ...backendPayload } = materialForm;
      const created = await inventoryApi.create({
        ...backendPayload,
        stock: Number(materialForm.stock),
        unitRate: Number(materialForm.unitRate),
      });
      saveMinAlert(created.id, minAlert);
      setMinAlerts(readMinAlerts());
      await loadItems();
      setMaterialForm(emptyMaterialForm);
      setShowModal(false);
    } catch (err) {
      alert("Failed to add material. Please check the backend connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleTxnChange = (e) => {
    const { name, value } = e.target;
    setTxnForm((f) => ({ ...f, [name]: value }));
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    if (!txnForm.transactionDate || !txnForm.inventoryId || !txnForm.quantity) {
      alert("Please fill transaction type, material, date and quantity.");
      return;
    }
    setSaving(true);
    try {
      const { site, ...rest } = txnForm;
      const remarks = site ? `Site/Project: ${site}${txnForm.remarks ? " — " + txnForm.remarks : ""}` : txnForm.remarks;
      await inventoryTransactionApi.create({
        ...rest,
        remarks,
        inventoryId: Number(txnForm.inventoryId),
        quantity: Number(txnForm.quantity),
      });
      await Promise.all([loadItems(), loadTransactions()]);
      setTxnForm(emptyTxnForm);
      alert("Transaction submitted successfully! Stock has been updated.");
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || "Failed to submit transaction.";
      alert(typeof message === "string" ? message : "Failed to submit transaction. Please check stock availability.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inventory-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Central Inventory</p>
          <h2>Manage stock levels</h2>
          <p className="section-description">Manage stock levels, materials, and issue logs to sites.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Add New Material
        </button>
      </div>

      <div className="inventory-controls">
        <button
          className={`inventory-btn ${view === "current-stock" ? "active" : ""}`}
          onClick={() => setView("current-stock")}
        >
          <i className="fas fa-boxes-stacked"></i>
          Current Stock
        </button>
        <button
          className={`inventory-btn ${view === "transactions" ? "active" : ""}`}
          onClick={() => setView("transactions")}
        >
          <i className="fas fa-arrows-left-right"></i>
          Transaction In/Out
        </button>
        <button
          className={`inventory-btn ${view === "issue-receive" ? "active" : ""}`}
          onClick={() => setView("issue-receive")}
        >
          <i className="fas fa-inbox"></i>
          Issue/Receive Item
        </button>
      </div>

      {view === "current-stock" && (
        <div className="inventory-view">
          <div className="invoice-table-card">
            <div className="invoice-table-header">
              <h3>Current Stock Levels</h3>
              <span>Real-time inventory status</span>
            </div>
            {loading ? (
              <p style={{ padding: 16 }}>Loading inventory...</p>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-boxes-stacked"></i>
                <h3>No materials yet</h3>
                <p>Add your first material to get started.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Unit</th>
                      <th>Location</th>
                      <th>Unit Rate (₹)</th>
                      <th>Total Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.itemName}</strong></td>
                        <td><span className="item-badge">{item.category}</span></td>
                        <td>
                          <span className={`stock-value ${stockClass(item.stock, minAlerts[item.id] || 5)}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td>{item.unit}</td>
                        <td>{item.location}</td>
                        <td>₹{Number(item.unitRate).toLocaleString()}</td>
                        <td><strong>₹{Number(item.totalValue ?? item.stock * item.unitRate).toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="stock-summary-grid">
            <Card label="Total Items" value={items.length} meta={`${new Set(items.map((i) => i.itemName)).size} different materials`} />
            <Card label="Total Stock Value" value={`₹${totalValue.toLocaleString()}`} meta="Across all locations" />
            <Card label="Low Stock Items" value={lowStockItems} meta="Below minimum alert" />
            <Card label="Locations" value={locations} meta="Storage racks in use" />
          </div>
        </div>
      )}

      {view === "transactions" && (
        <div className="inventory-view">
          <div className="billing-controls" style={{ marginBottom: 20 }}>
            <label className="search-box" style={{ flex: 1, maxWidth: "100%" }}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by item name, reference, or issued by"
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="invoice-table-card">
            <div className="invoice-table-header">
              <h3>Transaction History</h3>
              <span>All stock movements - In and Out</span>
            </div>
            {txnLoading ? (
              <p style={{ padding: 16 }}>Loading transactions...</p>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-arrows-left-right"></i>
                <h3>No transactions yet</h3>
                <p>Use "Issue/Receive Item" to log the first stock movement.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Reference</th>
                      <th>Issued By</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.transactionDate}</td>
                        <td><strong>{t.itemName}</strong></td>
                        <td>
                          <span className={`status-pill ${t.transactionType?.toLowerCase() === "issue" ? "overdue" : "paid"}`}>
                            {t.transactionType}
                          </span>
                        </td>
                        <td>{t.quantity}</td>
                        <td>{t.referenceNumber || "—"}</td>
                        <td>{t.issuedBy || "—"}</td>
                        <td>{t.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "issue-receive" && (
        <div className="inventory-view">
          <div className="form-section">
            <h3>Issue or Receive Material</h3>
            <p className="form-description">Log material movement to/from sites and projects</p>
            <form className="material-form" onSubmit={handleTxnSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Transaction Type <span className="required">*</span></label>
                  <select name="transactionType" value={txnForm.transactionType} onChange={handleTxnChange} required>
                    <option value="ISSUE">Issue (Outbound)</option>
                    <option value="RECEIVE">Receive (Inbound)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date <span className="required">*</span></label>
                  <input type="date" name="transactionDate" value={txnForm.transactionDate} onChange={handleTxnChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Material Item <span className="required">*</span></label>
                  <select name="inventoryId" value={txnForm.inventoryId} onChange={handleTxnChange} required>
                    <option value="" disabled>Select material...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.itemName} (Stock: {i.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity <span className="required">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="e.g., 50"
                    min="1"
                    value={txnForm.quantity}
                    onChange={handleTxnChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Site / Project</label>
                  <input
                    type="text"
                    name="site"
                    placeholder="e.g., City Mall Renovation"
                    value={txnForm.site}
                    onChange={handleTxnChange}
                  />
                </div>
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    name="referenceNumber"
                    placeholder="e.g., INV-0016, PO-2026-004"
                    value={txnForm.referenceNumber}
                    onChange={handleTxnChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Issued By</label>
                  <input
                    type="text"
                    name="issuedBy"
                    placeholder="e.g., Site Supervisor name"
                    value={txnForm.issuedBy}
                    onChange={handleTxnChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes / Remarks</label>
                  <textarea
                    name="remarks"
                    placeholder="Add any additional notes about this transaction..."
                    rows="3"
                    value={txnForm.remarks}
                    onChange={handleTxnChange}
                  ></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Submitting..." : "Submit Transaction"}
                </button>
                <button type="button" className="secondary-btn" onClick={() => setTxnForm(emptyTxnForm)}>
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="modal"
          style={{ display: "flex" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Material to Master List</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="material-form" onSubmit={handleMaterialSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="itemName"
                      placeholder="e.g., 2.5 sqmm Copper Wire"
                      value={materialForm.itemName}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <input
                      type="text"
                      name="category"
                      placeholder="e.g., Cables"
                      value={materialForm.category}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit <span className="required">*</span></label>
                    <select name="unit" value={materialForm.unit} onChange={handleMaterialChange} required>
                      <option value="">Select unit...</option>
                      <option>Coil</option>
                      <option>Mtr</option>
                      <option>Nos</option>
                      <option>Box</option>
                      <option>Bundle</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location in Store <span className="required">*</span></label>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g., Rack A"
                      value={materialForm.location}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Opening Stock <span className="required">*</span></label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={materialForm.stock}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Alert Stock <span className="required">*</span></label>
                    <input
                      type="number"
                      name="minAlert"
                      min="0"
                      value={materialForm.minAlert}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Unit Rate (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      name="unitRate"
                      min="0"
                      step="0.01"
                      value={materialForm.unitRate}
                      onChange={handleMaterialChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? "Adding..." : "Add Material"}
                  </button>
                  <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
