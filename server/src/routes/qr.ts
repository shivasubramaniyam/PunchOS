import { Router, Request, Response } from "express";
import {
  generateQrToken,
  generateQrDataUrl,
  getLocalIp,
} from "../services/qr.js";

const router = Router();

// GET /api/qr/current - Active rotating QR token and PNG data-URL
router.get("/current", async (_req: Request, res: Response) => {
  const port = process.env.PORT || 8000;
  const ip = getLocalIp();
  const { token, expiresIn } = generateQrToken();

  // URL payload encoded in QR (can be scanned directly by phone browser or PWA)
  const qrUrl = `http://${ip}:${port}/add_manually?token=${encodeURIComponent(token)}`;

  try {
    const qrImage = await generateQrDataUrl(qrUrl);

    res.json({
      token,
      url: qrUrl,
      image: qrImage,
      expiresIn,
    });
  } catch (error) {
    console.error("Error generating QR:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

export default router;
