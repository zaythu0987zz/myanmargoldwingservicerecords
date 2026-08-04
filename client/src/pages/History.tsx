import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Search, Loader2, ChevronLeft, ChevronRight, QrCode } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function History() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [purchasePlace, setPurchasePlace] = useState("All");
  const limit = 20;

  const { data, isLoading } = trpc.serviceRecords.list.useQuery({
    page,
    limit,
    search: search || undefined,
    brand: brand === "All" ? undefined : brand,
    purchasePlace: purchasePlace === "All" ? undefined : purchasePlace,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-beige">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Service Records History</h2>
          <div className="flex items-center gap-3">
            <Link href="/qr-scanner">
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <QrCode className="w-4 h-4" />
                QR Scanner
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-goldwing-gold text-white rounded-lg text-sm font-medium hover:bg-goldwing-gold-dark transition-colors">
                Owner Login
              </button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, phone, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Brands</SelectItem>
              <SelectItem value="DeLonghi">DeLonghi</SelectItem>
              <SelectItem value="Kenwood">Kenwood</SelectItem>
              <SelectItem value="Braun">Braun</SelectItem>
              <SelectItem value="NutriBullet">NutriBullet</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={purchasePlace} onValueChange={(v) => { setPurchasePlace(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Myanmar">Myanmar</SelectItem>
              <SelectItem value="Overseas">Overseas</SelectItem>
            </SelectContent>
          </Select>
        </form>

        {/* Records Count */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Service Records ({data?.total ?? 0})
        </h3>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-goldwing-gold" />
          </div>
        )}

        {/* Records Table */}
        {!isLoading && data?.records && data.records.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Brand / Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(record.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/record/${record.id}`} className="hover:text-goldwing-gold transition-colors">
                          <p className="text-sm font-medium text-gray-900">{record.modelName}</p>
                          <p className="text-xs text-gray-500">{record.brand}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{record.customerPhone || "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.totalCost ? `${record.totalCost} MMK` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && data?.records.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <QrCode className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= data.total}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400">
        Made with ZLP
      </footer>
    </div>
  );
}
