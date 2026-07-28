import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Link, useParams } from "wouter";
import { Loader2, ArrowLeft, QrCode, Coffee, MapPin, User, Calendar, DollarSign, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const recordId = parseInt(id || "0");

  const { data: record, isLoading } = trpc.serviceRecords.getById.useQuery(
    { id: recordId },
    { enabled: !!recordId }
  );

  const deleteMutation = trpc.serviceRecords.delete.useMutation({
    onSuccess: () => {
      toast.success("Record deleted successfully");
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-goldwing-gold" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Record Not Found</h2>
          <p className="text-gray-500 mb-6">The service record you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canDelete = isAuthenticated && user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Records
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{record.modelName}</h2>
              <p className="text-gray-500">{record.brand} • {record.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-goldwing-gold text-white">{record.qrCode}</Badge>
            </div>
          </div>

          {/* QR Code */}
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-16 h-16 text-goldwing-gold" />
                </div>
                <p className="text-sm text-gray-500 font-mono">{record.qrCode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Service Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-goldwing-gold" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{record.customerName}</p>
                {record.customerPhone && <p className="text-sm text-gray-500">{record.customerPhone}</p>}
                {record.customerEmail && <p className="text-sm text-gray-500">{record.customerEmail}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-goldwing-gold" />
                  Service Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service Date</span>
                  <span className="text-sm font-medium">
                    {new Date(record.serviceDate).toLocaleDateString()}
                  </span>
                </div>
                {record.nextServiceDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Next Service</span>
                    <span className="text-sm font-medium">
                      {new Date(record.nextServiceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {record.technicianName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Technician</span>
                    <span className="text-sm font-medium">{record.technicianName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Location</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      record.location === "Myanmar"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {record.location}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Checklist */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-4 h-4 text-goldwing-gold" />
                Service Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Coffee Cleaning", checked: record.coffeeCleaning },
                  { label: "Water Cleaning", checked: record.waterCleaning },
                  { label: "Descaling", checked: record.descaling },
                  { label: "Milk Cleaning", checked: record.milkCleaning },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 p-2 rounded ${
                      item.checked ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center ${
                        item.checked ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      {item.checked && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${item.checked ? "text-green-700" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parts & Costs */}
          {record.parts && record.parts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-4 h-4 text-goldwing-gold" />
                  Parts & Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-semibold text-gray-500 pb-2">Part</th>
                      <th className="text-left text-xs font-semibold text-gray-500 pb-2">Description</th>
                      <th className="text-right text-xs font-semibold text-gray-500 pb-2">Qty</th>
                      <th className="text-right text-xs font-semibold text-gray-500 pb-2">Unit Price</th>
                      <th className="text-right text-xs font-semibold text-gray-500 pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {record.parts.map((part) => (
                      <tr key={part.id}>
                        <td className="py-2 text-sm font-medium">{part.partName}</td>
                        <td className="py-2 text-sm text-gray-500">{part.partDescription || "-"}</td>
                        <td className="py-2 text-sm text-right">{part.quantity}</td>
                        <td className="py-2 text-sm text-right">${part.unitPrice}</td>
                        <td className="py-2 text-sm text-right font-medium">${part.totalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td colSpan={4} className="py-3 text-right font-bold text-gray-900">
                        Total Cost
                      </td>
                      <td className="py-3 text-right font-bold text-goldwing-gold-dark text-lg">
                        ${record.totalCost || "0.00"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {record.notes && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{record.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {canDelete && (
            <div className="flex justify-end gap-3">
              <Link href={`/edit/${recordId}`}>
                <Button variant="outline">Edit Record</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this record? This cannot be undone.")) {
                    deleteMutation.mutate({ id: recordId });
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Record
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">
        Made with ZLP ✨
      </footer>
    </div>
  );
}
