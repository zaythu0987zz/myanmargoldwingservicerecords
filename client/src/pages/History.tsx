import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import { Search, Loader2, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, QrCode, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function History() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const limit = 20;
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.serviceRecords.list.useQuery({
    page,
    limit,
    search: search || undefined,
    brand: brand === "All" ? undefined : brand,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const deleteMutation = trpc.serviceRecords.delete.useMutation({
    onSuccess: () => {
      // Invalidate the list query
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1]">
      <Header />

      <main className="container py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900 tracking-wider">GOLDWING</h1>
          <h2 className="text-sm text-gray-500 mt-1">Service Records History</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          {isAuthenticated && (
            <button
              onClick={() => navigate("/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#e85d04] text-white rounded-lg text-sm font-semibold hover:bg-[#d4520a] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Record
            </button>
          )}
          <Link href="/qr-scanner">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <QrCode className="w-4 h-4" />
              QR Scanner
            </button>
          </Link>
          {!isAuthenticated && (
            <Link href="/login">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#e85d04] text-white rounded-lg text-sm font-semibold hover:bg-[#d4520a] transition-colors">
                Owner Login
              </button>
            </Link>
          )}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, phone, or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-[160px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Filter by Brand</label>
              <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1); }}>
                <SelectTrigger>
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
            </div>
          </div>
        </div>

        {/* Records Count */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Service Records ({data?.total ?? 0})
            </h3>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#e85d04]" />
            </div>
          )}

          {/* Records Table */}
          {!isLoading && data?.records && data.records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Brand</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Model</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(record.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{record.brand}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{record.customerName}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{record.customerPhone || "-"}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{record.modelName || "-"}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/record/${record.id}`)}
                            className="p-1.5 text-gray-400 hover:text-[#e85d04] transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAuthenticated && (
                            <>
                              <button
                                onClick={() => navigate(`/edit/${record.id}`)}
                                className="p-1.5 text-gray-400 hover:text-[#e85d04] transition-colors"
                                title="Edit record"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && data?.records.length === 0 && (
            <div className="text-center py-16">
              <QrCode className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= data.total}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-400">
        Made with ZLP
      </footer>
    </div>
  );
}
