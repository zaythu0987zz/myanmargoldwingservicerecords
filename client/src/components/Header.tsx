import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Coffee, LogOut, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-goldwing-dark text-white shadow-lg sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-goldwing-gold flex items-center justify-center">
            <Coffee className="w-6 h-6 text-goldwing-dark" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-goldwing-gold leading-tight">Goldwing</h1>
            <p className="text-xs text-gray-400 leading-tight">Service Records</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              location === "/" ? "text-goldwing-gold" : "text-gray-300 hover:text-white"
            }`}
          >
            Records
          </Link>
          <Link
            href="/new"
            className={`text-sm font-medium transition-colors ${
              location === "/new" ? "text-goldwing-gold" : "text-gray-300 hover:text-white"
            }`}
          >
            New Record
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              location === "/dashboard" ? "text-goldwing-gold" : "text-gray-300 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-300">{user?.name || "Admin"}</span>
                <span className="px-2 py-0.5 bg-goldwing-gold text-goldwing-dark text-xs font-bold rounded">
                  ADMIN
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-goldwing-gold hover:text-goldwing-gold-light transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-goldwing-darker border-t border-gray-700 px-4 py-4 space-y-3">
          <Link
            href="/"
            className="block text-gray-300 hover:text-white py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Records
          </Link>
          <Link
            href="/new"
            className="block text-gray-300 hover:text-white py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            New Record
          </Link>
          <Link
            href="/dashboard"
            className="block text-gray-300 hover:text-white py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <div className="border-t border-gray-700 pt-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-goldwing-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
