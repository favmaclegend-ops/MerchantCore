import { useEffect, useState, type ReactNode } from "react";
import { Authcontext } from "./auth_context";
import { api } from "@/lib/api";
import { clearOrgSession, getOrgSession, setOrgSession, validateOrgSession, type OrgMember } from "@/data/organisations";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orgUser, setOrgUser] = useState<OrgMember | null>(() => validateOrgSession(getOrgSession())?.member ?? null);
  const [orgName, setOrgName] = useState<string | null>(() => validateOrgSession(getOrgSession())?.orgName ?? null);
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
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password);
    localStorage.setItem('token', access_token);
    localStorage.setItem('login', 'true');
    const profile = await api.getProfile();
    setUser(profile);
    clearOrgSession();
  };

  const orgLogin = async (organisationName: string, email: string, password: string) => {
    const { org, member, token } = await api.org.login(organisationName, email, password);
    setOrgSession({ orgId: org.id, orgName: org.name, member, token });
    localStorage.setItem('login', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('org_dashboard_cache');
    setOrgUser(member);
    setOrgName(org.name);
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('login');
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('org_dashboard_cache');
    clearOrgSession();
    setUser(null);
    setOrgUser(null);
    setOrgName(null);
  };

  return (
    <Authcontext.Provider value={{ user, orgUser, orgName, loading, login, orgLogin, logout }}>
      {children}
    </Authcontext.Provider>
  );
}
