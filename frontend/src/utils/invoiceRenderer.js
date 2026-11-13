// Draws a complete, print-ready Tirth Electrical & Services invoice onto a
// canvas. This is the ONE place the invoice layout lives: the table
// thumbnail, the full-size viewer, PNG download, PDF download and print
// all use the image produced here, so they can never drift apart.
//
// Page is A4 at 150 dpi (1240 x 1754). If an invoice has lots of line items
// the page simply gets taller instead of clipping.
import { getCompany } from "../config/company";
import { amountInWords, calcTotals, formatDate, formatINR, formatNumber, normalizeInvoice } from "./invoiceUtils";

export const PAGE_W = 1240;
export const PAGE_MIN_H = 1754;
const M = 80;
const R = PAGE_W - M;
const SIG_H = 190;
const FOOTER_H = 120;

const C = {
  ink: "#1b1d22",
  body: "#3a3d46",
  muted: "#6c7180",
  line: "#e2e4e9",
  soft: "#f5f5f7",
  red: "#d91e27",
  white: "#ffffff",
  Paid: "#0f9d6b",
  Unpaid: "#d9730d",
  Overdue: "#d92d2d",
};

const HEAD = (s) => `700 ${s}px "Space Grotesk","Segoe UI",Arial,sans-serif`;
const BODY = (s, w = 400) => `${w} ${s}px Inter,"Segoe UI",Arial,sans-serif`;
const MONO = (s) => `500 ${s}px "JetBrains Mono",Consolas,monospace`;

const txt = (ctx, s, x, y, font, color, align = "left") => {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(s), x, y);
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

const hline = (ctx, x1, x2, y, color = C.line, w = 2) => {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1, w);
};

function wrap(ctx, s, font, maxW) {
  ctx.font = font;
  const out = [];
  String(s || "").split(/\r?\n/).forEach((para) => {
    if (!para.trim()) {
      out.push("");
      return;
    }
    let line = "";
    para.trim().split(/\s+/).forEach((word) => {
      let w = word;
      while (ctx.measureText(w).width > maxW) {
        let i = w.length - 1;
        while (i > 1 && ctx.measureText(w.slice(0, i)).width > maxW) i -= 1;
        if (line) { out.push(line); line = ""; }
        out.push(w.slice(0, i));
        w = w.slice(i);
      }
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) out.push(line);
  });
  return out;
}

/** Paints the invoice. Returns the y where the main content (before the signature) ends. */
function paint(ctx, inv, logo, H) {
  const COMPANY = getCompany();
  const t = calcTotals(inv);
  const statusColor = C[inv.status] || C.Unpaid;

  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, PAGE_W, H);

  // top brand bar
  ctx.fillStyle = C.red;
  ctx.fillRect(0, 0, PAGE_W, 16);
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 16, PAGE_W, 4);

  // ---------- header ----------
  const top = 64;
  if (logo) ctx.drawImage(logo, M, top, 124, 124);
  const tx = M + 152;
  txt(ctx, COMPANY.name, tx, top + 36, HEAD(38), C.ink);
  txt(ctx, COMPANY.tagline, tx, top + 68, BODY(19), C.muted);
  txt(ctx, COMPANY.addressLine, tx, top + 100, BODY(17), C.body);
  txt(ctx, `${COMPANY.phone}   |   ${COMPANY.email}`, tx, top + 126, BODY(17), C.body);
  txt(ctx, `GSTIN ${COMPANY.gstin}`, tx, top + 152, BODY(17, 600), C.body);

  txt(ctx, "TAX INVOICE", R, top + 40, HEAD(42), C.ink, "right");
  txt(ctx, `# ${inv.code || "INV-----"}`, R, top + 86, MONO(28), C.red, "right");
  const label = inv.status.toUpperCase();
  ctx.font = BODY(16, 600);
  const pw = ctx.measureText(label).width + 40;
  roundRect(ctx, R - pw, top + 108, pw, 38, 19);
  ctx.fillStyle = `${statusColor}22`;
  ctx.fill();
  txt(ctx, label, R - pw / 2, top + 133, BODY(16, 600), statusColor, "center");

  hline(ctx, M, R, 262);

  // ---------- billed to / invoice meta ----------
  const y0 = 312;
  txt(ctx, "Billed to", M, y0, BODY(16, 600), C.muted);
  txt(ctx, inv.client || "Client name", M, y0 + 42, HEAD(30), inv.client ? C.ink : C.muted);
  let ly = y0 + 76;
  const addr = wrap(ctx, inv.clientAddress, BODY(19), 520);
  addr.forEach((l) => { txt(ctx, l, M, ly, BODY(19), C.body); ly += 28; });
  [inv.clientPhone && `Phone: ${inv.clientPhone}`, inv.clientEmail && `Email: ${inv.clientEmail}`,
    inv.clientGstin && `GSTIN: ${inv.clientGstin}`].filter(Boolean).forEach((l) => {
    txt(ctx, l, M, ly, BODY(19), C.body);
    ly += 28;
  });

  const bx = 700;
  const rows = [
    ["Invoice no.", inv.code || "-"],
    ["Issue date", formatDate(inv.issueDate)],
    ["Due date", formatDate(inv.dueDate)],
    ["Amount due", inv.status === "Paid" ? formatINR(0) : formatINR(t.total)],
  ];
  const boxH = 36 + rows.length * 46;
  roundRect(ctx, bx, y0 - 30, R - bx, boxH, 14);
  ctx.fillStyle = C.soft;
  ctx.fill();
  rows.forEach(([k, v], i) => {
    const ry = y0 + 20 + i * 46;
    txt(ctx, k, bx + 28, ry, BODY(18), C.muted);
    const last = i === rows.length - 1;
    txt(ctx, v, R - 28, ry, last ? HEAD(22) : BODY(19, 600), last ? C.red : C.ink, "right");
  });

  let y = Math.max(ly, y0 - 30 + boxH) + 36;

  // ---------- subject ----------
  if (inv.title) {
    txt(ctx, "Project / work", M, y + 16, BODY(16, 600), C.muted);
    const sl = wrap(ctx, inv.title, BODY(22, 600), R - M);
    sl.forEach((l, i) => txt(ctx, l, M, y + 50 + i * 30, BODY(22, 600), C.ink));
    y += 50 + sl.length * 30 + 20;
  }

  // ---------- line items ----------
  const qtyR = R - 400;
  const rateR = R - 220;
  const amtR = R - 24;
  const descX = M + 84;
  const descW = qtyR - 90 - descX;
  roundRect(ctx, M, y, R - M, 54, 10);
  ctx.fillStyle = C.ink;
  ctx.fill();
  const hy = y + 35;
  txt(ctx, "#", M + 24, hy, BODY(16, 600), C.white);
  txt(ctx, "Description", descX, hy, BODY(16, 600), C.white);
  txt(ctx, "Qty", qtyR, hy, BODY(16, 600), C.white, "right");
  txt(ctx, "Rate", rateR, hy, BODY(16, 600), C.white, "right");
  txt(ctx, "Amount", amtR, hy, BODY(16, 600), C.white, "right");
  y += 54;

  inv.items.forEach((it, i) => {
    const lines = wrap(ctx, it.description || "-", BODY(20), descW);
    const rh = Math.max(66, lines.length * 28 + 34);
    if (i % 2 === 1) {
      ctx.fillStyle = C.soft;
      ctx.fillRect(M, y, R - M, rh);
    }
    const base = y + 40;
    txt(ctx, i + 1, M + 24, base, BODY(19), C.muted);
    lines.forEach((l, k) => txt(ctx, l, descX, base + k * 28, BODY(20, 500), C.ink));
    txt(ctx, Number(it.qty) || 0, qtyR, base, BODY(20), C.body, "right");
    txt(ctx, formatNumber(it.rate), rateR, base, BODY(20), C.body, "right");
    txt(ctx, formatNumber((Number(it.qty) || 0) * (Number(it.rate) || 0)), amtR, base, BODY(20, 600), C.ink, "right");
    y += rh;
    hline(ctx, M, R, y - 1);
  });
  y += 34;

  // ---------- totals (right) ----------
  const tw = 440;
  const tl = R - tw;
  const trows = [["Subtotal", formatINR(t.subtotal)]];
  if (t.discount > 0) trows.push(["Discount", `- ${formatINR(t.discount)}`]);
  if (t.discount > 0 && t.gstRate > 0) trows.push(["Taxable amount", formatINR(t.taxable)]);
  if (t.gstRate > 0) {
    trows.push([`CGST @ ${t.gstRate / 2}%`, formatINR(t.cgst)]);
    trows.push([`SGST @ ${t.gstRate / 2}%`, formatINR(t.sgst)]);
  }
  let ty = y;
  trows.forEach(([k, v]) => {
    txt(ctx, k, tl, ty + 26, BODY(19), C.muted);
    txt(ctx, v, R, ty + 26, BODY(19, 500), C.ink, "right");
    ty += 44;
  });
  ty += 8;
  roundRect(ctx, tl - 20, ty, tw + 20, 80, 14);
  ctx.fillStyle = C.red;
  ctx.fill();
  txt(ctx, "Grand total", tl, ty + 49, BODY(20, 600), C.white);
  txt(ctx, formatINR(t.total), R - 22, ty + 52, HEAD(34), C.white, "right");
  ty += 80;
  const paid = inv.status === "Paid";
  txt(ctx, paid ? (inv.paidDate ? `Paid in full on ${formatDate(inv.paidDate)}` : "Paid in full") : "Balance due", tl, ty + 40, BODY(18), paid ? C.Paid : C.muted);
  txt(ctx, paid ? formatINR(0) : formatINR(t.total), R, ty + 40, BODY(18, 600), paid ? C.Paid : C.ink, "right");
  ty += 56;

  // ---------- amount in words + payment details (left) ----------
  const lw = tl - 60 - M;
  let wy = y;
  txt(ctx, "Amount in words", M, wy + 20, BODY(16, 600), C.muted);
  wrap(ctx, amountInWords(t.total), BODY(19, 500), lw).forEach((l) => {
    wy += 28;
    txt(ctx, l, M, wy + 20, BODY(19, 500), C.ink);
  });
  wy += 64;
  txt(ctx, "Payment details", M, wy + 20, BODY(16, 600), C.muted);
  const b = COMPANY.bank;
  [["Account name", b.accountName], ["Bank", b.bankName], ["Account no.", b.accountNumber],
    ["IFSC", b.ifsc], ["UPI", b.upi]].forEach(([k, v]) => {
    wy += 30;
    txt(ctx, k, M, wy + 22, BODY(17), C.muted);
    txt(ctx, v, M + 150, wy + 22, BODY(17, 600), C.body);
  });
  wy += 40;

  y = Math.max(ty, wy) + 24;

  // ---------- notes & terms ----------
  const notes = wrap(ctx, inv.notes, BODY(18), R - M);
  if (inv.notes && notes.length) {
    hline(ctx, M, R, y);
    txt(ctx, "Notes", M, y + 40, BODY(16, 600), C.muted);
    notes.forEach((l, i) => txt(ctx, l, M, y + 72 + i * 27, BODY(18), C.body));
    y += 72 + notes.length * 27 + 12;
  }
  hline(ctx, M, R, y);
  txt(ctx, "Terms & conditions", M, y + 40, BODY(16, 600), C.muted);
  COMPANY.terms.forEach((l, i) => txt(ctx, `${i + 1}.  ${l}`, M, y + 72 + i * 26, BODY(16), C.muted));
  y += 72 + COMPANY.terms.length * 26;

  const contentBottom = y;

  // ---------- signature ----------
  const sy = H - FOOTER_H - SIG_H;
  txt(ctx, `For ${COMPANY.name}`, R, sy + 30, BODY(18, 600), C.ink, "right");
  hline(ctx, R - 280, R, sy + 108, C.ink, 2);
  txt(ctx, "Authorised signatory", R, sy + 138, BODY(16), C.muted, "right");

  // ---------- footer ----------
  const fy = H - FOOTER_H;
  hline(ctx, M, R, fy);
  txt(ctx, "Thank you for your business!", PAGE_W / 2, fy + 48, HEAD(24), C.ink, "center");
  txt(ctx, "This is a computer-generated invoice and does not require a physical signature.",
    PAGE_W / 2, fy + 80, BODY(15), C.muted, "center");
  ctx.fillStyle = C.red;
  ctx.fillRect(0, H - 16, PAGE_W, 16);

  return contentBottom;
}

/**
 * @param invoice      raw invoice object (old or new shape)
 * @param logo         a loaded image (or null)
 * @param createCanvas (w, h) => canvas  - injectable so this runs in Node too
 * @param scale        1 = 1240px wide; use 0.35 for thumbnails
 */
export function renderInvoice({ invoice, logo, createCanvas, scale = 1 }) {
  const inv = normalizeInvoice(invoice);
  const probeH = 6000;
  const probe = createCanvas(PAGE_W, probeH);
  const contentBottom = paint(probe.getContext("2d"), inv, logo, probeH);
  const H = Math.max(PAGE_MIN_H, Math.ceil(contentBottom + 40 + SIG_H + FOOTER_H));
  const canvas = createCanvas(Math.round(PAGE_W * scale), Math.round(H * scale));
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  paint(ctx, inv, logo, H);
  return canvas;
}
