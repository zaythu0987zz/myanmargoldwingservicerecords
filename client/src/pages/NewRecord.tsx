import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2, Coffee } from "lucide-react";
import { toast } from "sonner";

type Part = {
  partName: string;
  partDescription: string;
  quantity: number;
  unitPrice: string;
  totalCost: string;
};

export default function NewRecord() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const createMutation = trpc.serviceRecords.create.useMutation({
    onSuccess: (result) => {
      toast.success("Service record created successfully!");
      navigate(`/record/${result.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create record: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    brand: "DeLonghi",
    modelName: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    location: "Myanmar",
    serviceDate: new Date().toISOString().split("T")[0],
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
      toast.error("Please login to create a service record");
      navigate("/login");
      return;
    }

    const validParts = parts.filter((p) => p.partName.trim());

    createMutation.mutate({
      ...formData,
      parts: validParts.map((p) => ({
        ...p,
        quantity: p.quantity,
      })),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-20 text-center">
          <Coffee className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to create service records.</p>
          <Link href="/login">
            <Button className="bg-goldwing-gold hover:bg-goldwing-gold-dark text-white">
              Login
            </Button>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">New Service Record</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Machine Information */}
            <Card>
              <CardHeader>
                <CardTitle>Machine Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Label htmlFor="modelName">Model Name</Label>
                    <Input
                      id="modelName"
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      placeholder="e.g., ECAM 23.460"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Myanmar">Myanmar</SelectItem>
                        <SelectItem value="Overseas">Overseas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="technicianName">Technician</Label>
                    <Input
                      id="technicianName"
                      value={formData.technicianName}
                      onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                      placeholder="Technician name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Customer full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceDate">Service Date</Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextServiceDate">Next Service Date</Label>
                    <Input
                      id="nextServiceDate"
                      type="date"
                      value={formData.nextServiceDate}
                      onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Service Checklist</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.coffeeCleaning}
                        onCheckedChange={(v) => setFormData({ ...formData, coffeeCleaning: !!v })}
                        id="coffeeCleaning"
                      />
                      <Label htmlFor="coffeeCleaning" className="text-sm cursor-pointer">Coffee</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.waterCleaning}
                        onCheckedChange={(v) => setFormData({ ...formData, waterCleaning: !!v })}
                        id="waterCleaning"
                      />
                      <Label htmlFor="waterCleaning" className="text-sm cursor-pointer">Water</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.descaling}
                        onCheckedChange={(v) => setFormData({ ...formData, descaling: !!v })}
                        id="descaling"
                      />
                      <Label htmlFor="descaling" className="text-sm cursor-pointer">Descaling</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.milkCleaning}
                        onCheckedChange={(v) => setFormData({ ...formData, milkCleaning: !!v })}
                        id="milkCleaning"
                      />
                      <Label htmlFor="milkCleaning" className="text-sm cursor-pointer">Milk Clean</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the service..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parts & Costs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Parts & Costs</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addPart}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Part
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Part Name</Label>
                      <Input
                        value={part.partName}
                        onChange={(e) => updatePart(index, "partName", e.target.value)}
                        placeholder="Part name"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={part.partDescription}
                        onChange={(e) => updatePart(index, "partDescription", e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={part.quantity}
                        onChange={(e) => updatePart(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        value={part.unitPrice}
                        onChange={(e) => updatePart(index, "unitPrice", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Total</Label>
                      <Input value={`$${part.totalCost || "0.00"}`} readOnly className="bg-gray-100" />
                    </div>
                    <div className="col-span-1">
                      {parts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePart(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Link href="/">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button
                type="submit"
                className="bg-goldwing-gold hover:bg-goldwing-gold-dark text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Record
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
