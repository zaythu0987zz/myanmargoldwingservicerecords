import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Link } from "wouter";
import {
  Loader2,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Download,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MONTH_NAMES = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PIE_COLORS = [
  "#e85d04",
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#d97706",
  "#4f46e5",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " Ks";
}

function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportAnalyticsToCSV(analytics: any, yearLabel: string, monthLabel: string) {
  const lines: string[] = [];

  // Header
  lines.push("GoldWing Service Records - Analytics Report");
  lines.push(`Period: ${yearLabel} ${monthLabel}`);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push("");

  // Financial Overview
  lines.push("FINANCIAL OVERVIEW");
  lines.push("Metric,Value");
  lines.push(`Total Records,${analytics.financial.totalRecords}`);
  lines.push(`Total Service Charges,${analytics.financial.totalServiceCharges.toLocaleString()} Ks`);
  lines.push(`Total Parts Cost,${analytics.financial.totalPartsCost.toLocaleString()} Ks`);
  lines.push(`Grand Total Revenue,${analytics.financial.grandTotal.toLocaleString()} Ks`);
  lines.push("");

  // Technician Performance
  lines.push("TECHNICIAN PERFORMANCE");
  lines.push("Technician,Jobs Completed,Service Charges,Parts Cost,Grand Total");
  analytics.technicians.forEach((t: any) => {
    lines.push(
      `"${t.name}",${t.jobCount},${t.totalServiceCharges.toLocaleString()} Ks,${t.totalPartsCost.toLocaleString()} Ks,${t.grandTotal.toLocaleString()} Ks`
    );
  });
  lines.push("");

  // Brand Breakdown
  lines.push("BRAND BREAKDOWN");
  lines.push("Brand,Repair Count");
  analytics.brands.forEach((b: any) => {
    lines.push(`"${b.brand}",${b.count}`);
  });
  lines.push("");

  // Monthly Data
  lines.push("MONTHLY BREAKDOWN");
  lines.push("Year,Month,Record Count,Total Revenue");
  const monthLabels = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  analytics.monthlyData.forEach((m: any) => {
    lines.push(`${m.year},${monthLabels[m.month]},${m.recordCount},${m.totalRevenue.toLocaleString()} Ks`);
  });

  downloadCSV(lines.join("\n"), `goldwing-analytics-${yearLabel}-${monthLabel.replace(" ", "-")}.csv`);
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);

  const { data: analytics, isLoading } = trpc.serviceRecords.analytics.useQuery(
    { year: selectedYear, month: selectedMonth }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">Admin access required.</p>
          <Link href="/">
            <a className="text-[#e85d04] hover:underline">Go Home</a>
          </Link>
        </div>
      </div>
    );
  }

  const yearLabel = selectedYear ? String(selectedYear) : "All Years";
  const monthLabel = selectedMonth ? MONTH_NAMES[selectedMonth] : "All Months";
  const periodLabel = !selectedYear
    ? "All Time"
    : selectedMonth
    ? `${yearLabel} • ${monthLabel}`
    : yearLabel;

  const handleExport = () => {
    if (analytics) {
      exportAnalyticsToCSV(analytics, yearLabel, monthLabel);
    }
  };

  // Prepare monthly chart data
  const monthlyChartData = useMemo(() => {
    if (!analytics?.monthlyData) return [];
    const monthLabels = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return analytics.monthlyData.map((m) => ({
      name: `${m.year} ${monthLabels[m.month]}`,
      records: m.recordCount,
      revenue: m.totalRevenue,
    }));
  }, [analytics]);

  // Prepare brand pie chart data
  const brandChartData = useMemo(() => {
    if (!analytics?.brands) return [];
    return analytics.brands.map((b) => ({
      name: b.brand,
      value: b.count,
    }));
  }, [analytics]);

  return (
    <div className="min-h-screen bg-beige">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#e85d04]" />
                Analytics
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Service records performance dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={!analytics || analytics.financial.totalRecords === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#e85d04] text-white rounded-lg text-sm font-medium hover:bg-[#d4520a] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date/Year Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Year:</label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) =>
                    setSelectedYear(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#e85d04]/20 focus:border-[#e85d04] outline-none"
                >
                  <option value="">All Years</option>
                  {analytics?.availableYears?.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Month:</label>
                <select
                  value={selectedMonth || 0}
                  onChange={(e) =>
                    setSelectedMonth(e.target.value === "0" ? undefined : Number(e.target.value))
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#e85d04]/20 focus:border-[#e85d04] outline-none"
                >
                  <option value="0">All Months</option>
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <option key={i + 1} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-400 ml-auto">
                Period: {periodLabel}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#e85d04]" />
            </div>
          ) : analytics && analytics.financial.totalRecords > 0 ? (
            <>
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-500">Total Records</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.financial.totalRecords}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Service entries this period</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-500">Service Charges</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(analytics.financial.totalServiceCharges)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total service fees</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm text-gray-500">Parts Cost</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(analytics.financial.totalPartsCost)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total parts expenses</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e85d04]/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#e85d04]" />
                    </div>
                    <span className="text-sm text-gray-500">Grand Total</span>
                  </div>
                  <p className="text-3xl font-bold text-[#e85d04]">
                    {formatCurrency(analytics.financial.grandTotal)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Combined revenue</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Monthly Revenue Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Monthly Revenue & Records
                  </h3>
                  {monthlyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? formatCurrency(value) : value,
                            name === "revenue" ? "Revenue" : "Records",
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#e85d04" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-400 py-10">No monthly data available</p>
                  )}
                </div>

                {/* Brand Pie Chart */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Brand Distribution
                  </h3>
                  {brandChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={brandChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {brandChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-400 py-10">No brand data</p>
                  )}
                </div>
              </div>

              {/* Technician Performance Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#e85d04]" />
                    Technician Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Technician
                        </th>
                        <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Jobs
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Service Charges
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Parts Cost
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Grand Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.technicians.map((tech, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {tech.name}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                              {tech.jobCount}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-gray-700">
                            {formatCurrency(tech.totalServiceCharges)}
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-gray-700">
                            {formatCurrency(tech.totalPartsCost)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-bold text-[#e85d04]">
                              {formatCurrency(tech.grandTotal)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.technicians.length === 0 && (
                    <p className="text-center text-gray-400 py-8">
                      No technician data for this period
                    </p>
                  )}
                </div>
              </div>

              {/* Brand Breakdown Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#e85d04]" />
                    Brand-Wise Repair Count
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Brand
                        </th>
                        <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Repair Count
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.brands.map((b, i) => {
                        const percentage =
                          analytics.financial.totalRecords > 0
                            ? ((b.count / analytics.financial.totalRecords) * 100).toFixed(1)
                            : "0";
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      PIE_COLORS[i % PIE_COLORS.length],
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                  {b.brand}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-sm font-semibold text-gray-700">
                                {b.count}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor:
                                        PIE_COLORS[i % PIE_COLORS.length],
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-12 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {analytics.brands.length === 0 && (
                    <p className="text-center text-gray-400 py-8">
                      No brand data for this period
                    </p>
                  )}
                </div>
              </div>

              {/* Monthly Records Bar Chart */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#e85d04]" />
                    Records Per Month
                  </h3>
                </div>
                {monthlyChartData.length > 0 ? (
                  <div className="p-5">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="records" fill="#2563eb" radius={[4, 4, 0, 0]} name="Records" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-10">
                    No monthly data available
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Records Yet
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedYear || selectedMonth
                  ? "No records found for the selected period."
                  : "Create your first service record to see analytics here."}
              </p>
              {(!selectedYear && !selectedMonth) && (
                <Link href="/new">
                  <button className="px-6 py-2.5 bg-[#e85d04] text-white rounded-lg font-medium hover:bg-[#d4520a] transition-colors">
                    Create New Record
                  </button>
                </Link>
              )}
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
