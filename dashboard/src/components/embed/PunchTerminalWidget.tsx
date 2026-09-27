"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Building2,
  UserCheck,
} from "lucide-react";

export interface PunchTerminalWidgetProps {
  orgSlug?: string;
  orgName?: string;
  mode?: "kiosk" | "compact" | "card";
  apiBaseUrl?: string;
  soundEnabled?: boolean;
  onPunchSuccess?: (record: {
    roll: string;
    name: string;
    punchType: string;
    org?: string;
    date: string;
    markedAt: string;
  }) => void;
  className?: string;
}

export default function PunchTerminalWidget({
  orgSlug = "general",
  orgName = "Universal Punch Terminal",
  mode = "compact",
  apiBaseUrl = "http://localhost:8000",
  soundEnabled: initialSound = true,
  onPunchSuccess,
  className = "",
}: PunchTerminalWidgetProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [sound, setSound] = useState(initialSound);
  const [verifying, setVerifying] = useState(false);
  const [lastScanned, setLastScanned] = useState<{
    roll: string;
    name: string;
    punchType: string;
    timestamp: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTokenRef = useRef<{ token: string; time: number }>({ token: "", time: 0 });

  const playChime = useCallback(
    (success: boolean) => {
      if (!sound || typeof window === "undefined") return;
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
        // AudioContext disabled
      }
    },
    [sound]
  );

  const verifyQr = useCallback(
    async (rawQr: string) => {
      if (verifying) return;
      const now = Date.now();
      if (lastTokenRef.current.token === rawQr && now - lastTokenRef.current.time < 2500) {
        return;
      }
      lastTokenRef.current = { token: rawQr, time: now };

      setVerifying(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${apiBaseUrl}/api/punch/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrText: rawQr }),
        });
        const data = await res.json();

        if (res.ok && data.ok && data.student) {
          const result = {
            roll: data.student.roll,
            name: data.student.name,
            punchType: data.punchType || "in",
            org: data.student.org,
            date: data.student.date,
            markedAt: data.student.markedAt,
          };
          setLastScanned({
            roll: result.roll,
            name: result.name,
            punchType: result.punchType,
            timestamp: new Date().toLocaleTimeString(),
          });
          playChime(true);
          onPunchSuccess?.(result);
        } else {
          throw new Error(data.error || "Verification rejected");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to verify punch QR";
        setErrorMsg(msg);
        playChime(false);
      } finally {
        setVerifying(false);
      }
    },
    [apiBaseUrl, verifying, playChime, onPunchSuccess]
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data && code.data.startsWith("punch.v1:")) {
      verifyQr(code.data);
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [verifyQr]);

  const startCam = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setErrorMsg("Unable to access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCam = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCam();
    return () => stopCam();
  }, [startCam, stopCam]);

  useEffect(() => {
    if (cameraActive) animFrameRef.current = requestAnimationFrame(scanFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, scanFrame]);

  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-black font-bold shadow-lg shadow-emerald-500/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {orgName}
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 uppercase">
                {orgSlug}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">PunchOS Universal Embeddable Kiosk</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSound((s) => !s)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
          >
            {sound ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={cameraActive ? stopCam : startCam}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
              cameraActive
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {cameraActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            {cameraActive ? "Pause" : "Start"}
          </button>
        </div>
      </div>

      {/* Video Scanner Viewport */}
      <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Laser Scanner Line */}
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.3)] relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Instant Scan Result or Error Banner */}
      {lastScanned && (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">{lastScanned.name}</span>
              <span className="ml-1 text-zinc-400 font-mono">({lastScanned.roll})</span>
              <div className="text-[10px] text-zinc-500">{lastScanned.timestamp}</div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
            {lastScanned.punchType === "out" ? "Clock Out" : "Clock In"}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
