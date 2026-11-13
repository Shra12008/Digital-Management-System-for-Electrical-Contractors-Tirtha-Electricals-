import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function validate() {
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) return 'Enter a valid phone number.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
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
      await signup(form)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 90, paddingBottom: 90, maxWidth: 420 }}>
      <div className="eyebrow">Account</div>
      <h1 style={{ fontSize: 30, marginTop: 14, marginBottom: 28 }}>Create an account</h1>

      {success ? (
        <div className="card" style={{ borderColor: 'var(--teal)' }}>
          <h3 style={{ color: 'var(--teal)', marginBottom: 8, fontSize: 16 }}>Account created</h3>
          <p style={{ fontSize: 14.5 }}>Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          {error && (
            <div style={{ background: 'rgba(240,101,79,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 12px', fontSize: 13.5, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle} type="text" required value={form.fullName} onChange={update('fullName')} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" required value={form.email} onChange={update('email')} />
          </div>
          <div>
            <label style={labelStyle}>Phone (optional)</label>
            <input style={inputStyle} type="tel" value={form.phone} onChange={update('phone')} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 66 }}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={update('password')}
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
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>At least 8 characters.</div>
          </div>
          <div>
            <label style={labelStyle}>Confirm password</label>
            <input
              style={inputStyle}
              type={showPassword ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 6, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 20, fontSize: 14, textAlign: 'center' }}>
        Already have an account? <NavLink to="/login" style={{ color: 'var(--amber)' }}>Log in</NavLink>
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
