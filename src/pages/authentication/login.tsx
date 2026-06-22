import { useContext, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";
import AlertDialog from "../../components/layout/alert_dialog";
import { Authcontext } from "@/context/auth_context";

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
  color: 'var(--bg-surface)',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
}

export default function LoginPage() {

    const { login: authLogin } = useContext(Authcontext)
    const email = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const form = useRef<HTMLFormElement>(null);
    const [alertInfo, setAlert] = useState({ message: '', type: '' });
    const [isAlert, setIsAlert] = useState('none');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuthentication = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setIsLoading(true);
            await authLogin(email.current!.value, password.current!.value);
            setIsLoading(false);
            setIsAlert('flex');
            setAlert({ message: 'Login Successful', type: 'success' });
            setTimeout(() => {
                navigate('/home/dashboard', {replace: true});
            }, 1500);
        }
        catch (e: any) {
            setIsLoading(false);
            setIsAlert('flex');
            const msg = e?.message || 'Login failed';
            setAlert({ message: msg, type: 'invalid' });
        }
    }

    return (
        <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>

            <AlertDialog alert={{ message: alertInfo.message, type: alertInfo.type }} display={isAlert} setdisplay={setIsAlert} />

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Login</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>Please enter your personal info</p>
            </div>

            <form ref={form} onSubmit={(e) => handleAuthentication(e)}>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Email address</label>
                  <input ref={email} id="user-email" style={inputStyle} placeholder="Email Address" required type="email" />
                </div>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '8px' }}>Password</label>
                  <input ref={password} id="user-password" style={inputStyle} placeholder="Password" type="password" required />
                </div>

                <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.5 : 1 }} disabled={isLoading}>{isLoading ? 'Validating...' : 'Submit'}</button>

            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-placeholder)', marginTop: '16px', marginBottom: 0 }}>
              Didn&apos;t get a code?{' '}
              <a href="/verify-email" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>Verify your email</a>
            </p>
        </div>
    )
}
