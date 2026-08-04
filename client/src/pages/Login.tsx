import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    const success = await login(pin.trim());
    if (success) {
      toast.success("Login successful!");
      navigate("/");
    } else {
      toast.error("Invalid PIN. Please try again.");
      setPin("");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf6f1]">
      <Header />

      <div className="container py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Orange header bar */}
            <div className="h-2 bg-[#e85d04]" />

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Owner Login</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Enter PIN
                  </label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-lg tracking-widest"
                    autoFocus
                    maxLength={10}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#e85d04] hover:bg-[#d4520a] text-white font-semibold py-3"
                  disabled={!pin.trim() || isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <p className="text-sm text-gray-500 text-center mb-3">Want to view service records?</p>
                <Link href="/history">
                  <Button variant="outline" className="w-full">
                    View Records (Public)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        Made with ZLP
      </footer>
    </div>
  );
}
