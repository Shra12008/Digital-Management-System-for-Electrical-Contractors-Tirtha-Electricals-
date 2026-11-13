import CircuitDivider from '../components/CircuitDivider.jsx'

const values = [
  { title: 'Code-compliant, always', desc: 'Every job is wired to current IS electrical codes and signed off with proper documentation.' },
  { title: 'On-site accountability', desc: 'One supervisor owns your site from survey to switch-on — no handoffs, no confusion.' },
  { title: 'Built for load', desc: "We size for the equipment you'll add next year, not just what's plugged in today." },
]

export default function About() {
  return (
    <div>
      <section className="container" style={{ paddingTop: 80, paddingBottom: 50 }}>
        <div className="eyebrow">About us</div>
        <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginTop: 16, maxWidth: 700 }}>
          A Jalgaon electrical contractor, built on-site by on-site people.
        </h1>
        <p style={{ fontSize: 16.5, maxWidth: 620, marginTop: 20 }}>
          {/* Replace this placeholder copy with your company's real founding story, year established, and background. */}
          Tirth Electrical &amp; Services started as a small panel-wiring crew working local Jalgaon
          workshops and has grown into a full contracting outfit handling industrial, commercial and
          residential electrical work across the district. We're still run the way we started: one
          team, one point of contact, and work that's inspected before it's called done.
        </p>
      </section>

      {/* PHOTO PLACEHOLDER: swap this block for a real team / site photo */}
      <section className="container">
        <div style={{
          height: 340, borderRadius: 14, border: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13
        }}>
          [ Add photo: team or job-site image ]
        </div>
      </section>

      <CircuitDivider />

      <section className="container" style={{ padding: '60px 0' }}>
        <div className="eyebrow">How we work</div>
        <h2 style={{ fontSize: 28, marginTop: 12, marginBottom: 32 }}>Three things every client can count on</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {values.map((v) => (
            <div key={v.title} className="card">
              <h3 style={{ fontSize: 16.5, marginBottom: 10 }}>{v.title}</h3>
              <p style={{ fontSize: 14.5 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <CircuitDivider />

      {/* PHOTO PLACEHOLDER: gallery of past work */}
      <section className="container" style={{ padding: '60px 0' }}>
        <div className="eyebrow">Our work</div>
        <h2 style={{ fontSize: 28, marginTop: 12, marginBottom: 28 }}>Recent sites</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 180, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12.5
            }}>
              [ Add photo {i} ]
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
