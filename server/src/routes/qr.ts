import { Router, Request, Response } from "express";
import {
  generateQrToken,
  generateQrDataUrl,
} from "../services/qr.js";

const router = Router();

// GET /api/qr/current - Active rotating QR token and PNG data-URL
router.get("/current", async (req: Request, res: Response) => {
  const host = req.get("host") || `localhost:${process.env.PORT || 8000}`;
  const protocol = req.protocol || "http";
  const baseUrl = process.env.PUBLIC_URL || process.env.APP_URL || `${protocol}://${host}`;
  const { token, expiresIn } = generateQrToken();

  // URL payload encoded in QR (works on any network/domain/host)
  const qrUrl = `${baseUrl.replace(/\/$/, "")}/add_manually?token=${encodeURIComponent(token)}`;

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
