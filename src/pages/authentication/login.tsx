import { logData } from "@/account/data/login_data";
import { useRef } from "react"
import { useNavigate } from "react-router-dom";



export default function LoginPage() {

    const username = useRef<HTMLInputElement>(null);
    const email = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const form = useRef<HTMLFormElement>(null);

    const { userDatabase } = logData();
    const navigate = useNavigate();

    const key = username.current?.value;

    const handleAuthentication = (e: Event) => {
        e.preventDefault();

        if (userDatabase[`${key}`]) {
            if (email.current?.value === userDatabase[`${key}`].email &&
                password.current?.value === userDatabase[`${key}`].password
            ) {
                navigate('/home/dashboard', { replace: true });
            }
            else {
                alert('invalid Credential');
            }
        }
        else {
            alert('invalid Credential');
        }
    }

    return (
        <>
            <div className="login-cnt-auth">
                <div className="log-info-auth">
                    <h1>Login</h1>
                    <p>Please Enter your personal info</p>
                </div>

                <form ref={form} className="form" onSubmit={(e) => handleAuthentication(e)}>

                    <div>
                        <input ref={username} id="user-input" className="inp" placeholder="Username" type="text" required />
                    </div>

                    <div>
                        <input ref={email} id="user-email" className="inp" placeholder="Email Address" required type="email" />
                    </div>

                    <div>
                        <input ref={password} id="user-password" className="inp" placeholder="Password" type="password" required />
                    </div>

                    <div>
                        <button id="sub-btn" className="sub-btn-auth" type="submit">Submit</button>
                    </div>

                </form>
            </div>
        </>
    )
}