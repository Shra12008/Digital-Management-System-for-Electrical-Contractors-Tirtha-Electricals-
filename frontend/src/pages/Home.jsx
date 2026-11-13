import { NavLink } from 'react-router-dom'
import CircuitDivider from '../components/CircuitDivider.jsx'

const modules = [
  { title: 'Project Management', desc: 'Track every site from quote to handover — milestones, timelines and status in one place.' },
  { title: 'Labour & HR', desc: 'Assign crews to sites, track attendance, and manage labour records by role.' },
  { title: 'Billing & Invoicing', desc: 'Generate client invoices, track payments, and see outstanding dues at a glance.' },
  { title: 'Accounts & Finance', desc: 'Revenue, expenses and cash flow, rolled up from every active project.' },
  { title: 'Inventory', desc: 'Cable, panel and fixture stock across sites, with low-stock visibility.' },
  { title: 'Daily Work Logs', desc: 'Site supervisors log daily progress so nothing gets lost between visits.' },
]

const objectives = [
  { label: '01', title: 'Replace scattered paperwork', desc: 'Site registers, WhatsApp updates and Excel sheets, consolidated into one system of record.' },
  { label: '02', title: 'Give real-time site visibility', desc: 'Know which projects are active, on hold, or overdue without calling every supervisor.' },
  { label: '03', title: 'Tie money to work done', desc: 'Connect labour hours and material use directly to billing, so invoices match reality.' },
  { label: '04', title: 'Scale past one contractor\'s memory', desc: 'Make the business runnable by a team, not dependent on one person remembering everything.' },
]

const benefits = [
  'One dashboard instead of five spreadsheets',
  'Role-based access for admins, managers and crews',
  'Fewer billing disputes — work and invoices stay in sync',
  'Faster handoffs between office staff and site supervisors',
]

export default function Home() {
  return (
    <div>
      {/* ---- Hero ---- */}
      <section className="container" style={{ paddingTop: 90, paddingBottom: 60 }}>
        <div className="eyebrow">ERP for electrical contractors</div>
        <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 54px)', marginTop: 18, maxWidth: 820, lineHeight: 1.1 }}>
          One system to run every project, crew and invoice — built for how Tirth Electrical actually works.
        </h1>
        <p style={{ fontSize: 17, maxWidth: 600, marginTop: 20 }}>
          The Tirth Electrical &amp; Services ERP replaces scattered registers, WhatsApp updates and
          spreadsheets with one place to manage projects, labour, billing, accounts and inventory —
          from the office and from the site.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 32 }}>
          <NavLink to="/signup" className="btn btn-primary">Get started</NavLink>
          <NavLink to="/login" className="btn btn-ghost">Log in</NavLink>
        </div>
      </section>

      <CircuitDivider />

      {/* ---- Problem / introduction ---- */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="two-col">
          <div>
            <div className="eyebrow">The problem</div>
            <h2 style={{ fontSize: 26, marginTop: 12 }}>Electrical contracting runs on paper and memory</h2>
            <p style={{ marginTop: 14, fontSize: 15 }}>
              Tirth Electrical &amp; Services handles industrial, commercial and residential jobs across
              Jalgaon at the same time — each with its own crew, materials and billing schedule. As the
              business grew, tracking all of it through site registers, phone calls and Excel sheets
              started costing real time and money: missed labour hours, delayed invoices, and no single
              view of which projects actually need attention.
            </p>
          </div>
          <div>
            <div className="eyebrow">The solution</div>
            <h2 style={{ fontSize: 26, marginTop: 12 }}>A system built around the actual workflow</h2>
            <p style={{ marginTop: 14, fontSize: 15 }}>
              This ERP is built specifically for that workflow — not a generic project tool. Site
              supervisors log daily work, labour and material use roll up automatically, and office
              staff get one dashboard showing revenue, active projects, outstanding payments and crew
              status without chasing anyone for an update.
            </p>
          </div>
        </div>
      </section>

      <CircuitDivider />

      {/* ---- Agenda / objectives ---- */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div className="eyebrow">Project agenda</div>
        <h2 style={{ fontSize: 28, marginTop: 12, marginBottom: 36 }}>What this system sets out to do</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {objectives.map((o, i) => (
            <div key={o.label} style={{
              display: 'flex', gap: 24, padding: '22px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--amber)', minWidth: 32 }}>{o.label}</div>
              <div>
                <h3 style={{ fontSize: 16.5, marginBottom: 6 }}>{o.title}</h3>
                <p style={{ fontSize: 14.5, maxWidth: 560 }}>{o.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CircuitDivider />

      {/* ---- Modules ---- */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div className="eyebrow">System modules</div>
        <h2 style={{ fontSize: 28, marginTop: 12, marginBottom: 36 }}>Six modules, one shared dataset</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {modules.map((m) => (
            <div key={m.title} className="card">
              <h3 style={{ fontSize: 16.5, marginBottom: 10 }}>{m.title}</h3>
              <p style={{ fontSize: 14 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <CircuitDivider />

      {/* ---- Benefits ---- */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} className="two-col">
          <div>
            <div className="eyebrow">Why it helps</div>
            <h2 style={{ fontSize: 28, marginTop: 12 }}>Benefits, not just features</h2>
            <p style={{ marginTop: 14, fontSize: 15, maxWidth: 460 }}>
              The point isn't more software — it's fewer surprises. Every module exists to close a gap
              that used to cost the business time or money.
            </p>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {benefits.map((b) => (
              <li key={b} style={{ display: 'flex', gap: 12, fontSize: 15, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>›</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CircuitDivider />

      {/* ---- CTA ---- */}
      <section className="container" style={{ padding: '70px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, marginBottom: 14 }}>Ready to bring your projects into one system?</h2>
        <p style={{ maxWidth: 480, margin: '0 auto 28px' }}>
          Create an account to get started, or log in if your team is already set up.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <NavLink to="/signup" className="btn btn-primary">Create an account</NavLink>
          <NavLink to="/login" className="btn btn-ghost">Log in</NavLink>
        </div>
      </section>

      <CircuitDivider />

      {/* ---- Contact / info ---- */}
      <section className="container" style={{ padding: '64px 0' }}>
        <div className="eyebrow">Contact</div>
        <h2 style={{ fontSize: 26, marginTop: 12, marginBottom: 20 }}>Questions about the system</h2>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>Company</div>
            <p style={{ fontSize: 15 }}>Tirth Electrical &amp; Services, Jalgaon</p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>Email</div>
            <p style={{ fontSize: 15 }}>contact@tirthelectrical.example</p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>Phone</div>
            <p style={{ fontSize: 15 }}>+91 00000 00000</p>
          </div>
        </div>
      </section>
    </div>
  )
}
