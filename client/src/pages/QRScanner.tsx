import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, Loader2, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner() {
  const [, navigate] = useLocation();
  const [qrCode, setQrCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const getByQr = trpc.serviceRecords.getByQrCode.useMutation({
    onSuccess: (data) => {
      if (data) {
        // Stop camera if active
        stopCamera();
        navigate(`/record/${data.id}`);
      } else {
        toast.error("Record not found for this QR code");
      }
      setIsSearching(false);
    },
    onError: () => {
      toast.error("Failed to find record");
      setIsSearching(false);
    },
  });

  const startCamera = async () => {
    setCameraError("");

    try {
      // Check if camera is supported
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError("No camera found on this device");
        return;
      }

      // Create scanner instance
      const scanner = new Html5Qrcode("qr-scanner-container");
      scannerRef.current = scanner;

      // Start scanning with back camera preference on mobile
      const cameraId = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          const extractedCode = extractQrCode(decodedText);
          if (extractedCode) {
            setQrCode(extractedCode);
            setIsSearching(true);
            getByQr.mutate({ qrCode: extractedCode });
          }
        },
        () => {
          // Scan error (no QR code found in frame) - ignore
        }
      );

      setCameraActive(true);
      toast.success("Camera started — point at a QR code");
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown error";
      if (errorMsg.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (errorMsg.includes("no_camera")) {
        setCameraError("No camera found on this device");
      } else {
        setCameraError("Failed to start camera: " + errorMsg);
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const extractQrCode = (decodedText: string): string => {
    // The QR code contains the record URL like:
    // https://myanmargoldwingservicerecords.vercel.app/record/123
    // Extract the last segment (ID) or the full text
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split("/");
      return pathParts[pathParts.length - 1] || decodedText;
    } catch {
      // Not a URL, return the raw text
      return decodedText.trim();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  const handleLookup = () => {
    if (!qrCode.trim()) {
      toast.error("Please enter a QR code");
      return;
    }
    setIsSearching(true);
    getByQr.mutate({ qrCode: qrCode.trim() });
  };

  return (
    <div className="min-h-screen bg-beige">
      <Header />

      <main className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-2 bg-[#e85d04]" />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-xl bg-[#e85d04]/10 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-[#e85d04]" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">QR Code Scanner</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Scan a QR code with your camera or enter it manually
              </p>

              {/* Camera Scanner Section */}
              <div className="mb-6">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e85d04] text-white rounded-xl text-base font-semibold hover:bg-[#d4520a] transition-colors shadow-sm"
                  >
                    <Camera className="w-5 h-5" />
                    Scan with Camera
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div
                      id="qr-scanner-container"
                      ref={scannerContainerRef}
                      className="w-full overflow-hidden rounded-xl border border-gray-200"
                      style={{ minHeight: "250px" }}
                    />
                    <button
                      onClick={stopCamera}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      <CameraOff className="w-4 h-4" />
                      Stop Camera
                    </button>
                  </div>
                )}

                {cameraError && (
                  <p className="mt-3 text-sm text-red-500 text-center">{cameraError}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">OR ENTER MANUALLY</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Manual Input Section */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="qrcode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    QR Code / Record ID
                  </label>
                  <Input
                    id="qrcode"
                    placeholder="Enter QR code or record ID..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="text-center text-lg"
                  />
                </div>

                <Button
                  onClick={handleLookup}
                  className="w-full bg-[#e85d04] hover:bg-[#e85d04]-dark text-white font-medium py-3"
                  disabled={!qrCode.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {isSearching ? "Searching..." : "Look Up Record"}
                </Button>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 text-center">
                <p className="text-sm text-gray-500">
                  Or browse all records{" "}
                  <Link href="/history" className="text-[#e85d04] hover:underline font-medium">
                    here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-400">
        Made with ZLP
      </footer>
    </div>
  );
}
