import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-goldwing-gold mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <a className="px-6 py-3 bg-goldwing-gold text-white rounded-lg hover:bg-goldwing-gold-dark transition-colors">
            Go Home
          </a>
        </Link>
      </div>
    </div>
  );
}
