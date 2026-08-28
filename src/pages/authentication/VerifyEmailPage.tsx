import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { verifyEmail, resendVerification } from "@/account/authentication/auth";

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

const resendButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-input)',
}

function extractSeconds(detail: string): number | null {
  const match = detail.match(/(\d+)\s*seconds?/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function VerifyEmailPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const pendingEmail = sessionStorage.getItem('pending_verify_email');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resolveEmail = (): string | null => {
    const enteredEmail = emailRef.current!.value;
    if (pendingEmail && enteredEmail !== pendingEmail) {
      setError('Email does not match the address the code was sent to.');
      return null;
    }
    return enteredEmail;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const enteredEmail = resolveEmail();
    if (!enteredEmail) {
      setLoading(false);
      return;
    }

    const { data, response } = await verifyEmail(enteredEmail, otpRef.current!.value);
    setLoading(false);

    if (response.ok) {
      sessionStorage.removeItem('pending_verify_email');
      setMessage(data.message);
      setVerified(true);
      setTimeout(() => navigate('/', { replace: true }), 2500);
    } else {
      setError(data.detail || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setMessage('');
    setError('');
    const enteredEmail = resolveEmail();
    if (!enteredEmail) return;

    setResending(true);
    const { data, response } = await resendVerification(enteredEmail);
    setResending(false);

    if (response.ok) {
      setCooldown(60);
      setMessage(data.message);
      return;
    }

    const detail = data.detail || 'Failed to resend verification code';
    const seconds = extractSeconds(detail);
    if (seconds) setCooldown(seconds);
    setError(detail);
  };

  return (
    <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Verify Email</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>Enter the code sent to your email</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Email address</label>
          <input ref={emailRef} type="email" style={inputStyle} placeholder="you@example.com" required defaultValue={pendingEmail ?? ''} />
        </div>

        <div style={fieldStyle}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Verification code</label>
          <input ref={otpRef} type="text" style={{ ...inputStyle, letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }} placeholder="000000" maxLength={6} required />
        </div>

        {message && (
          <div style={{ marginBottom: '20px', padding: '12px 14px', background: 'var(--bg-success)', border: '1px solid var(--border-success)', borderRadius: '10px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-success)', margin: 0 }}>{message}</p>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 14px', background: 'var(--bg-danger)', border: '1px solid var(--border-danger)', borderRadius: '10px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-danger)', margin: 0 }}>{error}</p>
          </div>
        )}

        {!verified && (
          <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.5 : 1 }} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        )}
      </form>

      {!verified && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            style={{ ...resendButtonStyle, opacity: cooldown > 0 || resending ? 0.5 : 1 }}
            disabled={cooldown > 0 || resending || loading}
            onClick={handleResend}
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </button>
        </div>
      )}

      {verified && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-default)' }}>
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Redirecting to{' '}
            <Link to="/" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      )}
    </div>
  );
}
