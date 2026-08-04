import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

const sections = [
  { number: 1, title: "Product Information" },
  { number: 2, title: "Customer Information" },
  { number: 3, title: "Issues & Service" },
  { number: 4, title: "Parts" },
  { number: 5, title: "Repair Summary" },
];

export default function EditRecord() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const recordId = parseInt(id || "0");

  const { data: record, isLoading } = trpc.serviceRecords.getById.useQuery(
    { id: recordId },
    { enabled: !!recordId }
  );

  const updateMutation = trpc.serviceRecords.update.useMutation({
    onSuccess: () => {
      toast.success("Record updated successfully!");
      navigate(`/record/${recordId}`);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    brand: "",
    modelName: "",
    serialNo: "",
    useInPlace: "",
    purchasePlace: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    date: "",
    inDate: "",
    outDate: "",
    coffeeCleaning: false,
    waterCleaning: false,
    descaling: false,
    milkCleaning: false,
    technicalIssues: "",
    repairedBy: "",
    serviceCharges: "",
  });

  const [parts, setParts] = useState<{ id?: number; partName: string; quantity: number; cost: string }[]>([]);

  useEffect(() => {
    if (record) {
      setFormData({
        brand: record.brand || "",
        modelName: record.modelName || "",
        serialNo: record.serialNo || "",
        useInPlace: record.useInPlace || "",
        purchasePlace: record.purchasePlace || "",
        customerName: record.customerName || "",
        customerPhone: record.customerPhone || "",
        customerAddress: record.customerAddress || "",
        date: record.serviceDate ? new Date(record.serviceDate).toISOString().split("T")[0] : "",
        inDate: record.inDate ? new Date(record.inDate).toISOString().split("T")[0] : "",
        outDate: record.outDate ? new Date(record.outDate).toISOString().split("T")[0] : "",
        coffeeCleaning: record.coffeeCleaning || false,
        waterCleaning: record.waterCleaning || false,
        descaling: record.descaling || false,
        milkCleaning: record.milkCleaning || false,
        technicalIssues: record.technicalIssues || "",
        repairedBy: record.repairedBy || "",
        serviceCharges: record.serviceCharges || "0",
      });
      if (record.parts) {
        setParts(record.parts.map((p: any) => ({
          id: p.id,
          partName: p.partName || "",
          quantity: p.quantity || 1,
          cost: p.totalCost || "0",
        })));
      } else {
        setParts([{ partName: "", quantity: 1, cost: "0" }]);
      }
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to edit records");
      navigate("/login");
      return;
    }

    const validParts = parts.filter((p) => p.partName.trim());

    updateMutation.mutate({
      id: recordId,
      brand: formData.brand as any,
      modelName: formData.modelName,
      serialNo: formData.serialNo || undefined,
      useInPlace: formData.useInPlace || undefined,
      purchasePlace: formData.purchasePlace || undefined,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || undefined,
      customerAddress: formData.customerAddress || undefined,
      serviceDate: formData.date,
      inDate: formData.inDate || undefined,
      outDate: formData.outDate || undefined,
      coffeeCleaning: formData.coffeeCleaning,
      waterCleaning: formData.waterCleaning,
      descaling: formData.descaling,
      milkCleaning: formData.milkCleaning,
      technicalIssues: formData.technicalIssues || undefined,
      repairedBy: formData.repairedBy || undefined,
      serviceCharges: formData.serviceCharges || "0",
      parts: validParts,
    });
  };

  const addPart = () => setParts([...parts, { partName: "", quantity: 1, cost: "0" }]);
  const removePart = (i: number) => setParts(parts.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: string, value: string | number) => {
    const updated = [...parts];
    updated[i] = { ...updated[i], [field]: value };
    setParts(updated);
  };

  const totalPartsCost = parts.reduce((s, p) => s + (parseFloat(p.cost) || 0), 0);

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

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-beige">
      <Header />
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Service Record</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Product Information */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="text-lg font-bold text-gray-900">{sections[0].title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Brand *</Label>
                  <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DeLonghi">DeLonghi</SelectItem>
                      <SelectItem value="Kenwood">Kenwood</SelectItem>
                      <SelectItem value="Braun">Braun</SelectItem>
                      <SelectItem value="NutriBullet">NutriBullet</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Model Name</Label>
                  <Input value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} placeholder="e.g., EC685M" />
                </div>
                <div>
                  <Label className="mb-1.5">Serial Number</Label>
                  <Input value={formData.serialNo} onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })} placeholder="Product serial number" />
                </div>
                <div>
                  <Label className="mb-1.5">Use In Place</Label>
                  <Input value={formData.useInPlace} onChange={(e) => setFormData({ ...formData, useInPlace: e.target.value })} placeholder="Where the product is used" />
                </div>
                <div>
                  <Label className="mb-1.5">Purchase Place</Label>
                  <Select value={formData.purchasePlace} onValueChange={(v) => setFormData({ ...formData, purchasePlace: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Myanmar">Myanmar</SelectItem>
                      <SelectItem value="Overseas">Overseas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Section 2: Customer Information */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="text-lg font-bold text-gray-900">{sections[1].title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Customer Name *</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <Label className="mb-1.5">Phone Number</Label>
                  <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="09-xxx-xxx-xxx" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1.5">Address</Label>
                  <Input value={formData.customerAddress} onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })} placeholder="Customer address" />
                </div>
              </div>
            </section>

            {/* Section 3: Issues & Service */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="text-lg font-bold text-gray-900">{sections[2].title}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5">Service Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5">In Date</Label>
                    <Input type="date" value={formData.inDate} onChange={(e) => setFormData({ ...formData, inDate: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">Out Date</Label>
                    <Input type="date" value={formData.outDate} onChange={(e) => setFormData({ ...formData, outDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Machine Checklist</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["coffeeCleaning", "waterCleaning", "descaling", "milkCleaning"] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })} className="w-4 h-4 rounded accent-[#e85d04]" />
                        <span className="text-sm text-gray-700">
                          {key === "coffeeCleaning" && "Coffee"}
                          {key === "waterCleaning" && "Water"}
                          {key === "descaling" && "Descaling"}
                          {key === "milkCleaning" && "Milk Clean"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">Technical Issues</Label>
                  <Textarea value={formData.technicalIssues} onChange={(e) => setFormData({ ...formData, technicalIssues: e.target.value })} placeholder="Describe the technical issues..." rows={3} />
                </div>
                <div>
                  <Label className="mb-1.5">Repaired By</Label>
                  <Input value={formData.repairedBy} onChange={(e) => setFormData({ ...formData, repairedBy: e.target.value })} placeholder="Technician name" />
                </div>
              </div>
            </section>

            {/* Section 4: Parts */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="text-lg font-bold text-gray-900">{sections[3].title}</h3>
                <button type="button" onClick={addPart} className="ml-auto inline-flex items-center gap-1 text-sm text-[#e85d04] hover:text-[#e85d04]-dark font-medium">
                  <Plus className="w-4 h-4" /> Add Part
                </button>
              </div>
              <div className="space-y-3">
                {parts.map((part, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Input placeholder="Part name" value={part.partName} onChange={(e) => updatePart(i, "partName", e.target.value)} className="flex-1" />
                    <Input type="number" placeholder="Qty" value={part.quantity} onChange={(e) => updatePart(i, "quantity", parseInt(e.target.value) || 1)} className="w-20" min={1} />
                    <Input placeholder="Cost (MMK)" value={part.cost} onChange={(e) => updatePart(i, "cost", e.target.value)} className="w-32" />
                    {parts.length > 1 && (
                      <button type="button" onClick={() => removePart(i)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Repair Summary */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#e85d04] text-white flex items-center justify-center font-bold text-sm">5</div>
                <h3 className="text-lg font-bold text-gray-900">{sections[4].title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Service Charges (MMK)</Label>
                  <Input value={formData.serviceCharges} onChange={(e) => setFormData({ ...formData, serviceCharges: e.target.value })} placeholder="0" type="number" min="0" />
                </div>
                <div>
                  <Label className="mb-1.5">Total Parts Cost</Label>
                  <div className="py-2.5 px-3 bg-gray-50 rounded-lg border text-sm font-medium text-gray-700">{totalPartsCost.toLocaleString()} MMK</div>
                </div>
                <div>
                  <Label className="mb-1.5">Grand Total</Label>
                  <div className="py-2.5 px-3 bg-[#e85d04]/10 rounded-lg border border-[#e85d04]/30 text-sm font-bold text-[#e85d04]-dark">
                    {(totalPartsCost + parseFloat(formData.serviceCharges || "0")).toLocaleString()} MMK
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Link href={`/record/${recordId}`} className="inline-flex"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" className="bg-[#e85d04] hover:bg-[#e85d04]-dark text-white px-8 py-3 font-medium" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {updateMutation.isPending ? "Saving..." : "Update Record"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-400">Made with ZLP</footer>
    </div>
  );
}
