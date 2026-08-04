import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

// Admin user returned after successful PIN auth
const ADMIN_USER: PinUser = {
  id: "admin",
  name: "Admin",
  role: "admin",
};

const AUTH_STORAGE_KEY = "__goldwing_auth";

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
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PinUser | null>(readStoredAuth);

  const loginMutation = trpc.auth.loginPin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ authenticated: true, timestamp: Date.now() })
        );
        setUser(ADMIN_USER);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login failed. Please try again.");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    },
    onError: () => {
      // Even if server logout fails, clear client state
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    },
  });

  const login = useCallback(async (pin: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ pin: String(pin) });
      return true;
    } catch (err: any) {
      // If the error is a Zod validation error, it means the API isn't reachable
      // and the SPA rewrite is returning HTML instead of JSON
      const msg = err?.message || "Login failed";
      if (msg.includes("did not match") || msg.includes("expected pattern")) {
        toast.error("Authentication service unavailable. Please try again.");
      } else if (msg.includes("Invalid PIN")) {
        toast.error("Invalid PIN. Please try again.");
      } else {
        toast.error(msg);
      }
      return false;
    }
  }, [loginMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    try {
      logoutMutation.mutate();
    } catch {
      // silently ignore server logout errors
    }
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loginMutation.isPending,
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
