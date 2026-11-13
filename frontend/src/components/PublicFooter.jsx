export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 100, padding: '48px 0 32px' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 8 }}>Tirth Electrical &amp; Services</div>
          <p>Industrial, commercial and residential electrical contracting based in Jalgaon, Maharashtra.</p>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Contact</div>
          <p>Jalgaon, Maharashtra, India</p>
          <p>+91 00000 00000</p>
          <p>contact@tirthelectrical.example</p>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Hours</div>
          <p>Mon – Sat: 9:00 AM – 7:00 PM</p>
          <p>Sunday: Emergency call-outs only</p>
        </div>
      </div>
      <div className="container" style={{ marginTop: 32, fontSize: 12.5, color: 'var(--text-dim)' }}>
        © {new Date().getFullYear()} Tirth Electrical &amp; Services. All rights reserved.
      </div>
    </footer>
  )
}
