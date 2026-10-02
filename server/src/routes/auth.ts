import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import {
  signToken,
  requireAuth,
  AuthenticatedRequest,
  AuthPayload,
} from "../middleware/auth.js";

const router = Router();

// 1. POST /api/auth/register - Register a user (Student or Faculty)
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, role = "student", studentId } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password, and name are required" });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanRole = (role === "faculty" || role === "admin" ? role : "student") as "student" | "faculty" | "admin";
  const rollStr = studentId ? String(studentId).trim() : undefined;

  if (cleanRole === "student" && !rollStr) {
    return res.status(400).json({ error: "studentId (Roll Number) is required for student registration" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    if (cleanRole === "student" && rollStr) {
      // Ensure student record exists in database
      let student = await prisma.student.findUnique({ where: { roll: rollStr } });
      if (!student) {
        const nameParts = String(name).trim().split(" ");
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(" ") || "Student";
        student = await prisma.student.create({
          data: {
            roll: rollStr,
            firstName,
            lastName,
            email: cleanEmail,
            role: "student",
          },
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name,
        role: cleanRole,
        studentId: cleanRole === "student" ? rollStr : null,
      },
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "student" | "faculty" | "admin",
      studentId: user.studentId || undefined,
    };
    const token = signToken(payload);

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// 2. POST /api/auth/login - Login user
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, studentId } = req.body;

  if (!password || (!email && !studentId)) {
    return res.status(400).json({ error: "Email or Roll Number and Password are required" });
  }

  try {
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    } else if (studentId) {
      user = await prisma.user.findUnique({ where: { studentId: String(studentId).trim() } });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "student" | "faculty" | "admin",
      studentId: user.studentId || undefined,
    };
    const token = signToken(payload);

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
});

// 3. GET /api/auth/me - Fetch current authenticated user
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
