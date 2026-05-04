



export default function LoginPage() {

    return (
        <>
            <div className="login-cnt-auth">
                <div className="log-info-auth">
                    <h1>Login</h1>
                    <p>Please Enter your personal info</p>
                </div>

                <form className="form">

                    <div>
                        <input id="user-input" className="inp" placeholder="Username" required />
                    </div>

                    <div>
                        <input id="user-email" className="inp" placeholder="Email Address" required />
                    </div>

                    <div>
                        <input id="user-password" className="inp" placeholder="Password" type="password" required />
                    </div>

                </form>
            </div>
        </>
    )
}