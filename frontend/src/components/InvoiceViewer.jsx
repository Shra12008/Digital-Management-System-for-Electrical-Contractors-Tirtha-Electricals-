import React, { useEffect, useState } from "react";
import { effectiveStatus } from "../utils/invoiceUtils";
import { downloadInvoicePdf, downloadInvoicePng, getInvoiceImage, printInvoice } from "../utils/invoiceImage";

/** Full-size invoice image in a lightbox, with download / print actions. */
export default function InvoiceViewer({ invoice, onClose, onMarkPaid, canEdit = false }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState("");
  const signature = JSON.stringify(invoice);
  const status = effectiveStatus(invoice);

  useEffect(() => {
    let live = true;
    setImg(null);
    getInvoiceImage(invoice).then((r) => live && setImg(r));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (name, fn) => {
    setBusy(name);
    try {
      await fn(invoice);
    } finally {
      setBusy("");
    }
  };

  return (
    <div
      className="invoice-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Invoice ${invoice.code}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="invoice-viewer">
        <div className="invoice-viewer-bar">
          <div className="invoice-viewer-title">
            <strong>#{invoice.code}</strong>
            <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
          </div>
          <div className="invoice-viewer-actions">
            {canEdit && status !== "Paid" && (
              <button type="button" className="viewer-btn viewer-btn-accent" onClick={() => onMarkPaid(invoice)}>
                <i className="fas fa-check"></i> Mark as paid
              </button>
            )}
            <button type="button" className="viewer-btn" disabled={!!busy} onClick={() => run("png", downloadInvoicePng)}>
              <i className="fas fa-image"></i> {busy === "png" ? "Saving..." : "PNG"}
            </button>
            <button type="button" className="viewer-btn" disabled={!!busy} onClick={() => run("pdf", downloadInvoicePdf)}>
              <i className="fas fa-file-pdf"></i> {busy === "pdf" ? "Saving..." : "PDF"}
            </button>
            <button type="button" className="viewer-btn" disabled={!!busy} onClick={() => run("print", printInvoice)}>
              <i className="fas fa-print"></i> Print
            </button>
            <button type="button" className="viewer-btn viewer-btn-icon" onClick={onClose} aria-label="Close invoice">
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        </div>
        <div className="invoice-viewer-stage">
          {img ? (
            <img
              src={img.url}
              alt={`Invoice ${invoice.code}`}
              className={zoom ? "zoomed" : ""}
              onClick={() => setZoom((z) => !z)}
              title={zoom ? "Click to fit to screen" : "Click to zoom"}
            />
          ) : (
            <p className="invoice-viewer-loading">Preparing invoice...</p>
          )}
        </div>
      </div>
    </div>
  );
}
