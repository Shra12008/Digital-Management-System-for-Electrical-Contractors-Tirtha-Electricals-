import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AreaChart from "../components/charts/AreaChart";
import BarLineChart from "../components/charts/BarLineChart";
import DonutChart from "../components/charts/DonutChart";
import BudgetModal from "../components/BudgetModal";
import InvoiceViewer from "../components/InvoiceViewer";
import TransactionModal from "../components/TransactionModal";
import { accountsApi, describeApiError, invoiceApi } from "../services/api";
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PERIODS,
  agingBuckets,
  balanceAt,
  budgetUsage,
  buildLedger,
  buildInsights,
  categoryBreakdown,
  formatCompact,
  inRange,
  ledgerToCsv,
  monthlySeries,
  pctChange,
  periodBounds,
  totalsFor,
} from "../utils/financeUtils";
import { formatDate, formatINR, toISODate } from "../utils/invoiceUtils";

const PAGE_SIZE = 8;

// Whole-rupee amounts read cleaner without ".00" on the KPI tiles.
const money = (n) => (Number.isInteger(n) ? `\u20B9${new Intl.NumberFormat("en-IN").format(n)}` : formatINR(n));

function Kpi({ label, value, icon, tint, delta, upIsGood = true, sub, fallback }) {
  const hasDelta = delta !== null && delta !== undefined;
  const good = hasDelta && (delta >= 0) === upIsGood;
  return (
    <div className="fin-kpi">
      <div className="fin-kpi-top">
        <span className="fin-kpi-label">{label}</span>
        <span className="fin-kpi-icon" style={{ background: `${tint}26`, color: tint }}><i className={`fas ${icon}`}></i></span>
      </div>
      <div className="fin-kpi-value">{value}</div>
      <div className="fin-kpi-foot">
        {hasDelta && (
          <span className={`fin-delta ${good ? "good" : "bad"}`}>
            <i className={`fas ${delta >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}></i> {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        <span className="fin-kpi-sub">{hasDelta || !fallback ? sub : fallback}</span>
      </div>
    </div>
  );
}

function Panel({ title, icon, hint, children }) {
  return (
    <section className="fin-panel">
      <header className="fin-panel-head">
        <h3><i className={`fas ${icon}`}></i> {title}</h3>
        {hint && <span>{hint}</span>}
      </header>
      {children}
    </section>
  );
}

export default function Accounts() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]); // manual money-out entries from the server
  const [budgets, setBudgets] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [opening, setOpening] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6M");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | "new" | transaction
  const [showBudgets, setShowBudgets] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);

  // Money in is NOT stored in the ledger: every invoice becomes an income row
  // (paid = received, unpaid = expected), and the manual entries are money out.
  const txns = useMemo(() => buildLedger(expenses, invoices), [expenses, invoices]);

  const [loadError, setLoadError] = useState("");

  const load = async () => {
    try {
      const [t, b, inv, ob] = await Promise.all([
        accountsApi.getTransactions(),
        accountsApi.getBudgets(),
        invoiceApi.getAll(),
        accountsApi.getOpeningBalance(),
      ]);
      setExpenses(t);
      setBudgets(b);
      setInvoices(inv);
      setOpening(ob);
      setLoadError("");
    } catch (err) {
      setLoadError(describeApiError(err, "load the finance data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => setPage(1), [period, search, typeFilter, categoryFilter, statusFilter]);

  const now = useMemo(() => new Date(), []);
  const bounds = useMemo(() => periodBounds(period, now), [period, now]);
  const inPeriod = useMemo(() => txns.filter((t) => inRange(t, bounds.start, bounds.end)), [txns, bounds]);
  const cur = useMemo(() => totalsFor(inPeriod), [inPeriod]);
  const prev = useMemo(
    () => (bounds.prevStart ? totalsFor(txns.filter((t) => inRange(t, bounds.prevStart, bounds.prevEnd))) : null),
    [txns, bounds]
  );
  const cash = useMemo(() => balanceAt(txns, opening), [txns, opening]);
  const series = useMemo(() => monthlySeries(txns, opening, now, 6), [txns, opening, now]);
  const breakdown = useMemo(() => categoryBreakdown(inPeriod), [inPeriod]);
  const budgetRows = useMemo(() => budgetUsage(txns, budgets, now), [txns, budgets, now]);
  const aging = useMemo(() => agingBuckets(invoices, now), [invoices, now]);
  const receivables = aging.reduce((s, a) => s + a.amount, 0);
  const lateCount = aging.filter((a) => a.key !== "current").reduce((s, a) => s + a.count, 0);
  const insights = useMemo(
    () => buildInsights({ series, breakdown, budgets: budgetRows, aging, totals: cur }),
    [series, breakdown, budgetRows, aging, cur]
  );

  const ledger = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inPeriod.filter((t) => {
      if (typeFilter !== "All" && t.type !== typeFilter) return false;
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      return !q || `${t.description} ${t.party} ${t.reference} ${t.category}`.toLowerCase().includes(q);
    });
  }, [inPeriod, search, typeFilter, categoryFilter, statusFilter]);

  const lt = useMemo(() => totalsFor(ledger), [ledger]);
  const moneyIn = lt.income + lt.pendingIn;
  const moneyOut = lt.expense + lt.pendingOut;
  const pages = Math.max(1, Math.ceil(ledger.length / PAGE_SIZE));
  const shown = ledger.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxAging = Math.max(...aging.map((a) => a.amount), 1);

  // ---------- actions ----------
  const save = async (payload) => {
    if (editing && editing !== "new") await accountsApi.updateTransaction(editing.id, payload);
    else await accountsApi.addTransaction(payload);
    setEditing(null);
    await load();
  };
  const markInvoicePaid = async (inv) => {
    try {
      const updated = await invoiceApi.update(inv.id, { status: "Paid" });
      await load();
      setViewInvoice((v) => (v && v.id === inv.id ? { ...v, ...updated } : v));
    } catch (err) {
      alert(describeApiError(err, "mark the invoice as paid"));
    }
  };
  const settle = async (t) => {
    if (t.source === "invoice") {
      const inv = invoices.find((i) => i.id === t.invoiceId);
      if (inv) await markInvoicePaid(inv);
      return;
    }
    try {
      await accountsApi.updateTransaction(t.id, { status: "Completed" });
      await load();
    } catch (err) {
      alert(describeApiError(err, "update the transaction"));
    }
  };
  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.description}"? This cannot be undone.`)) return;
    try {
      await accountsApi.deleteTransaction(t.id);
      await load();
    } catch (err) {
      alert(describeApiError(err, "delete the transaction"));
    }
  };
  const saveBudgets = async (b) => {
    await accountsApi.saveBudgets(b);
    setShowBudgets(false);
    await load();
  };
  const exportCsv = () => {
    const blob = new Blob(["\uFEFF", ledgerToCsv(ledger)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ledger-${toISODate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  if (loading) return <p style={{ padding: 16 }}>Loading financial data...</p>;
  if (loadError) {
    return (
      <div className="accounts-page">
        <p className="invoice-form-error" role="alert">
          {loadError} <button type="button" className="link-btn" onClick={() => { setLoading(true); load(); }}>Try again</button>
        </p>
      </div>
    );
  }

  const vs = prev ? `vs previous ${period === "1M" ? "month" : period === "3M" ? "3 months" : "6 months"}` : null;

  return (
    <div className="accounts-page">
      <div className="billing-topbar">
        <div>
          <p className="section-label">Accounts & Finance</p>
          <h2>Financial management</h2>
          <p className="section-description">Monitor financial performance, manage the ledger, and track profitability and budgets.</p>
        </div>
        <div className="accounts-actions">
          <button className="secondary-btn" onClick={() => setShowBudgets(true)}><i className="fas fa-sliders"></i> Set budgets</button>
          <button className="secondary-btn" onClick={exportCsv}><i className="fas fa-file-csv"></i> Export CSV</button>
          <button className="primary-btn" onClick={() => setEditing("new")}><i className="fas fa-plus"></i> Add money out</button>
        </div>
      </div>

      <div className="fin-notice">
        <i className="fas fa-file-invoice"></i>
        <p><strong>Money in comes from invoices.</strong> Create an invoice for the client and mark it paid, and it shows up here as income on the day it was paid. Use "Add money out" for expenses.</p>
        <button className="secondary-btn small" onClick={() => navigate("/invoice")}>Go to invoices</button>
      </div>

      <div className="fin-period-bar">
        <div className="billing-filters" role="group" aria-label="Reporting period">
          {PERIODS.map((p) => (
            <button key={p.key} className={`filter-btn ${period === p.key ? "active" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
        <span className="fin-period-label"><i className="far fa-calendar"></i> {bounds.label}</span>
      </div>

      <div className="fin-kpi-grid">
        <Kpi label="Revenue" icon="fa-arrow-down" tint="#10b981" value={money(cur.income)} delta={prev ? pctChange(cur.income, prev.income) : null} sub={vs} fallback="Completed income, no earlier data" />
        <Kpi label="Expenses" icon="fa-arrow-up" tint="#f97316" value={money(cur.expense)} delta={prev ? pctChange(cur.expense, prev.expense) : null} upIsGood={false} sub={vs} fallback="Completed spending, no earlier data" />
        <Kpi label="Net profit" icon="fa-chart-line" tint="#60a5fa" value={money(cur.net)} delta={prev ? pctChange(cur.net, prev.net) : null} sub={vs || `${cur.margin.toFixed(1)}% profit margin`} fallback={`${cur.margin.toFixed(1)}% profit margin`} />
        <Kpi label="Cash balance" icon="fa-wallet" tint="#a855f7" value={money(cash)} sub={`Opening ${formatCompact(opening)}, as of today`} />
        <Kpi label="Receivables" icon="fa-file-invoice-dollar" tint="#eab308" value={money(receivables)} sub={lateCount ? `${lateCount} invoice${lateCount > 1 ? "s" : ""} overdue` : "Nothing overdue"} />
      </div>

      <div className="fin-grid fin-grid-wide">
        <Panel title="Income vs expenses" icon="fa-chart-column" hint="Last 6 months, completed entries">
          <BarLineChart data={series} />
        </Panel>
        <Panel title="Expense breakdown" icon="fa-chart-pie" hint={bounds.label}>
          {breakdown.length ? <DonutChart data={breakdown} centerLabel="Total spent" /> : <p className="fin-empty">No completed expenses in this period.</p>}
        </Panel>
      </div>

      <div className="fin-grid">
        <Panel title="Cash balance trend" icon="fa-chart-area" hint="Closing balance at month end">
          <AreaChart points={series.map((s) => ({ label: s.label, value: s.balance }))} valueLabel="Closing balance" />
        </Panel>
        <Panel title="Receivables aging" icon="fa-hourglass-half" hint={`${formatINR(receivables)} outstanding`}>
          {receivables > 0 ? (
            <ul className="fin-aging">
              {aging.map((a) => (
                <li key={a.key}>
                  <div className="fin-aging-row">
                    <span>{a.label}</span>
                    <span>{a.count} invoice{a.count === 1 ? "" : "s"}</span>
                    <strong>{formatINR(a.amount)}</strong>
                  </div>
                  <div className="fin-bar"><div style={{ width: `${(a.amount / maxAging) * 100}%`, background: a.color }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="fin-empty">All invoices are paid. Nothing to collect.</p>}
        </Panel>
      </div>

      <div className="fin-grid">
        <Panel title="Budget vs actual" icon="fa-gauge-high" hint="This month, spent + pending">
          {budgetRows.length ? (
            <ul className="fin-budgets">
              {budgetRows.map((b) => {
                const tone = b.pct > 100 ? "over" : b.pct >= 80 ? "warn" : "ok";
                return (
                  <li key={b.category}>
                    <div className="fin-budget-row">
                      <span><i className="fin-dot" style={{ background: b.color }} /> {b.category}</span>
                      <span className="amts">{formatINR(b.actual)} <em>of {formatINR(b.budget)}</em></span>
                    </div>
                    <div className="fin-bar"><div className={tone} style={{ width: `${Math.min(b.pct, 100)}%` }} /></div>
                    <span className={`fin-budget-note ${tone}`}>
                      {b.pct > 100 ? `${(b.pct - 100).toFixed(0)}% over budget, ${formatINR(b.actual - b.budget)} above the limit` : `${b.pct.toFixed(0)}% used, ${formatINR(b.budget - b.actual)} left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="fin-empty">No budgets set yet. Use "Set budgets" to add monthly limits.</p>}
        </Panel>
        <Panel title="Financial insights" icon="fa-lightbulb" hint="Generated from your ledger">
          {insights.length ? (
            <ul className="fin-insights">
              {insights.map((i, idx) => (
                <li key={idx} className={i.tone}>
                  <span className="icon"><i className={`fas ${i.icon}`}></i></span>
                  <p>{i.text}</p>
                </li>
              ))}
            </ul>
          ) : <p className="fin-empty">Add some transactions to see insights.</p>}
        </Panel>
      </div>

      <section className="accounts-transactions">
        <div className="invoice-table-header">
          <h3>General ledger</h3>
          <span>{ledger.length} of {inPeriod.length} entries in {bounds.label}</span>
        </div>

        <div className="billing-controls fin-ledger-controls">
          <label className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search description, party or reference" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="fin-selects">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
              <option value="All">All types</option><option value="Income">Income</option><option value="Expense">Expense</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category">
              <option value="All">All categories</option>
              {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="All">All statuses</option><option value="Completed">Completed</option><option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="empty-state"><i className="fas fa-inbox"></i><h3>No transactions found</h3><p>{txns.length === 0 ? "Nothing here yet. Create an invoice for money in, or add money out, to see the charts come alive." : "Try a different period or filter."}</p></div>
        ) : (
          <div className="invoice-table-scroll">
            <table className="invoice-table fin-ledger">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Category</th><th>Method</th><th>Status</th><th className="num">Amount</th><th></th></tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id}>
                    <td className="nowrap">{formatDate(t.date)}</td>
                    <td>
                      <div className="fin-desc">
                        <span className={`fin-dir ${t.type.toLowerCase()}`}><i className={`fas ${t.type === "Income" ? "fa-arrow-down" : "fa-arrow-up"}`}></i></span>
                        <div>
                          <strong>{t.description}{t.source === "invoice" && <em className="fin-source">Invoice</em>}</strong>
                          <small>{[t.party, t.reference].filter(Boolean).join(" | ") || "-"}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="fin-cat"><i className="fin-dot" style={{ background: CATEGORY_COLORS[t.category] || "#94a3b8" }} />{t.category}</span></td>
                    <td>{t.method}</td>
                    <td><span className={`status-pill ${t.status === "Completed" ? "paid" : "unpaid"}`}>{t.status}</span></td>
                    <td className={`num fin-amount ${t.type.toLowerCase()}`}>{t.type === "Income" ? "+" : "-"}{formatINR(t.amount)}</td>
                    <td>
                      <div className="row-actions">
                        {t.status === "Pending" && (
                          <button className="table-action" onClick={() => settle(t)} title="Mark as completed">
                            <i className="fas fa-check"></i> {t.type === "Income" ? "Received" : "Paid"}
                          </button>
                        )}
                        {t.source === "invoice" ? (
                          <button className="table-action" onClick={() => setViewInvoice(invoices.find((i) => i.id === t.invoiceId) || null)} title="Open the invoice">
                            <i className="fas fa-file-invoice"></i> View
                          </button>
                        ) : (
                          <>
                            <button className="table-action" onClick={() => setEditing(t)} aria-label={`Edit ${t.description}`} title="Edit"><i className="fas fa-pen"></i></button>
                            <button className="table-action table-action-danger" onClick={() => remove(t)} aria-label={`Delete ${t.description}`} title="Delete"><i className="fas fa-trash-can"></i></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="fin-ledger-foot">
          <div className="fin-ledger-totals">
            <span>Money in <b className="pos">{formatINR(moneyIn)}</b></span>
            <span>Money out <b className="neg">{formatINR(moneyOut)}</b></span>
            <span>Net <b className={moneyIn - moneyOut < 0 ? "neg" : "pos"}>{formatINR(moneyIn - moneyOut)}</b></span>
          </div>
          <div className="fin-pager">
            <button className="table-action" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><i className="fas fa-chevron-left"></i></button>
            <span>Page {page} of {pages}</span>
            <button className="table-action" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </section>

      <p className="fin-footnote">
        Money in is generated from invoices (paid = received, unpaid = expected). Money out is entered here. KPIs and charts use completed entries; pending items appear in the ledger totals and budgets.
      </p>

      {editing && <TransactionModal initial={editing === "new" ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
      {viewInvoice && <InvoiceViewer invoice={viewInvoice} canEdit onClose={() => setViewInvoice(null)} onMarkPaid={markInvoicePaid} />}
      {showBudgets && <BudgetModal budgets={budgets} onSave={saveBudgets} onClose={() => setShowBudgets(false)} />}
    </div>
  );
}
