import type {
  AttendanceRecord,
  AttendanceResponse,
  NewStudentInput,
  QrPayload,
  Stats,
  Student,
} from "./types";

function resolveApiBase(): string {
  // 1. Explicit env override (set NEXT_PUBLIC_API_URL in deployment).
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    // 2. If running on backend port directly or behind reverse proxy (same origin)
    if (port === "8000" || (!port && (protocol === "http:" || protocol === "https:"))) {
      return window.location.origin.replace(/\/$/, "");
    }
    // 3. Connect to backend on port 8000 of whatever host/domain is being used
    return `${protocol}//${hostname}:8000`;
  }

  // 4. Default fallback
  return "http://localhost:8000";
}

export const API_BASE = resolveApiBase();

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()) as T;
}

export const api = {
  getStudents: () => get<{ students: Student[] }>("/api/students"),

  createStudent: (s: NewStudentInput) =>
    post<{ student: Student }>("/api/students/create", s),

  deleteStudent: (roll: string) =>
    post<{ ok: boolean }>("/api/students/delete", { roll }),

  getAttendance: (date?: string) =>
    get<AttendanceResponse>(`/api/attendance${date ? `?date=${date}` : ""}`),

  markAttendance: (roll: string, method: "manual" | "qr" = "manual") =>
    post<{ ok: boolean; duplicate: boolean; record: AttendanceRecord }>(
      "/api/attendance/mark",
      { roll, method },
    ),

  undoAttendance: (id: number) =>
    post<{ ok: boolean }>("/api/attendance/undo", { id }),

  getStats: (date?: string) =>
    get<Stats>(`/api/stats${date ? `?date=${date}` : ""}`),

  getQr: () => get<QrPayload>("/api/qr/current"),

  verifyPunch: (qrText: string) =>
    post<{ ok: boolean; student: AttendanceRecord; slot: number }>(
      "/api/punch/verify",
      { qrText },
    ),
};

