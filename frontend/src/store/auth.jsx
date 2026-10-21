import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthCtx = createContext(null);

function decodeJwtRole(token) {
  try { return JSON.parse(atob(token.split(".")[1])).role || null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setRole(decodeJwtRole(token));
    } else {
      delete api.defaults.headers.common.Authorization;
      setRole(null);
    }
  }, [token]);

  const value = useMemo(() => ({
      isAuthed: !!token,
      role: role,
      isIRB: role === 'irb_officer' || role === 'admin',
      isCommittee: role === 'committee' || role === 'admin',
      isPI: role === 'pi',
      isAssistant: role === 'assistant',
      isAdmin: role === 'admin',
      login: (t) => { localStorage.setItem("token", t); setToken(t); },
      logout: () => { localStorage.removeItem("token"); setToken(null); },
    }), [token, role]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);