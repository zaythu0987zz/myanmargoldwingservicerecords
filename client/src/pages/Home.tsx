import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Header from "@/components/Header";
import { Loader2, Search, Filter, Plus, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [location, setLocation] = useState("All");
  const limit = 20;

  const { data, isLoading } = trpc.serviceRecords.list.useQuery({
    page,
    limit,
    search: search || undefined,
    brand: brand === "All" ? undefined : brand,
    location: location === "All" ? undefined : location,
  });

  const brands = trpc.serviceRecords.brands.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Records</h2>
            <p className="text-gray-500 mt-1">Manage and track after-sales service records</p>
          </div>
          <Link href="/new">
            <Button className="bg-goldwing-gold hover:bg-goldwing-gold-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Record
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by customer name, model, or technician..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
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
            <Select value={location} onValueChange={(v) => { setLocation(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                <SelectItem value="Myanmar">Myanmar</SelectItem>
                <SelectItem value="Overseas">Overseas</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>

        {/* Records List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-goldwing-gold" />
          </div>
        ) : data?.records.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border">
            <QrCode className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500 mb-4">Create your first service record to get started.</p>
            <Link href="/new">
              <Button className="bg-goldwing-gold hover:bg-goldwing-gold-dark text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Record
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        QR Code
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Brand / Model
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Service Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/record/${record.id}`} className="flex items-center gap-2 text-goldwing-gold-dark hover:text-goldwing-gold">
                            <QrCode className="w-4 h-4" />
                            <span className="font-mono text-xs">{record.qrCode}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{record.modelName}</p>
                            <p className="text-xs text-gray-500">{record.brand}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{record.customerName}</p>
                          {record.customerPhone && (
                            <p className="text-xs text-gray-500">{record.customerPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              record.location === "Myanmar"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {record.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(record.serviceDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {record.totalCost ? `$${record.totalCost}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data && data.total > limit && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}-{Math.min(page * limit, data.total)} of{" "}
                  {data.total} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * limit >= data.total}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">
        Made with ZLP ✨
      </footer>
    </div>
  );
}
