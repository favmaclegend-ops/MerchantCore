import type { ReactNode } from "react";
import { Authcontext } from "./auth_context";

export default function AuthProvider({ children }: { children: ReactNode }) {
    const isLogin = localStorage.getItem('login');

    return (
        <Authcontext.Provider value={{ isLogin }}>
            {children}
        </Authcontext.Provider>
    )
}