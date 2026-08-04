import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Link, useParams } from "wouter";
import { Loader2, ArrowLeft, Calendar, User, MapPin, Wrench, DollarSign, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-beige">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#e85d04]" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-beige">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Record Not Found</h2>
          <p className="text-gray-500 mb-6">The service record you're looking for doesn't exist.</p>
          <Link href="/"><Button variant="outline">Go Back</Button></Link>
        </div>
      </div>
    );
  }

  const grandTotal = parseFloat(record.totalCost || "0") + parseFloat(record.serviceCharges || "0");

  return (
    <div className="min-h-screen bg-beige">
      <Header />
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{record.modelName || "Service Record"}</h2>
              <p className="text-gray-500">{record.brand}</p>
            </div>
            <Badge className="bg-[#e85d04] text-white font-mono">{record.qrCode}</Badge>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="bg-white rounded-lg p-4 mx-auto mb-3 inline-block shadow-sm">
                  <QRCodeSVG
                    value={`${window.location.origin}/record/${recordId}`}
                    size={160}
                    level="M"
                    fgColor="#e85d04"
                  />
                </div>
                <p className="text-sm text-gray-500 font-mono">{record.qrCode}</p>
              </div>
            </div>
          </div>

          {/* Section 1: Product Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-lg font-bold text-gray-900">Product Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Brand:</span> <span className="font-medium ml-1">{record.brand}</span></div>
              <div><span className="text-gray-500">Model:</span> <span className="font-medium ml-1">{record.modelName || "-"}</span></div>
              {record.serialNo && <div><span className="text-gray-500">Serial No:</span> <span className="font-medium ml-1">{record.serialNo}</span></div>}
              {record.useInPlace && <div><span className="text-gray-500">Use In:</span> <span className="font-medium ml-1">{record.useInPlace}</span></div>}
              {record.purchasePlace && (
                <div><span className="text-gray-500">Purchase:</span> <span className="font-medium ml-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${record.purchasePlace === "Myanmar" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{record.purchasePlace}</span>
                </span></div>
              )}
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-lg font-bold text-gray-900">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{record.customerName}</span></div>
              {record.customerPhone && <div className="flex items-center gap-2"><span className="text-gray-500">Phone:</span> <span>{record.customerPhone}</span></div>}
              {record.customerAddress && <div className="sm:col-span-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /><span>{record.customerAddress}</span></div>}
            </div>
          </div>

          {/* Section 3: Issues & Service */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-lg font-bold text-gray-900">Issues & Service</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Service Date:</span> <span className="font-medium">{new Date(record.serviceDate).toLocaleDateString()}</span></div>
              {record.inDate && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-500">In Date:</span> <span className="font-medium">{new Date(record.inDate).toLocaleDateString()}</span></div>}
              {record.outDate && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Out Date:</span> <span className="font-medium">{new Date(record.outDate).toLocaleDateString()}</span></div>}
              {record.repairedBy && <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Repaired By:</span> <span className="font-medium">{record.repairedBy}</span></div>}
            </div>
            {record.technicalIssues && (
              <div className="mb-4">
                <span className="text-sm text-gray-500 block mb-1">Technical Issues:</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{record.technicalIssues}</p>
              </div>
            )}
            {/* Machine Checklist */}
            <div>
              <span className="text-sm text-gray-500 block mb-2">Machine Checklist:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Coffee", checked: record.coffeeCleaning },
                  { label: "Water", checked: record.waterCleaning },
                  { label: "Descaling", checked: record.descaling },
                  { label: "Milk Clean", checked: record.milkCleaning },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${item.checked ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${item.checked ? "bg-green-500" : "bg-gray-300"}`}>
                      {item.checked && <span className="text-white text-xs">✓</span>}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Parts */}
          {record.parts && record.parts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="text-lg font-bold text-gray-900">Parts</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 text-gray-500 font-medium">Part</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Qty</th>
                    <th className="text-right pb-2 text-gray-500 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {record.parts.map((part) => (
                    <tr key={part.id}>
                      <td className="py-2 font-medium">{part.partName}</td>
                      <td className="py-2 text-right">{part.quantity}</td>
                      <td className="py-2 text-right">{parseFloat(part.totalCost).toLocaleString()} MMK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 5: Repair Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">5</div>
              <h3 className="text-lg font-bold text-gray-900">Repair Summary</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Parts Cost</span>
                <span className="text-lg font-bold text-gray-900">{parseFloat(record.totalCost || "0").toLocaleString()} MMK</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Service Charges</span>
                <span className="text-lg font-bold text-gray-900">{parseFloat(record.serviceCharges || "0").toLocaleString()} MMK</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Grand Total</span>
                <span className="text-lg font-bold text-[#e85d04]">{grandTotal.toLocaleString()} MMK</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isAuthenticated && (
            <div className="flex justify-end gap-3">
              <Link href={`/edit/${recordId}`}>
                <Button variant="outline">Edit Record</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this record?")) {
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
      <footer className="text-center py-6 text-sm text-gray-400">Made with ZLP</footer>
    </div>
  );
}
