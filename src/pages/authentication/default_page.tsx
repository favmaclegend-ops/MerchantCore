import { useState } from "react";
import LoginPage from "./login";
import SigninPage from "./signin";






export default function DefaultPage() {

    const [isPage, setPage] = useState<string>('login');

    const handlePage: Function = (page: string) => {
        setPage(page);
    }

    return (
        <>
            <div className="default-page-auth">
                <nav className="log-sig-cnt-btn-auth">
                    <button className={isPage === 'login' ? 'active' : ''} onClick={() => handlePage('login')}>Login</button>
                    <button className={isPage === 'signin' ? 'active' : ''} onClick={() => handlePage('signin')}>signin</button>
                </nav>
                {
                    isPage === 'login' ?
                    <LoginPage />
                    :
                    <SigninPage />
                }
            </div>
        </>
    )
}