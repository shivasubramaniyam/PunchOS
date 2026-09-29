import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { getLocalIp } from "./services/qr.js";
import { registerSseClient, unregisterSseClient } from "./services/events.js";
import studentsRouter from "./routes/students.js";
import attendanceRouter from "./routes/attendance.js";
import statsRouter from "./routes/stats.js";
import qrRouter from "./routes/qr.js";
import punchRouter from "./routes/punch.js";
import webhooksRouter from "./routes/webhooks.js";

const app = express();
const PORT = parseInt(process.env.PORT || "8000", 10);

// Middleware
// Allowlist origins via CORS_ORIGIN (comma-separated). Defaults to open (*).
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes("*")
      ? "*"
      : (origin, callback) => {
          // Allow requests with no Origin header (curl, healthchecks, mobile apps).
          if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Server-Sent Events (SSE) Live Feed for Dashboard
app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const clientId = registerSseClient(res);

  req.on("close", () => {
    unregisterSseClient(clientId);
  });
});

// 3. Mount API Routers
app.use("/api/students", studentsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/stats", statsRouter);
app.use("/api/qr", qrRouter);
app.use("/api/punch", punchRouter);
app.use("/api/webhooks", webhooksRouter);

// 4. Root API endpoint info
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Biometric Punch & QR Attendance Protocol Server",
    status: "active",
    version: "2.0.0",
    docs: "/api/health",
    protocol: {
      standard: "punch.v1",
      keyType: "ECDSA P-256 (ES256)",
      rotationWindow: "3s slot",
    },
  });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIp();
  console.log("==================================================");
  console.log("🚀 Punch Attendance TypeScript Server is running!");
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIp}:${PORT}`);
  console.log(`📊 API Base: http://${localIp}:${PORT}/api`);
  console.log("==================================================");
});
