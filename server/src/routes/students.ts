import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { broadcast } from "../services/events.js";

const router = Router();

// GET /api/students - List students with optional filters
router.get("/", async (req: Request, res: Response) => {
  const { branch, year, section } = req.query;

  const whereClause: any = {};
  if (branch) whereClause.branch = { branch: String(branch) };
  if (year) whereClause.year = { year: parseInt(String(year), 10) };
  if (section) whereClause.section = { section: String(section) };

  try {
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        branch: true,
        year: true,
        section: true,
      },
      orderBy: { roll: "asc" },
    });

    const formatted = students.map((s) => ({
      roll: s.roll,
      firstName: s.firstName,
      lastName: s.lastName,
      branch: s.branch?.branch ?? "",
      year: s.year?.year ?? null,
      section: s.section?.section ?? "",
    }));

    res.json({ students: formatted });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// POST /api/students/create - Add a new student
router.post("/create", async (req: Request, res: Response) => {
  const { roll, firstName, lastName, branch, year, section } = req.body;

  if (!roll || !firstName || !lastName || !branch || !year || !section) {
    return res.status(400).json({ error: "All student fields are required" });
  }

  const rollStr = String(roll).trim();
  const branchStr = String(branch).trim();
  const yearNum = parseInt(String(year), 10);
  const sectionStr = String(section).trim();

  try {
    // Ensure Branch exists or create it
    const branchRecord = await prisma.branch.upsert({
      where: { branch: branchStr },
      update: {},
      create: { branch: branchStr },
    });

    // Ensure Year exists or create it
    const yearRecord = await prisma.year.upsert({
      where: { year: yearNum },
      update: {},
      create: { year: yearNum },
    });

    // Ensure Section exists or create it
    const sectionRecord = await prisma.section.upsert({
      where: { section: sectionStr },
      update: {},
      create: { section: sectionStr },
    });

    // Create student
    const student = await prisma.student.create({
      data: {
        roll: rollStr,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        branchId: branchRecord.id,
        yearId: yearRecord.id,
        sectionId: sectionRecord.id,
      },
      include: {
        branch: true,
        year: true,
        section: true,
      },
    });

    const formatted = {
      roll: student.roll,
      firstName: student.firstName,
      lastName: student.lastName,
      branch: student.branch.branch,
      year: student.year.year,
      section: student.section.section,
    };

    broadcast("student.created", formatted);

    res.status(201).json({ student: formatted });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: `Student with roll number ${rollStr} already exists` });
    }
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
});

// POST /api/students/delete - Delete a student
router.post("/delete", async (req: Request, res: Response) => {
  const { roll } = req.body;

  if (!roll) {
    return res.status(400).json({ error: "roll is required" });
  }

  const rollStr = String(roll).trim();

  try {
    await prisma.student.delete({
      where: { roll: rollStr },
    });

    broadcast("student.deleted", { roll: rollStr });

    res.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Student not found" });
    }
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
