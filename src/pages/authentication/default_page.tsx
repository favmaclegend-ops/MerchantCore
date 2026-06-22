import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import LoginPage from "./login";
 import SigninPage from "./signin";
import { Authcontext } from "@/context/auth_context";

export default function DefaultPage() {

    const { user, loading } = useContext(Authcontext)
    const [isPage, setPage] = useState<string>('login');

    const handlePage: Function = (page: string) => {
        setPage(page);
    }

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '14px' }}>Loading...</div>
    }

    if (user) {
        return <Navigate to="/home/dashboard" replace />
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', padding: '24px' }}>
            <nav style={{ padding: '6px', borderRadius: '6rem', background: '#d4d4d4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
                <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem', padding: '8px 48px', color: isPage === 'login' ? 'var(--bg-surface)' : 'gray', background: isPage === 'login' ? 'var(--bg-nav-active)' : 'transparent', cursor: 'pointer', fontWeight: 500, transition: 'background .3s ease' }} onClick={() => handlePage('login')}>Login</button>
                <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem', padding: '8px 48px', color: isPage === 'signin' ? 'var(--bg-surface)' : 'gray', background: isPage === 'signin' ? 'var(--bg-nav-active)' : 'transparent', cursor: 'pointer', fontWeight: 500, transition: 'background .3s ease' }} onClick={() => handlePage('signin')}>Sign up</button>
            </nav>
            {
                isPage === 'login' ?
                <LoginPage />
                :
                <SigninPage />
            }
        </div>
    )
}
