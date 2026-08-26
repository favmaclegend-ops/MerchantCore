import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

type Mode = 'login' | 'register' | 'verify'

interface PendingRegistration {
  orgName: string
  email: string
  password: string
}

export default function OrganisationAuth() {
  const { orgLogin } = useContext(Authcontext)
  const [mode, setMode] = useState<Mode>('login')
  const [pending, setPending] = useState<PendingRegistration | null>(null)
  const [alertInfo, setAlert] = useState({ message: '', type: '' })
  const [isAlert, setIsAlert] = useState('none')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const orgNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const businessEmailRef = useRef<HTMLInputElement>(null)
  const superNameRef = useRef<HTMLInputElement>(null)
  const superUsernameRef = useRef<HTMLInputElement>(null)
  const superEmailRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)

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
      setTimeout(() => navigate(redirectTo ? decodeURIComponent(redirectTo) : '/home/dashboard', { replace: true }), 1500)
    } catch (err) {
      setIsLoading(false)
      const msg = (err as Error).message || 'Organisation login failed'
      if (msg.toLowerCase().includes('not been verified')) {
        setPending({
          orgName: orgNameRef.current!.value.trim(),
          email: emailRef.current!.value.trim(),
          password: passwordRef.current!.value,
        })
        setMode('verify')
        showAlert('Organisation not verified. Enter the code sent to your email.', 'invalid')
      } else {
        showAlert(msg, 'invalid')
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const password = passwordRef.current!.value
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'invalid')
      return
    }
    if (password !== confirmRef.current!.value) {
      showAlert('Passwords do not match', 'invalid')
      return
    }
    try {
      setIsLoading(true)
      const email = superEmailRef.current!.value.trim()
      await api.org.register({
        orgName: orgNameRef.current!.value,
        businessEmail: businessEmailRef.current!.value,
        superAdminName: superNameRef.current!.value,
        superAdminUsername: superUsernameRef.current!.value,
        superAdminEmail: email,
        password,
      })
      setIsLoading(false)
      setPending({ orgName: orgNameRef.current!.value.trim(), email, password })
      setMode('verify')
      showAlert('Organisation created. Check your email for the verification code.', 'success')
    } catch (err) {
      setIsLoading(false)
      showAlert((err as Error).message || 'Registration failed', 'invalid')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending) return
    const otp = otpRef.current!.value.trim()
    if (!otp) {
      showAlert('Enter the verification code from your email', 'invalid')
      return
    }
    try {
      setIsLoading(true)
      await api.org.verifyEmail(pending.email, otp)
      await orgLogin(pending.orgName, pending.email, pending.password)
      setIsLoading(false)
      showAlert('Organisation verified successfully', 'success')
      setTimeout(() => navigate(redirectTo ? decodeURIComponent(redirectTo) : '/home/dashboard', { replace: true }), 1500)
    } catch (err) {
      setIsLoading(false)
      showAlert((err as Error).message || 'Verification failed', 'invalid')
    }
  }

  const handleResend = async () => {
    if (!pending) return
    try {
      await api.org.resendVerification(pending.email)
      showAlert('Verification code resent. Check your inbox.', 'success')
    } catch (err) {
      showAlert((err as Error).message || 'Failed to resend the code', 'invalid')
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AlertDialog alert={{ message: alertInfo.message, type: alertInfo.type }} display={isAlert} setdisplay={setIsAlert} />

      {mode !== 'verify' && (
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
      )}

      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Organisation {mode === 'login' ? 'Login' : mode === 'verify' ? 'Verification' : 'Registration'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
            {mode === 'login'
              ? 'Sign in with your organisation workspace'
              : mode === 'verify'
                ? `Enter the 6-digit code sent to ${pending?.email ?? 'your email'}`
                : 'Set up your business workspace'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Organisation name</label>
              <input ref={orgNameRef} style={inputStyle} placeholder="e.g. Acme Foods" required />
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
        ) : mode === 'verify' ? (
          <form onSubmit={handleVerify}>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Verification code</label>
              <input ref={otpRef} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '18px' }} placeholder="000000" required inputMode="numeric" maxLength={6} />
            </div>
            <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.5 : 1 }} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & continue'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleResend}
                style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={fieldStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Organisation name</label>
              <input ref={orgNameRef} style={inputStyle} placeholder="e.g. Acme Foods" required />
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
              <input ref={passwordRef} style={inputStyle} placeholder="Min 8 characters" type="password" required />
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
