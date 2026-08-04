import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type PinUser = {
  id: string;
  name: string;
  role: "admin";
};

type AuthContextType = {
  user: PinUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(false);

  // Server-side login mutation for setting JWT cookie
  const loginMutation = trpc.auth.loginPin.useMutation();

  const login = useCallback(async (pin: string): Promise<boolean> => {
    if (pin !== VALID_PIN) {
      return false;
    }

    try {
      // Call server-side login to get JWT cookie set
      await loginMutation.mutateAsync({ pin });
    } catch {
      // If server login fails, still allow client-side auth
      // The server context has a fallback that allows admin access
      console.warn("Server login failed, using client-side auth fallback");
    }

    // Store auth in localStorage for client-side state
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ authenticated: true, timestamp: Date.now() })
    );
    setUser(ADMIN_USER);
    return true;
  }, [loginMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    // Call server logout to clear cookie
    try {
      trpc.auth.logout.useMutation().mutate();
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
