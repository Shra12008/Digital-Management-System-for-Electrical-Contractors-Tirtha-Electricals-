// Pure helpers shared by the Invoice page, the invoice image renderer and
// the mock API. No DOM / React in here so it can be unit-tested in Node.

export const GST_OPTIONS = [0, 5, 12, 18, 28];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const toISODate = (d) => {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
};

export const addDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatNumber = (n) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

export const formatINR = (n) => `\u20B9${formatNumber(n)}`;

/** Line items -> subtotal, discount, GST split (CGST + SGST) and grand total. */
export function calcTotals(inv) {
  const items = Array.isArray(inv?.items) ? inv.items : [];
  const subtotal = round2(items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0));
  const discount = round2(Math.min(Math.max(Number(inv?.discount) || 0, 0), subtotal));
  const taxable = round2(subtotal - discount);
  const gstRate = Number(inv?.gstRate) || 0;
  const gst = round2((taxable * gstRate) / 100);
  const cgst = round2(gst / 2);
  const sgst = round2(gst - cgst);
  return { subtotal, discount, taxable, gstRate, gst, cgst, sgst, total: round2(taxable + gst) };
}

/** Shown status: an unpaid invoice past its due date is Overdue. */
export function effectiveStatus(inv, today = toISODate(new Date())) {
  if (inv?.status === "Unpaid" && inv?.dueDate && inv.dueDate < today) return "Overdue";
  return inv?.status || "Unpaid";
}

/**
 * Invoices created before this upgrade only have {title, client, amount}.
 * Give them a single line item so they render like any other invoice.
 */
export function normalizeInvoice(inv) {
  const hasItems = Array.isArray(inv.items) && inv.items.length > 0;
  const items = hasItems
    ? inv.items
    : [{ description: inv.title || "Services rendered", qty: 1, rate: Number(inv.amount) || 0 }];
  return {
    ...inv,
    items,
    gstRate: hasItems ? Number(inv.gstRate) || 0 : 0,
    discount: hasItems ? Number(inv.discount) || 0 : 0,
    issueDate: inv.issueDate || (inv.dueDate ? addDays(inv.dueDate, -14) : toISODate(new Date())),
    status: effectiveStatus(inv),
  };
}

/** Next INV-#### code = highest existing number + 1. */
export function nextInvoiceCode(invoices) {
  const max = invoices.reduce((m, i) => {
    const n = parseInt(String(i.code || "").match(/(\d+)$/)?.[1] || "0", 10);
    return Math.max(m, n);
  }, 0);
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const below100 = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`);
const below1000 = (n) =>
  `${n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : ""}${n % 100 ? below100(n % 100) : ""}`;

/** 125000.5 -> "Rupees One Lakh Twenty Five Thousand and Fifty Paise Only" (Indian system). */
export function amountInWords(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (total === 0) return "Rupees Zero Only";
  const parts = [];
  let n = rupees;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  let words = rupees ? `Rupees ${parts.join(" ")}` : "";
  if (paise) words += `${rupees ? " and " : "Paise "}${below100(paise)}${rupees ? " Paise" : ""}`;
  return `${words} Only`;
}
