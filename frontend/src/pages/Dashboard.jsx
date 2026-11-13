import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { projectsApi, labourApi, invoiceApi, accountsApi, inventoryApi, describeApiError } from "../services/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [labours, setLabours] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      // Promise.allSettled, not Promise.all: not every role can read every
      // one of these (e.g. CLIENT can't read /labours or /inventory - see
      // SecurityConfig.java). A 403 on one call must not blank out the
      // whole dashboard for the other four - each widget just shows
      // whatever its own call actually returned.
      const [p, l, inv, acc, stock] = await Promise.allSettled([
        projectsApi.getAll(),
        labourApi.getAll(),
        invoiceApi.getAll(),
        accountsApi.getSummary(),
        inventoryApi.getAll(),
      ]);

      if (p.status === "fulfilled") setProjects(p.value);
      if (l.status === "fulfilled") setLabours(l.value);
      if (inv.status === "fulfilled") setInvoices(inv.value);
      if (acc.status === "fulfilled") setAccounts(acc.value);
      if (stock.status === "fulfilled") setInventory(stock.value);

      // Only surface an error banner for a REAL problem - a 403 on a
      // widget the current role simply can't see is not an error, it's
      // expected. Show the first genuine failure (network/401/other) if
      // there is one; a 403 alone stays silent (matching the existing
      // Sidebar/route behavior of just not showing what a role can't use).
      const firstRealFailure = [p, l, inv, acc, stock].find(
        (r) => r.status === "rejected" && r.reason?.response?.status !== 403
      );
      if (firstRealFailure) {
        setErrorMsg(describeApiError(firstRealFailure.reason, "load the dashboard"));
      }

      setLoading(false);
    })();
  }, []);

  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const statusCounts = ["Planning", "Active", "On Hold", "Completed", "Cancelled"].map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  const lowStockCount = inventory.filter((i) => Number(i.stock) <= 10).length;
  const pendingInvoices = invoices.filter((i) => i.status !== "Paid").length;

  return (
    <div className="dashboard-content">
      {errorMsg && (
        <p style={{ color: "#ef4444", marginBottom: 16, fontSize: 13 }}>{errorMsg}</p>
      )}

      <div className="metrics-grid">
        <Card
          variant="metric"
          label="Total Revenue"
          value={`₹${(accounts?.totalRevenue || 0).toLocaleString()}`}
          icon="fa-indian-rupee-sign"
          iconBg="bg-amber"
          change="+12.5%"
          trend="positive"
        />
        <Card
          variant="metric"
          label="Active Projects"
          value={loading ? "…" : activeProjects}
          icon="fa-briefcase"
          iconBg="bg-blue"
          change={`+${activeProjects}`}
          trend="positive"
        />
        <Card
          variant="metric"
          label="Outstanding Payments"
          value={`₹${outstanding.toLocaleString()}`}
          icon="fa-triangle-exclamation"
          iconBg="bg-amber"
          change="-5.2%"
          trend="negative"
        />
        <Card
          variant="metric"
          label="Total Workers"
          value={loading ? "…" : labours.length}
          icon="fa-users"
          iconBg="bg-purple"
          change={`+${labours.length}`}
          trend="positive"
        />
      </div>

      <div className="charts-section">
        <div className="chart-container revenue-chart">
          <div className="chart-header">
            <i className="fas fa-arrow-trend-up chart-icon"></i>
            <h3>Revenue vs Expenses (YTD)</h3>
          </div>
          <div className="chart-area">
            <div className="chart-y-axis">
              <span>₹0.04k</span>
              <span>₹0.03k</span>
              <span>₹0.02k</span>
              <span>₹0.01k</span>
              <span>₹0k</span>
            </div>
            <div className="chart-canvas">
              <div className="chart-grid"></div>
              <div className="chart-x-axis">
                {MONTHS.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot revenue"></span>
              <span>Revenue</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot expenses"></span>
              <span>Expenses</span>
            </div>
          </div>
        </div>

        <div className="chart-container project-status">
          <h3>Project Status</h3>
          <div className="status-list">
            {statusCounts.map(({ status, count }) => (
              <div className="status-item" key={status}>
                <div className="status-label">
                  <span
                    className={`status-dot ${
                      { Planning: "blue", Active: "green", "On Hold": "purple", Completed: "emerald", Cancelled: "gray" }[status]
                    }`}
                  ></span>
                  <span>{status}:</span>
                </div>
                <span className="status-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="alerts-section">
        <div className="alert-card">
          <div className="alert-content">
            <div className="alert-icon bg-amber">
              <i className="fas fa-box"></i>
            </div>
            <div className="alert-text">
              <h4>Low Stock Alert</h4>
              <p>{lowStockCount} items require restocking</p>
            </div>
          </div>
          <a
            href="#inventory"
            className="alert-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/inventory");
            }}
          >
            View Inventory
            <i className="fas fa-arrow-right"></i>
          </a>
        </div>

        <div className="alert-card">
          <div className="alert-content">
            <div className="alert-icon bg-amber">
              <i className="fas fa-file-invoice"></i>
            </div>
            <div className="alert-text">
              <h4>Pending Invoices</h4>
              <p>{pendingInvoices} invoices await approval</p>
            </div>
          </div>
          <a
            href="#billing"
            className="alert-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/invoice");
            }}
          >
            View Billing
            <i className="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
