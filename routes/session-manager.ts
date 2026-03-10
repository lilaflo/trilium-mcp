import { randomUUID } from "crypto";
import { formatError } from "../tools/etapi.js";

export interface SessionTransport {
  transport: any;
  server: any;
  createdAt: number;
}

export const sessions = new Map<string, SessionTransport>();

let lastSessionCreationTime = 0;
const RATE_LIMIT_MS = 5000;
let SESSION_TTL_MS = 5 * 60 * 1000;

export function setSessionTtl(ttlMs: number): void {
  SESSION_TTL_MS = ttlMs;
}

export function clearSessions(): void {
  sessions.clear();
}

export function parseSessionTtl(input: string): number {
  const match = input.match(/^(\d+)(s|m|h)$/);
  if (!match) {
    console.warn(`Invalid SESSION_TTL format: ${input}, defaulting to 5m`);
    return 5 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

export function generateSessionId(): string {
  try {
    return randomUUID();
  } catch {
    console.debug("[SESSION] crypto.randomUUID unavailable, using fallback");
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

export function isValidSessionId(sessionId: string): boolean {
  return typeof sessionId === "string" && sessionId.length >= 16 && sessionId.length <= 128;
}

export function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastSessionCreationTime < RATE_LIMIT_MS) {
    return false;
  }
  lastSessionCreationTime = now;
  return true;
}

export function resetRateLimit(): void {
  lastSessionCreationTime = 0;
}

export function isSessionExpired(session: SessionTransport): boolean {
  return Date.now() - session.createdAt > SESSION_TTL_MS;
}

function createSessionError(message: string, code: number) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ error: message }, null, 2)
    }],
    isError: true,
    code
  };
}

export function validateSession(sessionId: string): { valid: boolean; session?: SessionTransport; error?: ReturnType<typeof createSessionError> } {
  if (!isValidSessionId(sessionId)) {
    return { valid: false, error: createSessionError("Invalid session ID", 400) };
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return { valid: false, error: createSessionError("Session not found", 404) };
  }

  if (isSessionExpired(session)) {
    console.debug(`[SESSION] Expired session: ${sessionId}`);
    sessions.delete(sessionId);
    return { valid: false, error: createSessionError("Session expired", 410) };
  }

  return { valid: true, session };
}
