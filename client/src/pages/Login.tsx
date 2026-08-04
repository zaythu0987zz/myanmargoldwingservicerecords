import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");

  // If already logged in, redirect to home
  if (isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error("Please enter a PIN");
      return;
    }

    const success = await login(pin.trim());
    if (success) {
      toast.success("Login successful!");
      navigate("/");
    }
    // If login fails, the error toast is already shown by AuthContext's onError
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-goldwing-gold flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-goldwing-dark" />
          </div>
          <CardTitle className="text-2xl text-goldwing-dark">Goldwing</CardTitle>
          <CardDescription>Enter your PIN to access the service record system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                PIN Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10 text-lg tracking-widest"
                  autoFocus
                  maxLength={10}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-goldwing-gold hover:bg-goldwing-gold-dark text-white"
              disabled={isLoading || !pin.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
