// Pure finance helpers for the Accounts & Finance module (no React / DOM so
// they can be unit-tested in Node). All amounts are in rupees.
import { addDays, formatDate, toISODate } from "./invoiceUtils";

// Money in is never typed by hand: it is generated from invoices (see buildLedger).
export const INCOME_CATEGORIES = ["Invoice Payment"];
export const EXPENSE_CATEGORIES = ["Materials", "Labour & Salaries", "Equipment", "Transport", "Rent & Utilities", "Tax & Compliance", "Other"];
export const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Cheque", "Card"];

// Category colours carry meaning (like the status pills), so they are literal hex values.
export const CATEGORY_COLORS = {
  Materials: "#f97316",
  "Labour & Salaries": "#3b82f6",
  Equipment: "#a855f7",
  Transport: "#14b8a6",
  "Rent & Utilities": "#eab308",
  "Tax & Compliance": "#ec4899",
  Other: "#94a3b8",
  "Project Payment": "#10b981",
  "Service Charges": "#22c55e",
  "Maintenance Contract": "#06b6d4",
  "Other Income": "#84cc16",
  "Invoice Payment": "#10b981",
};

export const PERIODS = [
  { key: "1M", label: "This month" },
  { key: "3M", label: "3 months" },
  { key: "6M", label: "6 months" },
  { key: "ALL", label: "All time" },
];

const monthShort = (d) => d.toLocaleString("en-US", { month: "short" });

/** 12,50,000 -> "₹12.5L" style short label for chart axes and tight cards. */
export function formatCompact(n) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const trim = (x) => String(Math.round(x * 10) / 10).replace(/\.0$/, "");
  if (a >= 1e7) return `${sign}\u20B9${trim(a / 1e7)}Cr`;
  if (a >= 1e5) return `${sign}\u20B9${trim(a / 1e5)}L`;
  if (a >= 1e3) return `${sign}\u20B9${trim(a / 1e3)}K`;
  return `${sign}\u20B9${Math.round(a)}`;
}

/** Round axis bounds/ticks that include zero, e.g. (-20000, 233000) -> ticks every 50000. */
export function niceScale(min, max, count = 4) {
  let lo = Math.min(0, min);
  let hi = Math.max(0, max);
  if (hi === lo) hi = lo + 1;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { lo, hi, ticks };
}

/** Date window for a period key, plus the equal-length window before it (for % change). */
export function periodBounds(key, now = new Date()) {
  const months = { "1M": 1, "3M": 3, "6M": 6 }[key];
  if (!months) return { start: null, end: null, prevStart: null, prevEnd: null, label: "All time" };
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevStart = new Date(start.getFullYear(), start.getMonth() - months, 1);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
  const label = months === 1 ? `${monthShort(now)} ${now.getFullYear()}` : `${monthShort(start)} - ${monthShort(now)} ${now.getFullYear()}`;
  return { start: toISODate(start), end: toISODate(end), prevStart: toISODate(prevStart), prevEnd: toISODate(prevEnd), label };
}

export const inRange = (t, start, end) => (!start || t.date >= start) && (!end || t.date <= end);

/**
 * Money in comes ONLY from invoices:
 *   - a PAID invoice  = income Completed on the day it was paid (paidDate)
 *   - an UNPAID one   = income Pending (expected) on its due date
 * Rows are read-only copies; the invoice stays the single source of truth.
 */
export function invoiceIncomeRows(invoices) {
  return invoices.map((inv) => {
    const paid = inv.status === "Paid";
    return {
      id: `inv-${inv.id}`,
      source: "invoice",
      invoiceId: inv.id,
      // Invoices paid before paidDate existed fall back to their issue date.
      date: paid ? inv.paidDate || inv.issueDate : inv.dueDate,
      description: `Invoice ${inv.code} - ${inv.client}`,
      type: "Income",
      category: "Invoice Payment",
      party: inv.client,
      method: "Invoice",
      reference: inv.code,
      amount: Number(inv.amount) || 0,
      status: paid ? "Completed" : "Pending",
      notes: inv.title || "",
    };
  });
}

/** The full ledger: manual money-out entries + invoice-derived money in, newest first. */
export function buildLedger(expenses, invoices) {
  const manual = expenses.filter((t) => t.type === "Expense").map((t) => ({ ...t, source: "manual" }));
  return [...manual, ...invoiceIncomeRows(invoices)].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.id).localeCompare(String(a.id))
  );
}

/** Completed money in/out drives the P&L; pending is tracked separately. */
export function totalsFor(txns) {
  const r = { income: 0, expense: 0, pendingIn: 0, pendingOut: 0 };
  txns.forEach((t) => {
    const a = Number(t.amount) || 0;
    if (t.status === "Completed") r[t.type === "Income" ? "income" : "expense"] += a;
    else r[t.type === "Income" ? "pendingIn" : "pendingOut"] += a;
  });
  r.net = r.income - r.expense;
  r.margin = r.income > 0 ? (r.net / r.income) * 100 : 0;
  return r;
}

export const pctChange = (cur, prev) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

/** Cash balance after every completed transaction up to and including `untilISO`. */
export const balanceAt = (txns, opening, untilISO) =>
  txns.reduce(
    (b, t) => (t.status === "Completed" && (!untilISO || t.date <= untilISO) ? b + (t.type === "Income" ? 1 : -1) * Number(t.amount) : b),
    opening
  );

/** Last `count` calendar months: income, expense, net and closing cash balance. */
export function monthlySeries(txns, opening, now = new Date(), count = 6) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = toISODate(d);
    const end = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    const t = totalsFor(txns.filter((x) => inRange(x, start, end)));
    out.push({
      label: monthShort(d),
      key: start.slice(0, 7),
      income: t.income,
      expense: t.expense,
      net: t.net,
      balance: balanceAt(txns, opening, end),
    });
  }
  return out;
}

export function categoryBreakdown(txns, type = "Expense") {
  const map = {};
  txns.filter((t) => t.type === type && t.status === "Completed").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + Number(t.amount);
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount, pct: total ? (amount / total) * 100 : 0, color: CATEGORY_COLORS[category] || "#94a3b8" }))
    .sort((a, b) => b.amount - a.amount);
}

/** This month's spend (completed + pending, i.e. committed) against each category budget. */
export function budgetUsage(txns, budgets, now = new Date()) {
  const start = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return EXPENSE_CATEGORIES.filter((c) => Number(budgets[c]) > 0).map((category) => {
    const actual = txns
      .filter((t) => t.type === "Expense" && t.category === category && inRange(t, start, end))
      .reduce((s, t) => s + Number(t.amount), 0);
    const budget = Number(budgets[category]);
    return { category, actual, budget, pct: (actual / budget) * 100, color: CATEGORY_COLORS[category] };
  });
}

const daysBetween = (fromISO, toISOd) => Math.round((new Date(`${toISOd}T00:00:00`) - new Date(`${fromISO}T00:00:00`)) / 86400000);

/** Unpaid invoices grouped by how late they are. */
export function agingBuckets(invoices, now = new Date()) {
  const today = toISODate(now);
  const buckets = [
    { key: "current", label: "Not yet due", color: "#3b82f6", amount: 0, count: 0 },
    { key: "d30", label: "1-30 days late", color: "#eab308", amount: 0, count: 0 },
    { key: "d60", label: "31-60 days late", color: "#f97316", amount: 0, count: 0 },
    { key: "d60p", label: "60+ days late", color: "#ef4444", amount: 0, count: 0 },
  ];
  invoices.filter((i) => i.status !== "Paid" && i.dueDate).forEach((inv) => {
    const late = daysBetween(inv.dueDate, today);
    const b = late <= 0 ? buckets[0] : late <= 30 ? buckets[1] : late <= 60 ? buckets[2] : buckets[3];
    b.amount += Number(inv.amount) || 0;
    b.count += 1;
  });
  return buckets;
}

/** Plain-language observations shown in the Insights panel. */
export function buildInsights({ series, breakdown, budgets, aging, totals }) {
  const out = [];
  const best = [...series].sort((a, b) => b.net - a.net)[0];
  if (best && best.net > 0) out.push({ tone: "good", icon: "fa-trophy", text: `${best.label} was the strongest month with a net profit of ${formatCompact(best.net)}.` });
  const loss = series.filter((s) => s.net < 0);
  if (loss.length) out.push({ tone: "bad", icon: "fa-triangle-exclamation", text: `${loss.map((l) => l.label).join(", ")} closed at a loss. Check material and labour costs for that period.` });
  if (breakdown[0]) out.push({ tone: "info", icon: "fa-chart-pie", text: `${breakdown[0].category} is the biggest expense at ${breakdown[0].pct.toFixed(0)}% of spending in this period.` });
  const over = budgets.filter((b) => b.pct > 100);
  if (over.length) out.push({ tone: "bad", icon: "fa-gauge-high", text: `${over.map((o) => o.category).join(" and ")} ${over.length > 1 ? "are" : "is"} over the monthly budget.` });
  const late = aging.filter((a) => a.key !== "current").reduce((s, a) => ({ n: s.n + a.count, amt: s.amt + a.amount }), { n: 0, amt: 0 });
  if (late.n) out.push({ tone: "warn", icon: "fa-clock", text: `${late.n} invoice${late.n > 1 ? "s are" : " is"} overdue, ${formatCompact(late.amt)} waiting to be collected.` });
  if (totals.pendingOut > 0 || totals.pendingIn > 0)
    out.push({ tone: "info", icon: "fa-hourglass-half", text: `Pending: ${formatCompact(totals.pendingIn)} to receive and ${formatCompact(totals.pendingOut)} to pay.` });
  return out;
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function ledgerToCsv(rows) {
  const head = ["Date", "Description", "Type", "Category", "Party", "Method", "Reference", "Amount (INR)", "Status", "Notes"];
  const lines = rows.map((t) =>
    [formatDate(t.date), t.description, t.type, t.category, t.party, t.method, t.reference, t.type === "Income" ? t.amount : -t.amount, t.status, t.notes].map(csvCell).join(",")
  );
  return [head.map(csvCell).join(","), ...lines].join("\r\n");
}

export { addDays };
