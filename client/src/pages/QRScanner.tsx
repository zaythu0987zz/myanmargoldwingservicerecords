import { useState, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, Loader2, Camera, CameraOff, Upload } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

export default function QRScanner() {
  const [, navigate] = useLocation();
  const [qrCode, setQrCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getByQr = trpc.serviceRecords.getByQrCode.useMutation({
    onSuccess: (data) => {
      if (data) {
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

  const extractQrCode = (decodedText: string): string => {
    // The QR code may contain the full URL or just the record ID
    // e.g., "https://myanmargoldwingservicerecords.vercel.app/record/123"
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && !isNaN(Number(lastPart))) {
        return lastPart;
      }
      return decodedText.trim();
    } catch {
      // Not a URL, return the raw text
      return decodedText.trim();
    }
  };

  const processScanResult = useCallback(
    (decodedText: string) => {
      const code = extractQrCode(decodedText);
      if (code) {
        setQrCode(code);
        setIsSearching(true);
        getByQr.mutate({ qrCode: code });
      }
    },
    []
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      processScanResult(code.data);
      return; // Stop scanning
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [processScanResult]);

  const startCamera = async () => {
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // iOS Safari requires these attributes set after srcObject
        video.setAttribute("playsinline", "");
        video.setAttribute("muted", "");
        video.setAttribute("autoplay", "");
        video.playsInline = true;
        video.muted = true;

        await video.play();
        setCameraActive(true);
        toast.success("Camera started — point at a QR code");
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      const errorMsg = err?.name || err?.message || "Unknown error";
      if (errorMsg === "NotAllowedError" || errorMsg.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (errorMsg === "NotFoundError" || errorMsg === "DevicesNotFoundError") {
        setCameraError("No camera found on this device");
      } else {
        setCameraError("Failed to start camera. Try the photo upload option instead.");
      }
    }
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraActive(false);
  };

  // Image upload fallback
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          processScanResult(code.data);
        } else {
          toast.error("No QR code found in the image");
        }
      };
      image.onerror = () => {
        toast.error("Failed to load image");
      };
      image.src = URL.createObjectURL(file);
    } catch {
      toast.error("Failed to process image");
    }

    // Reset file input so the same file can be selected again
    e.target.value = "";
  };

  // Cleanup on unmount
  useState(() => {
    return () => {
      stopCamera();
    };
  });

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

      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />

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
                Scan a QR code with your camera, upload a photo, or enter it manually
              </p>

              {/* Camera Scanner Section */}
              <div className="mb-4">
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
                    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-black" style={{ minHeight: "250px" }}>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                        style={{ minHeight: "250px" }}
                      />
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/60 rounded-lg shadow-lg" />
                      </div>
                    </div>
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

              {/* Image Upload Fallback */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="qr-photo-upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-[#1d4ed8] transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload QR Photo
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Take a photo of a QR code or select one from your gallery
                </p>
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
