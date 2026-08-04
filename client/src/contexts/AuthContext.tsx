import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PinUser = {
  id: string;
  name: string;
  role: "admin";
};

type AuthContextType = {
  user: PinUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The valid PIN code — validated client-side
const VALID_PIN = "191995";

const AUTH_STORAGE_KEY = "__goldwing_auth";

// Admin user returned after successful PIN auth
const ADMIN_USER: PinUser = {
  id: "admin",
  name: "Admin",
  role: "admin",
};

function readStoredAuth(): PinUser | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.authenticated === true) {
        return ADMIN_USER;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PinUser | null>(readStoredAuth);

  const login = useCallback((pin: string): boolean => {
    if (pin === VALID_PIN) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ authenticated: true, timestamp: Date.now() })
      );
      setUser(ADMIN_USER);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
