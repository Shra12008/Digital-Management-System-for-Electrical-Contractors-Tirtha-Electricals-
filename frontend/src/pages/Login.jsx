import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!form.email.trim()) return 'Email is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (!form.password) return 'Password is required.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await login(form)
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 90, paddingBottom: 90, maxWidth: 420 }}>
      <div className="eyebrow">Account</div>
      <h1 style={{ fontSize: 30, marginTop: 14, marginBottom: 28 }}>Log in</h1>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
        {error && (
          <div style={{ background: 'rgba(240,101,79,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13.5, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={labelStyle}>Password</label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              style={{ background: 'none', border: 'none', color: 'var(--amber)', fontSize: 12.5, cursor: 'pointer', padding: 0 }}
            >
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inputStyle, paddingRight: 66 }}
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {showForgot && (
            <p style={{ fontSize: 12.5, marginTop: 8, color: 'var(--text-dim)' }}>
              Password reset isn't set up yet — for now, reach out to your admin to reset your account.
            </p>
          )}
        </div>

        <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 6, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, textAlign: 'center' }}>
        Don't have an account? <NavLink to="/signup" style={{ color: 'var(--amber)' }}>Sign up</NavLink>
      </p>
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
