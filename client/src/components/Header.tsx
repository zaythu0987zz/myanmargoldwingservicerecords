import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LogIn } from "lucide-react";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="bg-beige border-b border-gray-200 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex flex-col items-start hover:opacity-90 transition-opacity">
          <span className="text-xl font-black tracking-wider text-goldwing-dark">GOLDWING</span>
          <span className="text-[10px] text-gray-500 tracking-wide">PRODUCTS INFORMATION &amp; AFTER SALES SERVICE</span>
        </Link>

        <nav className="flex items-center gap-4">
          {location !== "/history" && (
            <Link
              href="/history"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-goldwing-gold transition-colors"
            >
              History
            </Link>
          )}
          {location !== "/qr-scanner" && (
            <Link
              href="/qr-scanner"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-goldwing-gold transition-colors"
            >
              QR Scanner
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/form"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-goldwing-gold text-white text-sm font-medium rounded-lg hover:bg-goldwing-gold-dark transition-colors"
              >
                New Record
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-goldwing-gold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-goldwing-gold text-white text-sm font-medium rounded-lg hover:bg-goldwing-gold-dark transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Owner Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
