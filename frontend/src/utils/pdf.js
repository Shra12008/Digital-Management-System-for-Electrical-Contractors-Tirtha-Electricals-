// Minimal single-page PDF writer: embeds one JPEG as a full-page A4-width
// image. Pure JS, no dependency, works in the browser and in Node.
export function buildPdfFromJpeg(jpeg, width, height) {
  const pw = 595.28;
  const ph = Number(((pw * height) / width).toFixed(2));
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let len = 0;
  const push = (d) => {
    const b = typeof d === "string" ? enc.encode(d) : d;
    parts.push(b);
    len += b.length;
  };
  const obj = (n, body) => {
    offsets[n] = len;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };

  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = len;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push("\nendstream\nendobj\n");
  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xref = len;
  let x = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) x += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(x);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

  const out = new Uint8Array(len);
  let p = 0;
  parts.forEach((b) => { out.set(b, p); p += b.length; });
  return out;
}
