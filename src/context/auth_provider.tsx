
import { Authcontext } from "./auth_context";


export default function AuthProvider({ children }) {
    const isLogin = localStorage.getItem('login');

    return (
        <Authcontext.Provider value = {{ isLogin }} >
            {children}
        </Authcontext.Provider>
    )
}