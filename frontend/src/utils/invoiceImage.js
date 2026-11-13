// Browser side of the invoice renderer: loads the logo + fonts, caches the
// generated images and provides download / print helpers.
import logoUrl from "../assets/logo.png";
import { getCompany } from "../config/company";
import { renderInvoice } from "./invoiceRenderer";
import { buildPdfFromJpeg } from "./pdf";

let logoPromise;
const loadLogo = () => {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // invoice still renders without the logo
      img.src = logoUrl;
    });
  }
  return logoPromise;
};

// Canvas text only uses a web font once it has actually loaded, so wait.
async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('700 40px "Space Grotesk"'),
      document.fonts.load("400 20px Inter"),
      document.fonts.load("600 20px Inter"),
      document.fonts.load('500 20px "JetBrains Mono"'),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

const makeCanvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

export async function buildInvoiceCanvas(invoice, scale = 1) {
  const [logo] = await Promise.all([loadLogo(), ensureFonts()]);
  return renderInvoice({ invoice, logo, createCanvas: makeCanvas, scale });
}

const cache = new Map();

/** Returns { url, width, height } for the invoice image (data URL). */
export async function getInvoiceImage(invoice, { scale = 1, type = "image/png", quality = 0.92, useCache = true } = {}) {
  const key = JSON.stringify([invoice, scale, type, getCompany()]);
  if (useCache && cache.has(key)) return cache.get(key);
  const canvas = await buildInvoiceCanvas(invoice, scale);
  const result = { url: canvas.toDataURL(type, quality), width: canvas.width, height: canvas.height };
  if (useCache) {
    cache.set(key, result);
    if (cache.size > 60) cache.delete(cache.keys().next().value);
  }
  return result;
}

const fileBase = (invoice) => `${invoice.code || "invoice"}-${(invoice.client || "client").replace(/[^\w]+/g, "_")}`;

const saveBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export async function downloadInvoicePng(invoice) {
  const canvas = await buildInvoiceCanvas(invoice, 1);
  saveBlob(await canvasToBlob(canvas, "image/png"), `${fileBase(invoice)}.png`);
}

export async function downloadInvoicePdf(invoice) {
  const canvas = await buildInvoiceCanvas(invoice, 1);
  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.95);
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  saveBlob(new Blob([buildPdfFromJpeg(bytes, canvas.width, canvas.height)], { type: "application/pdf" }), `${fileBase(invoice)}.pdf`);
}

export async function printInvoice(invoice) {
  const { url } = await getInvoiceImage(invoice);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups to print the invoice.");
    return;
  }
  w.document.write(
    `<!doctype html><title>${fileBase(invoice)}</title><style>@page{size:A4;margin:0}html,body{margin:0}img{width:100%;display:block}</style><img src="${url}" onload="setTimeout(function(){window.print()},150)">`
  );
  w.document.close();
}
