import { useState } from "react";
import LoginPage from "./login";
import SigninPage from "./signin";

export default function DefaultPage() {

    const [isPage, setPage] = useState<string>('login');

    const handlePage: Function = (page: string) => {
        setPage(page);
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '24px' }}>
            <nav style={{ padding: '6px', borderRadius: '6rem', background: '#d4d4d4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
                <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem', padding: '8px 48px', color: isPage === 'login' ? '#fff' : 'gray', background: isPage === 'login' ? '#0f172a' : 'transparent', cursor: 'pointer', fontWeight: 500, transition: 'background .3s ease' }} onClick={() => handlePage('login')}>Login</button>
                <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', borderRadius: '2rem', padding: '8px 48px', color: isPage === 'signin' ? '#fff' : 'gray', background: isPage === 'signin' ? '#0f172a' : 'transparent', cursor: 'pointer', fontWeight: 500, transition: 'background .3s ease' }} onClick={() => handlePage('signin')}>Sign up</button>
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
