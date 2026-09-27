import crypto from "crypto";
import { prisma } from "../db.js";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Dispatch an outbound webhook to all active registered webhook endpoints for an organization.
 * Signs payloads with HMAC-SHA256 in the X-Punch-Signature header.
 */
export async function dispatchWebhook(
  event: string,
  data: Record<string, any>,
  orgId?: string
) {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        active: true,
        OR: [{ orgId: null }, { orgId: orgId ?? undefined }],
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const bodyStr = JSON.stringify(payload);

    for (const hook of webhooks) {
      // Check if this webhook subscribes to this event
      const subscribedEvents = hook.events.split(",").map((e) => e.trim());
      if (
        !subscribedEvents.includes("*") &&
        !subscribedEvents.includes(event)
      ) {
        continue;
      }

      const hmac = crypto
        .createHmac("sha256", hook.secret)
        .update(bodyStr)
        .digest("hex");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Punch-Event": event,
          "X-Punch-Signature": `sha256=${hmac}`,
          "User-Agent": "PunchOS-Webhook-Dispatcher/2.0",
        },
        body: bodyStr,
        signal: controller.signal,
      })
        .then(async (res) => {
          clearTimeout(timeoutId);
          const resText = await res.text().catch(() => "");
          await prisma.webhookDelivery.create({
            data: {
              webhookId: hook.id,
              event,
              statusCode: res.status,
              payload: bodyStr,
              response: resText.slice(0, 1000),
            },
          });
        })
        .catch(async (err: unknown) => {
          clearTimeout(timeoutId);
          const errMsg = err instanceof Error ? err.message : "Network error";
          await prisma.webhookDelivery.create({
            data: {
              webhookId: hook.id,
              event,
              statusCode: 504,
              payload: bodyStr,
              response: errMsg,
            },
          });
        });
    }
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}
