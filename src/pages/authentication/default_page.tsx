import LoginPage from "./login";






export default function DefaultPage() {

    return (
        <>
            <div className="default-page-auth">
                <nav className="log-sig-cnt-btn-auth">
                    <button className="active">Login</button>
                    <button>signin</button>
                </nav>
                <LoginPage />
            </div>
        </>
    )
}