import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(13,12,16,0.85)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 74 }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, color: '#191307', fontSize: 15
          }}>TS</span>
          <span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>Tirth Electrical &amp; Services</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>Jalgaon</div>
          </span>
        </NavLink>

        <nav style={{ display: 'flex', gap: 28 }} className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({
                fontSize: 14.5,
                fontWeight: 500,
                color: isActive ? 'var(--amber)' : 'var(--text-dim)',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <>
              <NavLink to="/dashboard" style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                Hi, {user.fullName?.split(' ')[0]}
              </NavLink>
              <button className="btn btn-ghost" onClick={() => { logout(); navigate('/') }}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost">Log in</NavLink>
              <NavLink to="/signup" className="btn btn-primary">Sign up</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
