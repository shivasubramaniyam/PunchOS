import type {
  AttendanceRecord,
  AttendanceResponse,
  NewStudentInput,
  QrPayload,
  Stats,
  Student,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000`
    : "http://localhost:8000");

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

