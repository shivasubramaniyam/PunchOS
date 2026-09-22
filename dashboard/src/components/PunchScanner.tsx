"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  Sparkles,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AttendanceRecord } from "@/lib/types";

interface PunchScannerProps {
  onScanSuccess?: (record: AttendanceRecord) => void;
}

export default function PunchScanner({ onScanSuccess }: PunchScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [lastScanned, setLastScanned] = useState<{
    student: AttendanceRecord;
    slot: number;
    timestamp: number;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const lastScannedTokenRef = useRef<{ token: string; time: number }>({
    token: "",
    time: 0,
  });

  // Synthesize audio feedback chime
  const playChime = useCallback((success: boolean) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // AudioContext unavailable
    }
  }, [soundEnabled]);

  const verifyToken = useCallback(
    async (rawQr: string) => {
      if (verifying) return;

      const now = Date.now();
      if (
        lastScannedTokenRef.current.token === rawQr &&
        now - lastScannedTokenRef.current.time < 2500
      ) {
        return;
      }
      lastScannedTokenRef.current = { token: rawQr, time: now };

      setVerifying(true);
      setScanError(null);

      try {
        const res = await api.verifyPunch(rawQr);
        if (res.ok && res.student) {
          setLastScanned({
            student: res.student,
            slot: res.slot,
            timestamp: Date.now(),
          });
          playChime(true);
          onScanSuccess?.(res.student);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to verify punch QR";
        setScanError(message);
        playChime(false);
      } finally {
        setVerifying(false);
      }
    },
    [verifying, playChime, onScanSuccess]
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data && code.data.startsWith("punch.v1:")) {
      verifyToken(code.data);
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [verifyToken]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const selectedDeviceIdRef = useRef(selectedDeviceId);
  selectedDeviceIdRef.current = selectedDeviceId;

  const startCamera = useCallback(async (deviceId?: string) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    stopCamera();

    const targetDevice = deviceId ?? selectedDeviceIdRef.current;

    try {
      // First attempt with deviceId if chosen, else generic video constraint
      let stream: MediaStream;
      const constraints: MediaStreamConstraints = targetDevice
        ? { video: { deviceId: { exact: targetDevice } }, audio: false }
        : { video: true, audio: false };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback: simple video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraActive(true);

      // Enumerate available video devices
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setAvailableDevices(videoDevices);
      }).catch(() => undefined);
    } catch (err: unknown) {
      console.warn("Camera start error:", err);
      const errorMsg = err instanceof Error ? err.name : "";
      if (errorMsg === "NotReadableError" || errorMsg === "TrackStartError") {
        setCameraError(
          "Camera is in use by another app (e.g. Zoom, Windows Camera, Teams) or permissions are locked. Close other apps and click Retry."
        );
      } else if (errorMsg === "NotAllowedError" || errorMsg === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setCameraError("Unable to open camera. Please check connection or use image upload below.");
      }
      setCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, scanFrame]);

  // Handle image upload scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          verifyToken(code.data);
        } else {
          setScanError("No valid QR code detected in the uploaded image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
              Punch Scanner Terminal
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-2.5 w-2.5" /> Cult.fit Web3
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Point camera at student&apos;s 3s dynamic biometric QR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {availableDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedDeviceId(newId);
                startCamera(newId);
              }}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300 focus:outline-none"
            >
              {availableDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="rounded-lg border border-zinc-800 bg-zinc-800/60 p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            title={soundEnabled ? "Mute chime" : "Enable chime"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={cameraActive ? stopCamera : () => startCamera()}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              cameraActive
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" /> Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camera Viewport / Laser Stage */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            cameraActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Reticle / Laser Scanner Overlay */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Center Target Box */}
            <div className="relative h-44 w-44 rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 h-5 w-5 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute -top-1 -right-1 h-5 w-5 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-emerald-400" />

              {/* Animated Laser Scanning Line */}
              <div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse"
                style={{ animation: "scan 2s ease-in-out infinite alternate" }}
              />
            </div>

            <span className="absolute bottom-3 text-[11px] font-mono tracking-wider text-emerald-400/80 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
              {verifying ? "VERIFYING ECDSA P-256..." : "AIM AT DYNAMIC PUNCH QR"}
            </span>
          </div>
        )}

        {/* Camera Inactive / Error State */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            {cameraError ? (
              <div className="max-w-xs">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
                <p className="text-xs font-semibold text-zinc-200">{cameraError}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" /> Scan Image
                  </button>
                </div>
              </div>
            ) : (
              <>
                <CameraOff className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-300">Camera scanner is paused</p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="mt-3 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
                >
                  Start Live Camera
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input for uploading QR images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Live Verification Status Card */}
      {lastScanned && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-zinc-100 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-200">
                  {lastScanned.student.name}
                </h4>
                <span className="rounded bg-emerald-950 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 border border-emerald-800">
                  {lastScanned.student.roll}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                {lastScanned.student.branch} · Year {lastScanned.student.year ?? "N/A"} · Sec {lastScanned.student.section}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono">
                  <ShieldCheck className="h-3 w-3" /> ECDSA P-256 Valid
                </span>
                <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 font-mono text-zinc-400">
                  Slot #{lastScanned.slot}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-zinc-400 whitespace-nowrap">
            {new Date(lastScanned.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {scanError && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Manual Token Verification / Image Upload fallback */}
      <div className="mt-4 flex gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) {
              verifyToken(manualCode.trim());
              setManualCode("");
            }
          }}
          className="flex flex-1 gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or paste dynamic punch token (punch.v1:...)"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || verifying}
            className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            Verify
          </button>
        </form>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Scan QR code from image file"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors flex items-center gap-1"
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>
    </section>
  );
}
