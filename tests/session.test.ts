import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  parseSessionTtl,
  generateSessionId,
  isValidSessionId,
  checkRateLimit,
  isSessionExpired,
  validateSession,
  sessions,
  resetRateLimit,
  clearSessions,
  setSessionTtl
} from '../routes/session-manager.js';

describe('Session Management', () => {
  beforeEach(() => {
    resetRateLimit();
    clearSessions();
  });

  afterEach(() => {
    clearSessions();
    resetRateLimit();
  });

  describe('parseSessionTtl', () => {
    it('should parse seconds correctly', () => {
      expect(parseSessionTtl('30s')).toBe(30000);
    });

    it('should parse minutes correctly', () => {
      expect(parseSessionTtl('5m')).toBe(300000);
    });

    it('should parse hours correctly', () => {
      expect(parseSessionTtl('1h')).toBe(3600000);
    });

    it('should parse large hours correctly', () => {
      expect(parseSessionTtl('24h')).toBe(86400000);
    });

    it('should default to 5m for invalid format', () => {
      expect(parseSessionTtl('invalid')).toBe(300000);
      expect(parseSessionTtl('')).toBe(300000);
    });

    it('should default to 5m for unknown unit', () => {
      expect(parseSessionTtl('10d')).toBe(300000);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a valid UUID', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate valid length IDs', () => {
      const id = generateSessionId();
      expect(id.length).toBeGreaterThanOrEqual(16);
      expect(id.length).toBeLessThanOrEqual(128);
    });
  });

  describe('isValidSessionId', () => {
    it('should accept valid UUID', () => {
      expect(isValidSessionId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should accept minimum length (16 chars)', () => {
      expect(isValidSessionId('a'.repeat(16))).toBe(true);
    });

    it('should accept maximum length (128 chars)', () => {
      expect(isValidSessionId('a'.repeat(128))).toBe(true);
    });

    it('should reject short IDs (< 16)', () => {
      expect(isValidSessionId('abc')).toBe(false);
    });

    it('should reject long IDs (> 128)', () => {
      expect(isValidSessionId('a'.repeat(129))).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(isValidSessionId('')).toBe(false);
      expect(isValidSessionId(null as any)).toBe(false);
      expect(isValidSessionId(undefined as any)).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first session creation', () => {
      expect(checkRateLimit()).toBe(true);
    });

    it('should block rapid session creation', () => {
      checkRateLimit();
      expect(checkRateLimit()).toBe(false);
    });

    it('should allow session creation after cooldown', async () => {
      checkRateLimit();
      await new Promise(resolve => setTimeout(resolve, 5100));
      expect(checkRateLimit()).toBe(true);
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for fresh session', () => {
      const session = {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now()
      };
      expect(isSessionExpired(session)).toBe(false);
    });

    it('should return true for expired session', () => {
      setSessionTtl(100);
      const session = {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now() - 200
      };
      expect(isSessionExpired(session)).toBe(true);
    });

    it('should return false for session at exact TTL boundary', () => {
      setSessionTtl(1000);
      const session = {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now() - 999
      };
      expect(isSessionExpired(session)).toBe(false);
    });

    it('should return true for session just past TTL boundary', () => {
      setSessionTtl(1000);
      const session = {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now() - 1001
      };
      expect(isSessionExpired(session)).toBe(true);
    });
  });

  describe('validateSession', () => {
    it('should reject invalid session ID length', () => {
      const result = validateSession('abc');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(400);
      expect(result.error?.content[0].text).toContain('Invalid session ID');
    });

    it('should reject non-existent session', () => {
      const result = validateSession('550e8400-e29b-41d4-a716-446655440000');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(404);
      expect(result.error?.content[0].text).toContain('Session not found');
    });

    it('should reject expired session', () => {
      setSessionTtl(100);
      const sessionId = '550e8400-e29b-41d4-a716-446655440000';
      sessions.set(sessionId, {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now() - 200
      });

      const result = validateSession(sessionId);

      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe(410);
      expect(result.error?.content[0].text).toContain('Session expired');
      expect(sessions.has(sessionId)).toBe(false);
    });

    it('should validate and return valid session', () => {
      setSessionTtl(60000);
      const sessionId = '550e8400-e29b-41d4-a716-446655440000';
      const mockSession = {
        transport: {} as any,
        server: {} as any,
        createdAt: Date.now()
      };
      sessions.set(sessionId, mockSession);

      const result = validateSession(sessionId);

      expect(result.valid).toBe(true);
      expect(result.session).toBe(mockSession);
    });
  });
});
