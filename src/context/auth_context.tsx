import { createContext } from "react";

interface AuthContextType {
  isLogin: string | null;
}

export const Authcontext = createContext<AuthContextType | null>(null);
