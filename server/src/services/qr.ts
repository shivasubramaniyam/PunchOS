import crypto from "crypto";
import QRCode from "qrcode";
import os from "os";

export const QR_TOKEN_TTL_SECONDS = 45;
const SECRET =
  process.env.TOKEN_SECRET || "qr-attendance-super-secret-key-2026";

export function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

export function getCurrentSlot(): number {
  return Math.floor(Date.now() / 1000 / QR_TOKEN_TTL_SECONDS);
}

export function getRemainingSlotSeconds(): number {
  const nowSec = Math.floor(Date.now() / 1000);
  return QR_TOKEN_TTL_SECONDS - (nowSec % QR_TOKEN_TTL_SECONDS);
}

export function generateQrToken(): { token: string; expiresIn: number } {
  const slot = getCurrentSlot();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = JSON.stringify({ slot, nonce });
  const signature = crypto
    .createHmac("sha256", `${SECRET}:slot:${slot}`)
    .update(payload)
    .digest("hex");
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString(
    "base64url",
  );
  const expiresIn = getRemainingSlotSeconds();

  return { token, expiresIn };
}

export function verifyQrToken(token: string): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { payload, signature } = JSON.parse(raw);
    const { slot } = JSON.parse(payload);
    const current = getCurrentSlot();

    // Accept current slot or immediately preceding slot for clock drift
    if (slot !== current && slot !== current - 1) {
      return false;
    }

    const expectedSig = crypto
      .createHmac("sha256", `${SECRET}:slot:${slot}`)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig),
    );
  } catch {
    return false;
  }
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
