import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { verifyQrToken } from "../services/qr.js";
import { broadcast } from "../services/events.js";

const router = Router();

function getStartOfDay(dateStr?: string): Date {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
  }
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

function formatDateIso(d: Date): string {
  return d.toISOString().split("T")[0];
}

// GET /api/attendance - List attendance for a specific date
router.get("/", async (req: Request, res: Response) => {
  const targetDate = getStartOfDay(req.query.date as string | undefined);
  const dateString = formatDateIso(targetDate);

  try {
    const records = await prisma.attendance.findMany({
      where: {
        date: targetDate,
      },
      include: {
        student: {
          include: {
            branch: true,
            year: true,
            section: true,
          },
        },
      },
      orderBy: { markedAt: "desc" },
    });

    const formatted = records.map((a) => ({
      id: a.id,
      roll: a.student.roll,
      name: `${a.student.firstName} ${a.student.lastName}`,
      branch: a.student.branch?.branch ?? "",
      year: a.student.year?.year ?? null,
      section: a.student.section?.section ?? "",
      date: formatDateIso(a.date),
      markedAt: a.markedAt.toISOString(),
      method: (a.method as "qr" | "manual") || "qr",
    }));

    res.json({
      date: dateString,
      records: formatted,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

// GET /api/attendance/student/:roll - Fetch attendance metrics & history for a specific student
router.get("/student/:roll", async (req: Request, res: Response) => {
  const rollStr = String(req.params.roll).trim();
  try {
    const student = await prisma.student.findFirst({
      where: {
        roll: {
          equals: rollStr,
          mode: "insensitive",
        },
      },
      include: {
        attendances: { orderBy: { markedAt: "desc" } },
      },
    });

    if (!student) {
      return res.json({
        roll: rollStr,
        totalClasses: 30,
        attendedClasses: 0,
        attendanceRate: 0,
        streakDays: 0,
        history: [],
      });
    }

    const totalDays = 30; // Active working days in semester
    const attendedCount = student.attendances.length;
    const rate = Math.round((attendedCount / Math.max(totalDays, attendedCount)) * 100);

    // Calculate actual consecutive attendance streak days
    const uniqueDates = Array.from(
      new Set(student.attendances.map((a) => formatDateIso(a.date)))
    ).sort().reverse();

    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = formatDateIso(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateIso(yesterday);

      let checkDateStr = uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr ? uniqueDates[0] : "";
      if (checkDateStr) {
        let cur = new Date(checkDateStr);
        for (const dStr of uniqueDates) {
          const expected = formatDateIso(cur);
          if (dStr === expected) {
            streak++;
            cur.setDate(cur.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    res.json({
      roll: student.roll,
      totalClasses: Math.max(totalDays, attendedCount),
      attendedClasses: attendedCount,
      attendanceRate: rate,
      streakDays: streak,
      history: student.attendances.map((a) => ({
        id: a.id,
        date: formatDateIso(a.date),
        markedAt: a.markedAt.toISOString(),
        method: a.method,
      })),
    });
  } catch (error) {
    console.error("Error fetching student attendance stats:", error);
    res.status(500).json({ error: "Failed to fetch student attendance stats" });
  }
});

// POST /api/attendance/mark - Mark attendance (QR or Manual)
router.post("/mark", async (req: Request, res: Response) => {
  const { roll, method = "manual", token } = req.body;

  if (!roll) {
    return res.status(400).json({ error: "Student roll number is required" });
  }

  // Validate QR token if method is qr
  if (method === "qr") {
    if (!token || !verifyQrToken(token)) {
      return res
        .status(400)
        .json({ error: "Invalid or expired QR code token" });
    }
  }

  const rollStr = String(roll).trim();
  const today = getStartOfDay();

  try {
    const student = await prisma.student.findUnique({
      where: { roll: rollStr },
      include: { branch: true, year: true, section: true },
    });

    if (!student) {
      return res
        .status(404)
        .json({ error: `Student '${rollStr}' not found in database` });
    }

    // Check for existing attendance today
    const existing = await prisma.attendance.findUnique({
      where: {
        unique_student_attendance_per_day: {
          studentId: rollStr,
          date: today,
        },
      },
    });

    if (existing) {
      const record = {
        id: existing.id,
        roll: student.roll,
        name: `${student.firstName} ${student.lastName}`,
        branch: student.branch?.branch ?? "",
        year: student.year?.year ?? null,
        section: student.section?.section ?? "",
        date: formatDateIso(existing.date),
        markedAt: existing.markedAt.toISOString(),
        method: (existing.method as "qr" | "manual") || "qr",
      };
      return res.json({ ok: true, duplicate: true, record });
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        studentId: rollStr,
        date: today,
        method: method === "qr" ? "qr" : "manual",
      },
    });

    const record = {
      id: attendance.id,
      roll: student.roll,
      name: `${student.firstName} ${student.lastName}`,
      branch: student.branch?.branch ?? "",
      year: student.year?.year ?? null,
      section: student.section?.section ?? "",
      date: formatDateIso(attendance.date),
      markedAt: attendance.markedAt.toISOString(),
      method: (attendance.method as "qr" | "manual") || "qr",
    };

    broadcast("attendance.marked", record);

    res.status(201).json({ ok: true, duplicate: false, record });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// POST /api/attendance/undo - Revert/Delete an attendance record
router.post("/undo", async (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Attendance record ID is required" });
  }

  const idNum = parseInt(String(id), 10);

  try {
    await prisma.attendance.delete({
      where: { id: idNum },
    });

    broadcast("attendance.undone", { id: idNum });

    res.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    console.error("Error undoing attendance:", error);
    res.status(500).json({ error: "Failed to undo attendance record" });
  }
});

// GET /api/stats - Aggregate attendance metrics
router.get("/stats", async (req: Request, res: Response) => {
  const targetDate = getStartOfDay(req.query.date as string | undefined);
  const dateString = formatDateIso(targetDate);

  try {
    const [totalStudents, records] = await Promise.all([
      prisma.student.count(),
      prisma.attendance.findMany({
        where: { date: targetDate },
        include: {
          student: {
            include: {
              branch: true,
              year: true,
            },
          },
        },
      }),
    ]);

    const presentCount = records.length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const attendanceRate =
      totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    const byYear: Record<string, number> = {};
    const byBranch: Record<string, number> = {};

    for (const record of records) {
      const yr = record.student.year?.year
        ? `Year ${record.student.year.year}`
        : "Unknown";
      const br = record.student.branch?.branch || "Unknown";

      byYear[yr] = (byYear[yr] || 0) + 1;
      byBranch[br] = (byBranch[br] || 0) + 1;
    }

    res.json({
      date: dateString,
      totalStudents,
      presentCount,
      absentCount,
      attendanceRate,
      byYear,
      byBranch,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to calculate statistics" });
  }
});

export default router;
