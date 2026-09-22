import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

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

// GET /api/stats - Aggregate attendance KPI statistics
router.get("/", async (req: Request, res: Response) => {
  const targetDate = getStartOfDay(req.query.date as string | undefined);
  const dateString = formatDateIso(targetDate);

  try {
    const [totalStudents, records, allStudents] = await Promise.all([
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
      prisma.student.findMany({
        include: {
          branch: true,
          year: true,
        },
      }),
    ]);

    const presentCount = records.length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const attendanceRate =
      totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    const byYear: Record<string, number> = {};
    const byBranch: Record<string, number> = {};

    // Initialize all existing branches & years with 0
    for (const s of allStudents) {
      const yr = s.year?.year ? `${s.year.year}` : "Unknown";
      const br = s.branch?.branch || "Unknown";
      if (!(yr in byYear)) byYear[yr] = 0;
      if (!(br in byBranch)) byBranch[br] = 0;
    }

    // Count present students
    for (const record of records) {
      const yr = record.student.year?.year
        ? `${record.student.year.year}`
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
    console.error("Error calculating statistics:", error);
    res.status(500).json({ error: "Failed to calculate statistics" });
  }
});

export default router;
