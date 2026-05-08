import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom";
import AlertDialog from "../../components/layout/alert_dialog";
import { login } from "@/account/authentication/auth";



export default function LoginPage() {

   
    const email = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);
    const form = useRef<HTMLFormElement>(null);
    const [alertInfo, setAlert] = useState({message: '', type: ''});
    const [isAlert, setIsAlert] = useState('none');
    const [isLoading, setIsLoading] = useState(false);

   // const navigate = useNavigate();

    login
    
    const handleAuthentication = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        setIsLoading(true);
        const data = await login({email: email.current?.value, password: password.current?.value});
        setIsLoading(false);
        console.log(data);

    }
    
    return (
        <>

        <AlertDialog alert={{message: alertInfo.message, type: alertInfo.type}} display={isAlert} setdisplay={setIsAlert}/>

            <div className="login-cnt-auth">
                <div className="log-info-auth">
                    <h1>Login</h1>
                    <p>Please Enter your personal info</p>
                </div>

                <form ref={form} className="form" onSubmit={(e) => handleAuthentication(e)}>

                    <div>
                        <input ref={email} id="user-email" className="inp" placeholder="Email Address" required type="email" />
                    </div>

                    <div>
                        <input ref={password} id="user-password" className="inp" placeholder="Password" type="password" required />
                    </div>

                    <div>
                        <button id="sub-btn" className={`sub-btn-auth ${isLoading ? 'loading-bg-2' : ''}`} type="submit" disabled={isLoading}>{isLoading ? 'Validating...' : 'Submit'}</button>
                    </div>

                </form>
            </div>
        </>
    )
}