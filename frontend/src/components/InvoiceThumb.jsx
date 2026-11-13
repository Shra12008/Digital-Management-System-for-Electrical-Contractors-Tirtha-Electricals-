import React, { useEffect, useState } from "react";
import { getInvoiceImage } from "../utils/invoiceImage";

/**
 * The "#INV-0019" cell of the invoices table: a small rendered picture of
 * the actual invoice next to its number. Clicking it opens the full-size
 * invoice in the viewer.
 */
export default function InvoiceThumb({ invoice, onOpen }) {
  const [img, setImg] = useState(null);
  const signature = JSON.stringify(invoice);

  useEffect(() => {
    let live = true;
    getInvoiceImage(invoice, { scale: 0.4, type: "image/jpeg", quality: 0.85 }).then((r) => {
      if (live) setImg(r);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <button
      type="button"
      className="invoice-thumb-btn"
      onClick={() => onOpen(invoice)}
      title="Click to open invoice"
      aria-label={`Open invoice ${invoice.code}`}
    >
      <div className="invoice-thumb-paper">
        {img ? <img src={img.url} alt={`Invoice ${invoice.code}`} /> : <div className="invoice-thumb-skeleton" />}
      </div>
      <div className="invoice-thumb-meta">
        <strong>#{invoice.code}</strong>
        <small>{invoice.title}</small>
      </div>
    </button>
  );
}
