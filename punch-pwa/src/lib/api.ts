/**
 * Client for the Django punch endpoints, with clock-offset measurement
 * so the 3-second QR slots line up with the server even when the
 * phone's clock drifts.
 */

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }
  return process.env.NEXT_PUBLIC_PUNCH_API_URL || "http://localhost:8000";
}

export const API_BASE = getApiBase();

let clockOffsetMs = 0;

export function serverNow(): number {
  return Date.now() + clockOffsetMs;
}

export async function measureClockOffset(): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  const t0 = Date.now();

  try {
    const res = await fetch(`${getApiBase()}/api/punch/time`, {
      signal: controller.signal,
      cache: "no-store",
    });
    const t1 = Date.now();
    if (res.ok) {
      const body = (await res.json()) as { serverTimeMs: number };
      const rtt = t1 - t0;
      clockOffsetMs = body.serverTimeMs + rtt / 2 - t1;
    }
  } catch {
    // Timeout or network error — fallback gracefully to local clock
  } finally {
    clearTimeout(timer);
  }
  return clockOffsetMs;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return data as T;
}

// --- Enrollment ------------------------------------------------------------

export interface EnrollResponse {
  studentId: string;
  challenge: string;
  protocol: { version: number; slotSeconds: number; prefix: string; acceptedSlotsBack: number };
  rpId: string;
  expiresIn: number;
}

export function beginEnrollment(studentId: string): Promise<EnrollResponse> {
  return post<EnrollResponse>("/api/punch/enroll", { studentId });
}

export interface EnrollFinishResponse {
  ok: boolean;
  keyId: string;
  created: boolean;
  trustTier: number;
}

export function finishEnrollment(input: {
  studentId: string;
  publicKeyJwk: unknown;
  challenge: string;
  label: string;
}): Promise<EnrollFinishResponse> {
  return post<EnrollFinishResponse>("/api/punch/enroll/finish", input);
}

export interface KeyStatusResponse {
  studentId: string;
  enrolled: boolean;
  keys: Array<{
    keyId: string;
    label: string;
    trustTier: number;
    hardwareBacked: boolean;
    createdAt: string;
  }>;
}

export async function fetchKeyStatus(studentId: string): Promise<KeyStatusResponse> {
  const res = await fetch(`${getApiBase()}/api/punch/key-status?studentId=${encodeURIComponent(studentId)}`);
  if (!res.ok) throw new Error("key status failed");
  return res.json();
}

// --- Passkey (WebAuthn) ------------------------------------------------------

export interface PasskeyInitResponse {
  publicKey: {
    rp: { id: string; name: string };
    user: { id: string; name: string; displayName: string };
    challenge: string;
    pubKeyCredParams: Array<{ type: string; alg: number }>;
    timeout: number;
    attestation: string;
    authenticatorSelection: { residentKey: string; userVerification: string };
  };
}

export function passkeyRegistrationOptions(studentId: string): Promise<PasskeyInitResponse> {
  return post<PasskeyInitResponse>("/api/punch/passkey/init", { studentId });
}

export interface PasskeyDoneResponse {
  ok: boolean;
  credentialId: string;
  trustTier: number;
  hardwareBacked: boolean;
}

export function completePasskeyRegistration(studentId: string, credential: unknown): Promise<PasskeyDoneResponse> {
  return post<PasskeyDoneResponse>("/api/punch/passkey/done", { studentId, response: credential });
}

export interface PasskeyAuthResponse {
  publicKey: {
    challenge: string;
    rpId: string;
    timeout: number;
    userVerification: string;
    allowCredentials: Array<{ type: string; id: string }>;
  };
}

export function passkeyAssertionOptions(studentId: string): Promise<PasskeyAuthResponse> {
  return post<PasskeyAuthResponse>("/api/punch/passkey/auth", { studentId });
}

export interface PasskeyCheckResponse {
  ok: boolean;
  unlockToken: string;
  expiresIn: number;
}

export function verifyPasskeyAssertion(studentId: string, assertion: unknown): Promise<PasskeyCheckResponse> {
  return post<PasskeyCheckResponse>("/api/punch/passkey/check", { studentId, response: assertion });
}
