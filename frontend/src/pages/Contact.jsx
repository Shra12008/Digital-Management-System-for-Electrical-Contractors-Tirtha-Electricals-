import { useState } from 'react'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: wire this up to a real backend endpoint (e.g. POST /api/public/enquiries) when ready
    setSent(true)
  }

  return (
    <div className="container" style={{ paddingTop: 80, paddingBottom: 90, maxWidth: 620 }}>
      <div className="eyebrow">Contact</div>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', marginTop: 16 }}>Tell us about the site</h1>
      <p style={{ marginTop: 14, fontSize: 15.5 }}>
        Share a few details and we'll follow up with a scoped estimate — usually within one working day.
      </p>

      {sent ? (
        <div className="card" style={{ marginTop: 32, borderColor: 'var(--teal)' }}>
          <h3 style={{ color: 'var(--teal)', marginBottom: 8, fontSize: 16 }}>Message received</h3>
          <p style={{ fontSize: 14.5 }}>Thanks — we'll get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name" type="text" required />
          <Field label="Phone" type="tel" required />
          <Field label="Email" type="email" />
          <div>
            <label style={labelStyle}>Site details</label>
            <textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Type of site, location, rough timeline..." />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }}>Send enquiry</button>
        </form>
      )}
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} {...props} />
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, fontFamily: 'var(--font-mono)',
}

const inputStyle = {
  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '11px 13px', color: 'var(--text)', fontSize: 14.5, fontFamily: 'inherit',
}
