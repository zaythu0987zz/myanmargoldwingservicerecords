import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <img
            src="/logo.png"
            alt="Myanmar Gold Wing Ltd."
            className="h-12 w-auto object-contain sm:h-14 md:h-16"
            style={{ imageRendering: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e85d04] text-white text-sm font-semibold rounded-lg hover:bg-[#d4520a] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e85d04] text-white text-sm font-semibold rounded-lg hover:bg-[#d4520a] transition-colors"
            >
              Owner Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
