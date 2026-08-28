import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import LoginPage from "./login";
import SigninPage from "./signin";
import OrganisationAuth from "./OrganisationAuth";
import { Authcontext } from "@/context/auth_context";

const tabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem',
  padding: '8px 48px', color: active ? 'var(--bg-surface)' : 'var(--text-muted)',
  background: active ? 'var(--bg-nav-active)' : 'transparent', cursor: 'pointer', fontWeight: 500,
  transition: 'background .3s ease',
})

export default function DefaultPage() {

    const { user, orgUser, loading } = useContext(Authcontext)
    const [isPage, setPage] = useState<string>('login');
    const [isOrg, setIsOrg] = useState(false);

    const handlePage = (page: string) => {
        setPage(page);
    }

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>
    }

    if (user || orgUser) {
        return <Navigate to="/home/dashboard" replace />
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', background: 'var(--bg-tertiary)', padding: '24px' }}>
            <div style={{ margin: 'auto 0', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center',  }}>
                {isOrg ? (
                    <>
                        <OrganisationAuth />
                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-placeholder)', marginTop: '16px', marginBottom: 0 }}>
                            Back to personal account?{' '}
                            <button onClick={() => setIsOrg(false)} style={{ color: 'var(--text-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Log in as a person</button>
                        </p>
                    </>
                ) : (
                    <>
                        <nav style={{ padding: '6px', borderRadius: '6rem', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
                            <button style={tabStyle(isPage === 'login')} onClick={() => handlePage('login')}>Login</button>
                            <button style={tabStyle(isPage === 'signin')} onClick={() => handlePage('signin')}>Sign up</button>
                        </nav>
                        {
                            isPage === 'login' ?
                            <LoginPage />
                            :
                            <SigninPage />
                        }
                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-placeholder)', marginTop: '16px', marginBottom: 0 }}>
                            Running a business?{' '}
                            <button onClick={() => setIsOrg(true)} style={{ color: 'var(--text-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Log in as an organisation</button>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
