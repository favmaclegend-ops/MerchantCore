import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Authcontext } from "@/context/auth_context";
import AlertDialog from "../../components/layout/alert_dialog";
import { api } from "@/lib/api";
import { useContext } from "react";

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  border: '1px solid var(--border-input)',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '20px',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  background: 'var(--bg-nav-active)',
  color: 'var(--text-on-dark)',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  background: 'var(--bg-surface)',
  borderRadius: '12px',
  border: '1px solid var(--border-default)',
  padding: '32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
}

const navStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '6rem',
  background: 'var(--bg-surface)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  marginBottom: '24px',
}

type Mode = 'login' | 'register'

export default function OrganisationAuth() {
  const { orgLogin } = useContext(Authcontext)
  const [mode, setMode] = useState<Mode>('login')
  const [alertInfo, setAlert] = useState({ message: '', type: '' })
  const [isAlert, setIsAlert] = useState('none')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const orgNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const businessEmailRef = useRef<HTMLInputElement>(null)
  const superNameRef = useRef<HTMLInputElement>(null)
  const superUsernameRef = useRef<HTMLInputElement>(null)
  const superEmailRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const showAlert = (message: string, type: string) => {
    setIsAlert('flex')
    setAlert({ message, type })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      await orgLogin(orgNameRef.current!.value, emailRef.current!.value, passwordRef.current!.value)
      setIsLoading(false)
      showAlert('Login Successful', 'success')
      setTimeout(() => navigate('/home/dashboard', { replace: true }), 1500)
    } catch (err) {
      setIsLoading(false)
      showAlert((err as Error).message || 'Organisation login failed', 'invalid')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const password = passwordRef.current!.value
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'invalid')
      return
    }
    if (password !== confirmRef.current!.value) {
      showAlert('Passwords do not match', 'invalid')
      return
    }
    try {
      setIsLoading(true)
      await api.org.register({
        orgName: orgNameRef.current!.value,
        businessEmail: businessEmailRef.current!.value,
        superAdminName: superNameRef.current!.value,
        superAdminUsername: superUsernameRef.current!.value,
        superAdminEmail: superEmailRef.current!.value,
        password,
      })
      await orgLogin(orgNameRef.current!.value, superEmailRef.current!.value, password)
      setIsLoading(false)
      showAlert('Organisation created successfully', 'success')
      setTimeout(() => navigate('/home/dashboard', { replace: true }), 1500)
    } catch (err) {
      setIsLoading(false)
      showAlert((err as Error).message || 'Registration failed', 'invalid')
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AlertDialog alert={{ message: alertInfo.message, type: alertInfo.type }} display={isAlert} setdisplay={setIsAlert} />

      <nav style={navStyle}>
        <button
          onClick={() => setMode('login')}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem',
            padding: '8px 40px', color: mode === 'login' ? 'var(--bg-surface)' : 'var(--text-muted)',
            background: mode === 'login' ? 'var(--bg-nav-active)' : 'transparent', cursor: 'pointer', fontWeight: 500,
            transition: 'background .3s ease',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setMode('register')}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem',
            padding: '8px 40px', color: mode === 'register' ? 'var(--bg-surface)' : 'var(--text-muted)',
            background: mode === 'register' ? 'var(--bg-nav-active)' : 'transparent', cursor: 'pointer', fontWeight: 500,
            transition: 'background .3s ease',
          }}
        >
          Register
        </button>
      </nav>

      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Organisation {mode === 'login' ? 'Login' : 'Registration'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
            {mode === 'login'
              ? 'Sign in with your organisation workspace'
              : 'Set up your business workspace'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Organisation name</label>
              <input ref={orgNameRef} style={inputStyle} placeholder="e.g. Sunrise Mart" required />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Email or username</label>
              <input ref={emailRef} style={inputStyle} placeholder="Email Address" required type="email" />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Password</label>
              <input ref={passwordRef} style={inputStyle} placeholder="Password" type="password" required />
            </div>
            <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.5 : 1 }} disabled={isLoading}>
              {isLoading ? 'Validating...' : 'Submit'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Organisation name</label>
              <input ref={orgNameRef} style={inputStyle} placeholder="e.g. Sunrise Mart" required />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Business email</label>
              <input ref={businessEmailRef} style={inputStyle} placeholder="business@company.com" required type="email" />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Super admin full name</label>
              <input ref={superNameRef} style={inputStyle} placeholder="Full name" required />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Super admin username</label>
              <input ref={superUsernameRef} style={inputStyle} placeholder="Username" required />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Super admin email</label>
              <input ref={superEmailRef} style={inputStyle} placeholder="you@company.com" required type="email" />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Password</label>
              <input ref={passwordRef} style={inputStyle} placeholder="Min 6 characters" type="password" required />
            </div>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Confirm password</label>
              <input ref={confirmRef} style={inputStyle} placeholder="Re-enter password" type="password" required />
            </div>
            <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.5 : 1 }} disabled={isLoading}>
              {isLoading ? 'Creating workspace...' : 'Create organisation'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
