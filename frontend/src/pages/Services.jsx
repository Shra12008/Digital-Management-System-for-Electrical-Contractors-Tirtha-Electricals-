const services = [
  {
    title: 'Industrial Wiring',
    desc: 'Panel installation, feeder and distribution wiring, load balancing, and full-plant electrical layouts for factories and warehouses.',
    points: ['LT/HT panel installation', 'Motor and machine wiring', 'Earthing and lightning protection'],
  },
  {
    title: 'Commercial Fit-outs',
    desc: 'Complete electrical fit-outs for offices, retail stores and hospitality spaces, coordinated with your interior timeline.',
    points: ['DB and sub-metering setup', 'Lighting design and layout', 'Fire and safety compliance wiring'],
  },
  {
    title: 'Residential Electrical',
    desc: 'New home wiring, rewiring of older houses, safety audits, and modern fittings including basic smart-home setups.',
    points: ['Concealed and surface wiring', 'MCB/DB upgrades', 'Safety inspection reports'],
  },
  {
    title: 'Maintenance & AMC',
    desc: 'Scheduled annual maintenance contracts so faults get caught before they cause downtime.',
    points: ['Quarterly site inspections', 'Priority emergency response', 'Maintenance logs and reporting'],
  },
]

export default function Services() {
  return (
    <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <div className="eyebrow">Services</div>
      <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', marginTop: 16, maxWidth: 640 }}>
        What we handle on-site
      </h1>
      <p style={{ marginTop: 16, maxWidth: 560, fontSize: 16 }}>
        Every job starts with a site survey. Scope and materials are agreed in writing before any wire goes up.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 44 }}>
        {services.map((s) => (
          <div key={s.title} className="card">
            <h2 style={{ fontSize: 19, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 14.5, marginBottom: 16 }}>{s.desc}</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.points.map((p) => (
                <li key={p} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>›</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
