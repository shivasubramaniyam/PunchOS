export interface Student {
  roll: string;
  firstName: string;
  lastName: string;
  branch: string;
  year: number | null;
  section: string;
}

export interface AttendanceRecord {
  id: number;
  roll: string;
  name: string;
  branch: string;
  year: number | null;
  section: string;
  date: string;
  markedAt: string;
  method: "qr" | "manual";
}

export interface AttendanceResponse {
  date: string;
  records: AttendanceRecord[];
}

export interface Stats {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  byYear: Record<string, number>;
  byBranch: Record<string, number>;
}

export interface QrPayload {
  token: string;
  url: string;
  image: string;
  expiresIn: number;
}

export interface NewStudentInput {
  roll: string;
  firstName: string;
  lastName: string;
  branch: string;
  year: number;
  section: string;
}

export type LiveEvent =
  | { type: "attendance.marked"; payload: AttendanceRecord }
  | { type: "attendance.undone"; payload: { id: number } }
  | { type: "student.created"; payload: Student }
  | { type: "student.deleted"; payload: { roll: string } };
