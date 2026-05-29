import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearSession, loadSession, saveSession } from "../lib/auth-storage";
import { adminApi } from "../services/admin-api";
import type { User, UserRole } from "../types/api";

const ALLOWED: UserRole[] = ["ADMIN", "MANAGER", "STOCK"];

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user as User);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await adminApi.login(email.trim().toLowerCase(), password);
    if (!ALLOWED.includes(res.user.role)) {
      throw new Error("Este painel é para Admin, Gerente ou Estoque. Técnicos usam o app mobile.");
    }
    saveSession(res.token, res.user);
    setUser(res.user);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}

export function useCanAccess(roles: UserRole[]) {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
}
