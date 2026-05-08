import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AlertDialog from "../../components/layout/alert_dialog";
import { register } from "@/account/authentication/auth";

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
                email: email.current?.value,
                password: password.current?.value,
                full_name: fullname.current?.value,
                username: username.current?.value
            });

            setIsLoading(false);

            if (response.ok) {
                setIsAlert('flex');
                setAlert({ message: data.message, type: 'success' });
                console.log(data)
               setTimeout(() => {
                    navigate('home/dashboard', { replace: true });
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

        <>
            <AlertDialog alert={{ message: alertInfo.message, type: alertInfo.type }} display={isAlert} setdisplay={setIsAlert} />

            <div className="login-cnt-auth">
                <div className="log-info-auth">
                    <h1>Sign Up</h1>
                    <p>Please Fill in the form below to continue</p>
                </div>

                <form ref={form} className="form" onSubmit={(e) => handleAuthentication(e)}>

                    <div>
                        <input ref={fullname} id="user-input" className="inp" placeholder="Enter Fullname" type="text" required />
                    </div>

                    <div>
                        <input ref={email} id="user-email" className="inp" placeholder="Enter Email Address" required type="email" />
                    </div>

                    <div>
                        <input ref={username} id="user-email" className="inp" placeholder="Enter Username" required type="text" />
                    </div>

                    <div>
                        <input ref={password} id="user-password" className="inp" placeholder="Password" type="password" required />
                    </div>

                    <div>
                        <button id="sub-btn" className={`sub-btn-auth ${isLoading ? 'loading-bg-2' : ''}`} type="submit" disabled={isLoading}>{isLoading ? 'Registering...' : 'Submit'}</button>
                    </div>

                </form>
            </div>
        </>
    )
}