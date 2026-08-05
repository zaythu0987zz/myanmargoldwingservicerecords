import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Clock, Plus, BarChart3, FileText, LogIn } from "lucide-react";

function InfoCard({ icon: Icon, title, description, isFeatureList, features }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  isFeatureList?: boolean;
  features?: string[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-[#e85d04]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#e85d04]" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {isFeatureList && features ? (
        <ul className="text-sm text-gray-500 leading-relaxed space-y-0.5">
          {features.map((f) => (
            <li key={f}>&bull; {f}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

function HowItWorksStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-lg">
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
    <div className="min-h-screen bg-[#faf6f1]">
      <Header />

      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Service Record Management System
          </h1>
          <p className="text-lg text-gray-500">
            Track and manage all your appliance repairs and service records in one place
          </p>
        </div>

        {/* Main Grid: 4 cards + login status */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-10">
          {/* Left column: Login status */}
          <div className="md:col-span-1">
            {isAuthenticated ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Owner Access</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Full access to edit, delete, and manage records</p>
              </div>
            ) : (
              <Link href="/login">
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-[#e85d04]/10 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-[#e85d04]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Owner Access</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Login to edit, delete, and manage service records</p>
                </div>
              </Link>
            )}
          </div>

          {/* Right column: 4 info cards */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/history">
              <InfoCard
                icon={Clock}
                title="View Records"
                description="Browse all service records with search and filter capabilities"
              />
            </Link>
            <Link href="/new">
              <InfoCard
                icon={Plus}
                title="Create Record"
                description="Add a new service record with all details and parts information"
              />
            </Link>
            <Link href="/dashboard">
              <InfoCard
                icon={BarChart3}
                title="Analytics"
                description="View detailed analytics and revenue reports"
              />
            </Link>
            <InfoCard
              icon={FileText}
              title="Features"
              isFeatureList
              features={["Cloud Database", "Search & Filter", "QR Codes", "Mobile Friendly"]}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/history">
            <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#e85d04] text-[#e85d04] rounded-lg font-medium hover:bg-[#e85d04] hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
              View All Records
            </button>
          </Link>
          <Link href="/new">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#e85d04] text-white rounded-lg font-medium hover:bg-[#d4520a] transition-colors">
              <Plus className="w-5 h-5" />
              Create New Record
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
              description="Anyone can create a new service record by filling in the product and customer information"
            />
            <HowItWorksStep
              number={2}
              title="Cloud Storage"
              description="All records are securely stored in the cloud database and accessible from any device"
            />
            <HowItWorksStep
              number={3}
              title="Owner Management"
              description="Owner can log in with PIN to edit, delete, and manage all service records"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#faf6f1] border-t border-gray-200 py-8">
        <div className="container text-center">
          <p className="text-sm font-bold text-gray-700">GOLDWING - Service Record Management System</p>
          <p className="text-xs text-gray-400 mt-2">Made with ZLP</p>
        </div>
      </footer>
    </div>
  );
}
