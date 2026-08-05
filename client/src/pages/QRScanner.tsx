import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, Loader2, Camera, CameraOff, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

const MAX_IMAGE_SIZE = 800; // Downscale to max 800px for jsQR compatibility

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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  /**
   * Robust QR code parsing — handles both raw IDs and full URLs.
   * Examples:
   *   "120001" → "120001"
   *   "rec_abc123" → "rec_abc123"
   *   "https://myanmargoldwingservicerecords.vercel.app/record/120001" → "120001"
   *   "https://myanmargoldwingservicerecords.vercel.app/records/rec_abc123" → "rec_abc123"
   */
  const extractRecordId = (rawText: string): string => {
    const text = rawText.trim();
    console.log("[QRScanner] Raw decoded text:", text);

    // 1. Try URL parsing
    try {
      const url = new URL(text);
      // Extract last segment of pathname
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const id = pathParts[pathParts.length - 1];
        console.log("[QRScanner] Extracted from URL path:", id);
        return id;
      }
    } catch {
      // Not a URL, continue to regex
    }

    // 2. Try regex patterns for common QR code formats
    // Pattern: rec_XXXX or rec-XXXX or record_XXXX
    const recMatch = text.match(/rec[_-]([a-zA-Z0-9]+)/i);
    if (recMatch) {
      console.log("[QRScanner] Extracted rec prefix:", recMatch[0]);
      return recMatch[0];
    }

    // Pattern: /record/XXXX or /records/XXXX
    const pathMatch = text.match(/\/records?\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      console.log("[QRScanner] Extracted from path pattern:", pathMatch[1]);
      return pathMatch[1];
    }

    // Pattern: pure numeric ID
    if (/^\d+$/.test(text)) {
      console.log("[QRScanner] Pure numeric ID:", text);
      return text;
    }

    // 3. Fallback: return the raw text trimmed
    console.log("[QRScanner] Using raw text as ID:", text);
    return text;
  };

  /**
   * Process a decoded QR code string: extract ID and look up record.
   * Uses both tRPC mutation and direct navigation as fallback.
   */
  const handleQrResult = useCallback(
    (decodedText: string) => {
      const recordId = extractRecordId(decodedText);
      console.log("[QRScanner] Processing record ID:", recordId);

      if (!recordId) {
        toast.error("Could not parse a valid record ID from this QR code.");
        return;
      }

      // First try the getByQrCode mutation (handles QR codes that are strings, not IDs)
      setQrCode(recordId);
      setIsSearching(true);
      getByQr.mutate(
        { qrCode: recordId },
        {
          onSuccess: (data) => {
            if (data) {
              navigate(`/record/${data.id}`);
            } else {
              // Fallback: try navigating directly with the record ID
              toast.success("Redirecting to record...");
              navigate(`/record/${recordId}`);
            }
            setIsSearching(false);
          },
          onError: () => {
            toast.error("Failed to find record");
            setIsSearching(false);
          },
        }
      );
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

    // Downscale camera frames to avoid memory issues
    const maxDim = 800;
    const scale = Math.min(
      maxDim / video.videoWidth,
      maxDim / video.videoHeight,
      1
    );
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      console.log("[QRScanner] Camera scan detected:", code.data);
      handleQrResult(code.data);
      return; // Stop scanning
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleQrResult]);

  const startCamera = async () => {
    setCameraError("");

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: "environment" as const } }, audio: false },
      { video: { facingMode: "environment" }, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: true, audio: false },
    ];

    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          video.setAttribute("autoplay", "true");
          video.setAttribute("muted", "true");
          video.playsInline = true;
          video.muted = true;
          video.autoplay = true;

          await new Promise((resolve) => setTimeout(resolve, 100));
          await video.play();

          setCameraActive(true);
          toast.success("Camera started — point at a QR code");
          rafRef.current = requestAnimationFrame(scanFrame);
          return;
        }
      } catch (err: any) {
        const name = err?.name || "";
        if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
          continue;
        }
        if (name === "NotAllowedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings, or use the photo upload options below.");
          return;
        }
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCameraError("No camera found. Try using the photo upload options below.");
          return;
        }
        console.warn("[QRScanner] Camera attempt failed:", name, err?.message);
      }
    }

    setCameraError("Could not start camera. Please use the photo upload options below instead.");
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

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /**
   * Process an uploaded image file with downscaling to max 800px.
   * This prevents jsQR memory overflow on high-resolution iOS photos (4K+).
   */
  const processImageFile = (file: File) => {
    toast.loading("Processing image...");

    const image = new Image();
    image.onload = () => {
      // Calculate downscaled dimensions
      const { width: origW, height: origH } = image;
      let targetW = origW;
      let targetH = origH;

      if (origW > MAX_IMAGE_SIZE || origH > MAX_IMAGE_SIZE) {
        const scale = Math.min(MAX_IMAGE_SIZE / origW, MAX_IMAGE_SIZE / origH);
        targetW = Math.floor(origW * scale);
        targetH = Math.floor(origH * scale);
        console.log(`[QRScanner] Downscaling image from ${origW}x${origH} to ${targetW}x${targetH}`);
      } else {
        console.log(`[QRScanner] Image already within size limit: ${origW}x${origH}`);
      }

      // Draw downscaled image onto canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        toast.dismiss();
        toast.error("Failed to process image. Canvas not supported.");
        return;
      }

      // Use high-quality downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, targetW, targetH);

      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      toast.dismiss();

      if (code && code.data) {
        console.log("[QRScanner] Image scan detected:", code.data);
        handleQrResult(code.data);
      } else {
        toast.error("No valid QR code found in this image. Please try another photo.");
      }
    };

    image.onerror = () => {
      toast.dismiss();
      toast.error("Failed to load image. Please try a different photo.");
    };

    image.src = URL.createObjectURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = "";
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = "";
  };

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

      {/* Hidden file inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraUpload}
        className="hidden"
      />

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
                        className="w-full h-full object-cover"
                        style={{ width: "100%", height: "100%", minHeight: "250px" }}
                        playsInline
                        autoPlay
                        muted
                      />
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

              {/* Image Upload Options */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-[#1d4ed8] transition-colors shadow-sm"
                  >
                    <Image className="w-5 h-5" />
                    <span>Choose from Library</span>
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 bg-[#059669] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors shadow-sm"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Take Photo of QR</span>
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Select a QR code image from your library or take a new photo
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
