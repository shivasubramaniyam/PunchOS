import type { Response } from "express";

interface SseClient {
  id: number;
  res: Response;
}

let nextClientId = 1;
const clients: SseClient[] = [];

export function registerSseClient(res: Response): number {
  const id = nextClientId++;
  clients.push({ id, res });

  // Send initial connected event
  res.write(
    `data: ${JSON.stringify({ type: "connected", payload: { clientId: id } })}\n\n`,
  );

  return id;
}

export function unregisterSseClient(id: number): void {
  const index = clients.findIndex((c) => c.id === id);
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

export function broadcast(type: string, payload: unknown): void {
  const message = `data: ${JSON.stringify({ type, payload })}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(message);
    } catch {
      // Client disconnected, ignore write error
    }
  }
}

// Periodic keep-alive heartbeat every 20 seconds
setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(": keep-alive\n\n");
    } catch {
      // Ignore
    }
  }
}, 20000);
