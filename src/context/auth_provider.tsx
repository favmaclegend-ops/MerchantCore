import { useEffect, useState, type ReactNode } from "react";
import { Authcontext } from "./auth_context";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then(profile => setUser(profile))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('login');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password);
    localStorage.setItem('token', access_token);
    localStorage.setItem('login', 'true');
    const profile = await api.getProfile();
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('login');
    setUser(null);
  };

  return (
    <Authcontext.Provider value={{ user, loading, login, logout }}>
      {children}
    </Authcontext.Provider>
  );
}
