import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search, Loader2, Camera, CameraOff, Upload, Image } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

export default function QRScanner() {
  const [, navigate] = useLocation();
  const [qrCode, setQrCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect BarcodeDetector API support on mount
  useEffect(() => {
    const supported = "BarcodeDetector" in window;
    setBarcodeDetectorSupported(supported);
    console.log("[QRScanner] BarcodeDetector supported:", supported);
  }, []);

  const getByQr = trpc.serviceRecords.getByQrCode.useMutation({
    onSuccess: (data) => {
      if (data) {
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
   * Robust QR code parsing — handles raw IDs, prefixed IDs, and full URLs.
   */
  const extractRecordId = (rawText: string): string => {
    const text = rawText.trim();
    console.log("[QRScanner] Raw decoded text:", text);

    // 1. Try URL parsing
    try {
      const url = new URL(text);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const id = pathParts[pathParts.length - 1];
        console.log("[QRScanner] Extracted from URL path:", id);
        return id;
      }
    } catch {
      // Not a URL
    }

    // 2. Try regex patterns
    const recMatch = text.match(/rec[_-]([a-zA-Z0-9]+)/i);
    if (recMatch) {
      console.log("[QRScanner] Extracted rec prefix:", recMatch[0]);
      return recMatch[0];
    }

    const pathMatch = text.match(/\/records?\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      console.log("[QRScanner] Extracted from path pattern:", pathMatch[1]);
      return pathMatch[1];
    }

    // 3. Pure numeric ID
    if (/^\d+$/.test(text)) {
      console.log("[QRScanner] Pure numeric ID:", text);
      return text;
    }

    // 4. Fallback: raw text
    console.log("[QRScanner] Using raw text as ID:", text);
    return text;
  };

  /**
   * Process a decoded QR code string: extract ID and look up record.
   */
  const handleQrResult = useCallback(
    (decodedText: string) => {
      const recordId = extractRecordId(decodedText);
      console.log("[QRScanner] Processing record ID:", recordId);

      if (!recordId) {
        toast.error("Could not parse a valid record ID from this QR code.");
        return;
      }

      setQrCode(recordId);
      setIsSearching(true);
      getByQr.mutate(
        { qrCode: recordId },
        {
          onSuccess: (data) => {
            if (data) {
              navigate(`/record/${data.id}`);
            } else {
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

  // ─────────────────────────────────────────────
  // LIVE CAMERA SCANNING
  // ─────────────────────────────────────────────

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // Downscale camera frames to avoid memory issues
    const maxDim = 800;
    const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try native BarcodeDetector first (supported on modern Safari/Chrome/Android)
    if (barcodeDetectorSupported) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(canvas).then((results: any[]) => {
          if (results.length > 0 && results[0].rawValue) {
            console.log("[QRScanner] BarcodeDetector detected:", results[0].rawValue);
            handleQrResult(results[0].rawValue);
          }
        }).catch(() => {
          // BarcodeDetector failed silently, fall through to jsQR
        });
      } catch {
        // BarcodeDetector instantiation failed, fall through to jsQR
      }
    }

    // Fallback: jsQR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      console.log("[QRScanner] jsQR detected:", code.data);
      handleQrResult(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleQrResult, barcodeDetectorSupported]);

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

  // ─────────────────────────────────────────────
  // IMAGE FILE PROCESSING (simplified pipeline)
  // ─────────────────────────────────────────────

  /**
   * Process an uploaded image file.
   * Primary: Native BarcodeDetector (fast, no format issues)
   * Fallback: jsQR with canvas downscaling
   * Always uses try/catch/finally to prevent UI freeze.
   */
  const processImageFile = async (file: File) => {
    console.log(`[QRScanner] Processing file: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(0)}KB)`);

    setIsProcessing(true);
    let objectUrl: string | null = null;

    try {
      // Create object URL for the image file (works with any format including HEIC on iOS)
      objectUrl = URL.createObjectURL(file);
      console.log("[QRScanner] Object URL created:", objectUrl);

      // Create an image element and load the file
      const image = new Image();
      image.crossOrigin = "anonymous";

      // Timeout to prevent infinite hang on iOS
      const loadTimeout = setTimeout(() => {
        console.warn("[QRScanner] Image load timed out after 10s");
      }, 10000);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => {
          clearTimeout(loadTimeout);
          console.log(`[QRScanner] Image loaded: ${image.width}x${image.height}`);
          resolve();
        };
        image.onerror = () => {
          clearTimeout(loadTimeout);
          reject(new Error("Image failed to load"));
        };
        image.src = objectUrl;
      });

      // Downscale if too large (prevents canvas memory overflow)
      const MAX_DIM = 800;
      let targetW = image.width;
      let targetH = image.height;
      if (targetW > MAX_DIM || targetH > MAX_DIM) {
        const scale = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
        targetW = Math.floor(targetW * scale);
        targetH = Math.floor(targetH * scale);
      }

      // Draw to canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, targetW, targetH);

      let decodedText: string | null = null;

      // Primary: Try native BarcodeDetector (fast, works on modern browsers including Safari)
      if (barcodeDetectorSupported) {
        try {
          console.log("[QRScanner] Trying BarcodeDetector...");
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const results = await detector.detect(image);
          if (results.length > 0 && results[0].rawValue) {
            decodedText = results[0].rawValue;
            console.log("[QRScanner] BarcodeDetector result:", decodedText);
          }
        } catch (err: any) {
          console.warn("[QRScanner] BarcodeDetector failed:", err?.message);
          // Fall through to jsQR
        }
      }

      // Fallback: jsQR
      if (!decodedText) {
        console.log("[QRScanner] Trying jsQR...");
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code && code.data) {
          decodedText = code.data;
          console.log("[QRScanner] jsQR result:", decodedText);
        }
      }

      // Handle result
      if (decodedText && decodedText.length > 0) {
        handleQrResult(decodedText);
      } else {
        toast.error("Could not detect a QR code in this photo. Please try a clearer or closer shot.");
      }
    } catch (err: any) {
      console.error("[QRScanner] Image processing error:", err);
      const msg = err?.message || "";
      if (msg === "Image failed to load") {
        toast.error("Failed to load the image. The file format may not be supported. Try taking a screenshot or using a different image.");
      } else {
        toast.error("Failed to process the image. Please try again.");
      }
    } finally {
      // Always clean up object URL to prevent WebKit memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        console.log("[QRScanner] Object URL revoked");
      }
      setIsProcessing(false);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop camera stream if active before processing file
    if (cameraActive) {
      stopCamera();
    }

    processImageFile(file);
    e.target.value = "";
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop camera stream if active before processing file
    if (cameraActive) {
      stopCamera();
    }

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
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e85d04] text-white rounded-xl text-base font-semibold hover:bg-[#d4520a] transition-colors shadow-sm disabled:opacity-50"
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
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-[#1d4ed8] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                    <span>{isProcessing ? "Processing..." : "Choose from Library"}</span>
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 bg-[#059669] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    <span>{isProcessing ? "Processing..." : "Take Photo of QR"}</span>
                  </button>
                </div>
              </div>

              {/* iOS Native Camera Fallback */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 text-center font-medium mb-2">
                    iPhone / iPad Users
                  </p>
                  <p className="text-xs text-blue-600 text-center">
                    Your iPhone Camera app automatically detects QR codes. Just open the Camera, point at the QR code, and tap the notification to open the record directly.
                  </p>
                </div>
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
                  disabled={!qrCode.trim() || isSearching || isProcessing}
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
