import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Part = {
  id?: number;
  partName: string;
  partDescription: string;
  quantity: number;
  unitPrice: string;
  totalCost: string;
};

export default function EditRecord() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
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
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    brand: "DeLonghi",
    modelName: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    location: "Myanmar",
    serviceDate: "",
    nextServiceDate: "",
    coffeeCleaning: false,
    waterCleaning: false,
    descaling: false,
    milkCleaning: false,
    notes: "",
    technicianName: "",
  });

  const [parts, setParts] = useState<Part[]>([
    { partName: "", partDescription: "", quantity: 1, unitPrice: "", totalCost: "" },
  ]);

  useEffect(() => {
    if (record) {
      setFormData({
        brand: record.brand || "DeLonghi",
        modelName: record.modelName || "",
        customerName: record.customerName || "",
        customerPhone: record.customerPhone || "",
        customerEmail: record.customerEmail || "",
        location: record.location || "Myanmar",
        serviceDate: record.serviceDate ? record.serviceDate.split("T")[0] : "",
        nextServiceDate: record.nextServiceDate ? record.nextServiceDate.split("T")[0] : "",
        coffeeCleaning: record.coffeeCleaning || false,
        waterCleaning: record.waterCleaning || false,
        descaling: record.descaling || false,
        milkCleaning: record.milkCleaning || false,
        notes: record.notes || "",
        technicianName: record.technicianName || "",
      });

      if (record.parts && record.parts.length > 0) {
        setParts(
          record.parts.map((p) => ({
            id: p.id,
            partName: p.partName,
            partDescription: p.partDescription || "",
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalCost: p.totalCost,
          }))
        );
      }
    }
  }, [record]);

  const addPart = () => {
    setParts([
      ...parts,
      { partName: "", partDescription: "", quantity: 1, unitPrice: "", totalCost: "" },
    ]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    }
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? (value as number) : updated[index].quantity;
      const price = field === "unitPrice" ? (value as string) : updated[index].unitPrice;
      updated[index].totalCost = (qty * parseFloat(price || "0")).toFixed(2);
    }
    setParts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    const validParts = parts.filter((p) => p.partName.trim());

    updateMutation.mutate({
      id: recordId,
      ...formData,
      parts: validParts.map((p) => ({
        ...p,
        quantity: p.quantity,
      })),
    });
  };

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

  if (!record || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You don't have permission to edit this record.</p>
          <Link href="/">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Service Record</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Machine Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand</Label>
                    <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label>Model Name</Label>
                    <Input value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Myanmar">Myanmar</SelectItem>
                        <SelectItem value="Overseas">Overseas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Technician</Label>
                    <Input value={formData.technicianName} onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Service Date</Label>
                    <Input type="date" value={formData.serviceDate} onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Next Service Date</Label>
                    <Input type="date" value={formData.nextServiceDate} onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Service Checklist</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "coffeeCleaning" as const, label: "Coffee" },
                      { key: "waterCleaning" as const, label: "Water" },
                      { key: "descaling" as const, label: "Descaling" },
                      { key: "milkCleaning" as const, label: "Milk Clean" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox checked={formData[item.key]} onCheckedChange={(v) => setFormData({ ...formData, [item.key]: !!v })} id={item.key} />
                        <Label htmlFor={item.key} className="text-sm cursor-pointer">{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Parts & Costs</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addPart}>
                    <Plus className="w-4 h-4 mr-1" />Add Part
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Part Name</Label>
                      <Input value={part.partName} onChange={(e) => updatePart(index, "partName", e.target.value)} />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Description</Label>
                      <Input value={part.partDescription} onChange={(e) => updatePart(index, "partDescription", e.target.value)} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min={1} value={part.quantity} onChange={(e) => updatePart(index, "quantity", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input value={part.unitPrice} onChange={(e) => updatePart(index, "unitPrice", e.target.value)} />
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Total</Label>
                      <Input value={`$${part.totalCost || "0.00"}`} readOnly className="bg-gray-100" />
                    </div>
                    <div className="col-span-1">
                      {parts.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePart(index)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Link href={`/record/${recordId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-goldwing-gold hover:bg-goldwing-gold-dark text-white" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
