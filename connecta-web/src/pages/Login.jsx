import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login/', form)
      const { access, refresh } = res.data

      // Fetch user profile
      const profileRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${access}` },
      })

      setAuth(profileRes.data, access, refresh)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Invalid username or password. Try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <h1 style={styles.logo}>Connecta</h1>
          <p style={styles.tagline}>Stay Close. No Matter the Distance.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
  },
  card: {
    background: '#1a1d27',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2e86ab',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  tagline: {
    color: '#666',
    fontSize: '13px',
    marginTop: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#aaa',
    fontSize: '13px',
    fontWeight: '500',
  },
  input: {
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: '#2d1b1b',
    border: '1px solid #5c2a2a',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ff6b6b',
    fontSize: '14px',
  },
  button: {
    background: '#2e86ab',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.2s',
  },
}