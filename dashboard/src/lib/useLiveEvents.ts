"use client";

import { useEffect, useRef } from "react";

import { API_BASE } from "./api";
import type { LiveEvent } from "./types";

/**
 * Subscribes to the Django SSE stream (`/api/events`) and invokes `onEvent`
 * for every attendance/student event. Reconnects automatically (retry: 3000).
 */
export function useLiveEvents(onEvent: (event: LiveEvent) => void): void {
  const handler = useRef(onEvent);

  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/events`);

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as LiveEvent;
        handler.current(event);
      } catch {
        // ignore malformed frames
      }
    };

    return () => source.close();
  }, []);
}
