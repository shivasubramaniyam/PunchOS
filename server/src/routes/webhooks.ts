import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../db.js";
import { dispatchWebhook } from "../services/webhook.js";

const router = Router();

// 1. GET /api/webhooks - List all registered webhooks
router.get("/", async (req: Request, res: Response) => {
  try {
    const { orgId } = req.query;
    const webhooks = await prisma.webhookConfig.findMany({
      where: orgId ? { orgId: String(orgId) } : {},
      include: {
        deliveries: {
          orderBy: { deliveredAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// 2. POST /api/webhooks - Register a new webhook endpoint
router.post("/", async (req: Request, res: Response) => {
  try {
    const { url, secret, events = "punch.verified,attendance.marked", orgId } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }

    const autoSecret = secret || crypto.randomBytes(24).toString("hex");

    const webhook = await prisma.webhookConfig.create({
      data: {
        url,
        secret: autoSecret,
        events,
        orgId: orgId || null,
        active: true,
      },
    });

    res.status(201).json({ ok: true, webhook });
  } catch (error) {
    console.error("Error creating webhook:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

// 3. DELETE /api/webhooks/:id - Delete a webhook endpoint
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.webhookConfig.delete({ where: { id } });
    res.json({ ok: true, deleted: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// 4. POST /api/webhooks/test - Test trigger a sample ping webhook
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body;
    await dispatchWebhook("ping.test", { message: "Test webhook from PunchOS", testAt: new Date().toISOString() }, orgId);
    res.json({ ok: true, message: "Test webhook dispatched" });
  } catch (error) {
    console.error("Error testing webhook:", error);
    res.status(500).json({ error: "Failed to dispatch test webhook" });
  }
});

export default router;
