import { createContext } from "react";
import type { OrgMember } from "@/data/organisations";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  orgUser: OrgMember | null;
  orgName: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  orgLogin: (orgName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const Authcontext = createContext<AuthContextType>({
  user: null,
  orgUser: null,
  orgName: null,
  loading: true,
  login: async () => {},
  orgLogin: async () => {},
  logout: () => {},
});
