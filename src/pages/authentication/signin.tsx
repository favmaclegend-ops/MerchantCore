import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AlertDialog from "../../components/layout/alert_dialog";
import { register } from "@/account/authentication/auth";

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
  color: '#0f172a',
  boxSizing: 'border-box',
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '20px',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  background: '#0f172a',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
}

export default function SigninPage() {

    const email = useRef<HTMLInputElement>(null);
    const username = useRef<HTMLInputElement>(null);
    const fullname = useRef<HTMLInputElement>(null);
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
            const { data, response } = await register({
                email: email.current!.value,
                password: password.current!.value,
                full_name: fullname.current!.value,
                username: username.current!.value
            });

            setIsLoading(false);

            if (response.ok) {
                setIsAlert('flex');
                setAlert({ message: data.message, type: 'success' });
                console.log(data)
               setTimeout(() => {
                    navigate('/verify-email', { replace: true });
                }, 1500);
                return;
            }

            setIsAlert('flex');
            console.log(data);
            setAlert({ message: data.detail, type: 'error' });
            return;
        }
        catch (e) {
            console.error(e);
        }
    }

    return (

        <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>

            <AlertDialog alert={{ message: alertInfo.message, type: alertInfo.type }} display={isAlert} setdisplay={setIsAlert} />

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Sign Up</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>Please fill in the form below to continue</p>
            </div>

            <form ref={form} onSubmit={(e) => handleAuthentication(e)}>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Full name</label>
                  <input ref={fullname} id="user-input" style={inputStyle} placeholder="Enter Fullname" type="text" required />
                </div>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Email address</label>
                  <input ref={email} id="user-email" style={inputStyle} placeholder="Enter Email Address" required type="email" />
                </div>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Username</label>
                  <input ref={username} id="user-email" style={inputStyle} placeholder="Enter Username" required type="text" />
                </div>

                <div style={fieldStyle}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Password</label>
                  <input ref={password} id="user-password" style={inputStyle} placeholder="Password" type="password" required />
                </div>

                <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.5 : 1 }} disabled={isLoading}>{isLoading ? 'Registering...' : 'Submit'}</button>

            </form>
        </div>
    )
}
