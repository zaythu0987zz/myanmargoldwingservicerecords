import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Link } from "wouter";
import { Loader2, FileText, DollarSign, Coffee, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.serviceRecords.list.useQuery({
    page: 1,
    limit: 5,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">Admin access required.</p>
          <Link href="/"><a className="text-goldwing-gold hover:underline">Go Home</a></Link>
        </div>
      </div>
    );
  }

  const totalRecords = data?.total || 0;
  const totalRevenue = data?.records.reduce(
    (sum, r) => sum + parseFloat(r.totalCost || "0"),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue (Top 5)</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Brands</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Locations</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Service Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {data?.records.map((record) => (
                  <Link key={record.id} href={`/record/${record.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">{record.modelName}</p>
                        <p className="text-sm text-gray-500">{record.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{record.brand}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.serviceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!data?.records || data.records.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No records yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
