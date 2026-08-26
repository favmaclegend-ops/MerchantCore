import { useCallback, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Authcontext } from "@/context/auth_context";

export function useRequireAuth() {
  const { user, orgUser } = useContext(Authcontext);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!user || !!orgUser;

  const requireAuth = useCallback(
    () => {
      if (isLoggedIn) return true;
      const returnTo = encodeURIComponent(location.pathname + location.hash);
      navigate(`/?redirect=${returnTo}`, { replace: true });
      return false;
    },
    [isLoggedIn, navigate, location],
  );

  return { isLoggedIn, requireAuth };
}
