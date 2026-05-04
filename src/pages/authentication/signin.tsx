




export default function SigninPage() {

    return (
        <>
            <div className="login-cnt-auth">
                <div className="log-info-auth">
                    <h1>Sign in</h1>
                    <p>Please Fill in the form below to continue</p>
                </div>

                <form className="form">

                    <div>
                        <input id="user-input" className="inp" placeholder="Enter Fullname" type="text" required />
                    </div>

                    <div>
                        <input id="user-email" className="inp" placeholder="Enter Email Address" required type="email" />
                    </div>

                    <div>
                        <input id="user-email" className="inp" placeholder="Enter Username" required type="email" />
                    </div>

                    <div>
                        <input id="user-password" className="inp" placeholder="Password" type="password" required />
                    </div>

                    <div>
                        <button id="sub-btn" className="sub-btn-auth" type="submit">Submit</button>
                    </div>

                </form>
            </div>
        </>
    )
}