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

const PIN_STORAGE_KEY = "__goldwing_pin";

// Admin user returned after successful PIN auth
const ADMIN_USER: PinUser = {
  id: "admin",
  name: "Admin",
  role: "admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PinUser | null>(() => {
    // Check localStorage for existing PIN session
    if (typeof window !== "undefined") {
      const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
      if (storedPin) return ADMIN_USER;
    }
    return null;
  });

  const loginMutation = trpc.auth.loginPin.useMutation({
    onSuccess: () => {
      localStorage.setItem(PIN_STORAGE_KEY, "authenticated");
      setUser(ADMIN_USER);
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem(PIN_STORAGE_KEY);
      setUser(null);
    },
  });

  const login = useCallback(async (pin: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ pin });
      return true;
    } catch {
      return false;
    }
  }, [loginMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loginMutation.isPending || logoutMutation.isPending,
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
