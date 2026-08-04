import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Clock, FileText, ArrowRight, ArrowUpRight } from "lucide-react";

function SectionCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-goldwing-gold/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-goldwing-gold" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function HowItWorksStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-goldwing-gold text-white flex items-center justify-center font-bold text-lg">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-beige">
      <Header />

      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Service Record Management System
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Track and manage all your appliance repairs and service records in one place
          </p>
        </div>

        {/* Three Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <SectionCard
            icon={Clock}
            title="View Records"
            description="Browse all service records with search and filter capabilities"
          />
          <SectionCard
            icon={FileText}
            title="Features"
            description="Cloud Database, Search & Filter, QR Codes, Mobile Friendly"
          />
          <SectionCard
            icon={ArrowUpRight}
            title="Owner Access"
            description="Login to create, edit, and manage service records"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/history">
            <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-goldwing-gold text-goldwing-gold rounded-lg font-medium hover:bg-goldwing-gold hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
              View All Records
            </button>
          </Link>
          <Link href={isAuthenticated ? "/form" : "/login"}>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-goldwing-gold text-white rounded-lg font-medium hover:bg-goldwing-gold-dark transition-colors">
              Owner Login
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white border-t border-gray-200 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="max-w-2xl mx-auto space-y-8">
            <HowItWorksStep
              number={1}
              title="Create Records"
              description="Owner logs in with PIN and creates detailed service records with all product and customer information"
            />
            <HowItWorksStep
              number={2}
              title="Cloud Storage"
              description="All records are securely stored in the cloud database and accessible from any device"
            />
            <HowItWorksStep
              number={3}
              title="Public Access"
              description="Anyone can view and search service records without login for transparency"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-beige border-t border-gray-200 py-8">
        <div className="container text-center">
          <p className="text-sm font-bold text-gray-700">GOLDWING — Service Record Management System</p>
          <p className="text-xs text-gray-400 mt-2">Made with ZLP</p>
        </div>
      </footer>
    </div>
  );
}
