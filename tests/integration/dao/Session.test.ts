import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { sql } from 'bun';
import { SessionDAO, UserDAO } from '../../test-setup';

let userId: number;

beforeEach(async () => {
  // using exported instances from test-setup

  await sql`
    TRUNCATE TABLE refresh_tokens CASCADE;

    TRUNCATE TABLE sessions CASCADE;

    TRUNCATE TABLE users CASCADE;
  `.simple();

  const user = await UserDAO.createUser(
    'test_user',
    'session@test.com',
    'pass123',
  );
  userId = user!.user_id;
});

afterEach(async () => {
  await sql`
    TRUNCATE TABLE refresh_tokens CASCADE;

    TRUNCATE TABLE sessions CASCADE;

    TRUNCATE TABLE users CASCADE;
  `.simple();
});

describe('SessionDAO.createSession', () => {
  test('should create a session successfully', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const session = await SessionDAO.createSession(
      userId,
      expires,
      '127.0.0.1',
      'BunTest',
      'Mac',
    );
    expect(session).not.toBeNull();
    expect(session!.user_id).toBe(userId);
    expect(session!.expires_at).toBeInstanceOf(Date);
  });

  test('should create a session without optional params', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const session = await SessionDAO.createSession(userId, expires);
    expect(session).not.toBeNull();
    expect(session!.ip_address).toBeNull();
  });

  test('should fail if user_id does not exist', async () => {
    try {
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await SessionDAO.createSession(999999, expires);
      throw new Error('Expected failure for non-existent user_id');
    } catch (err: any) {
      expect(err.message).toMatch(/violates foreign key constraint/i);
    }
  });
});

describe('SessionDAO.revokeSession', () => {
  test('should revoke existing session', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await SessionDAO.createSession(userId, expires);
    const success = await SessionDAO.revokeSession(session!.session_id);
    expect(success).toBeTrue();

    const [row] = await sql`
      SELECT
        is_active
      FROM
        sessions
      WHERE
        session_id = ${session!.session_id}
    `;
    expect(row.is_active).toBeFalse();
  });

  test('should return false if session does not exist', async () => {
    const result = await SessionDAO.revokeSession('nonexistent-session-id');
    expect(result).toBeFalse();
  });
});

describe('SessionDAO.extendSession', () => {
  test('should extend session expiry', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await SessionDAO.createSession(userId, expires);
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5);
    const extended = await SessionDAO.extendSession(
      session!.session_id,
      newExpiry,
    );

    expect(extended).not.toBeNull();
    expect(new Date(extended!.expires_at).getTime()).toBeCloseTo(
      newExpiry.getTime(),
      -2,
    );
  });

  test('should return null for non-existent session', async () => {
    const extended = await SessionDAO.extendSession('fake-id');
    expect(extended).toBeNull();
  });
});

describe('SessionDAO.getActiveSessions', () => {
  test('should return active sessions for user', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await SessionDAO.createSession(userId, expires);
    const sessions = await SessionDAO.getActiveSessions(userId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].is_active).toBeTrue();
  });

  test('should return empty list for inactive user sessions', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await SessionDAO.createSession(userId, expires);
    await SessionDAO.revokeSession(session!.session_id);

    const sessions = await SessionDAO.getActiveSessions(userId);
    expect(sessions.length).toBe(0);
  });
});

describe('SessionDAO.touchSessionLastUsed', () => {
  test('should update last_used_at timestamp', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await SessionDAO.createSession(userId, expires);
    const updated = await SessionDAO.touchSessionLastUsed(session!.session_id);
    expect(updated).not.toBeNull();
    expect(updated!.last_used_at).toBeInstanceOf(Date);
  });
});

describe('SessionDAO.cleanupExpiredSessionsAndTokens', () => {
  test('should mark expired sessions as inactive and revoke expired tokens', async () => {
    const expired = new Date(Date.now() - 1000 * 60 * 60);
    await SessionDAO.createSession(userId, expired);
    const result = await SessionDAO.cleanupExpiredSessionsAndTokens();
    expect(result).toBeTrue();

    const [session] = await sql`
      SELECT
        is_active
      FROM
        sessions
      WHERE
        user_id = ${userId}
    `;
    expect(session.is_active).toBeFalse();
  });

  test('should return false if nothing to clean', async () => {
    const active = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await SessionDAO.createSession(userId, active);
    const result = await SessionDAO.cleanupExpiredSessionsAndTokens();
    expect(result).toBeFalse();
  });
});

describe('SessionDAO.revokeAllUserSessions', () => {
  test('should revoke all sessions for a user and not affect others', async () => {
    // stwórz dodatkowego użytkownika
    const otherUser = await UserDAO.createUser(
      'other_user',
      'other@test.com',
      'pass456',
    );
    const otherUserId = otherUser!.user_id;

    // stwórz sesje dla głównego usera
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await Promise.all([
      SessionDAO.createSession(userId, expires),
      SessionDAO.createSession(userId, expires),
    ]);

    // stwórz sesję dla innego usera
    await SessionDAO.createSession(otherUserId, expires);

    const result = await SessionDAO.revokeAllUserSessions(userId);
    expect(result).toBeTrue();

    const activeForUser = await sql`
      SELECT
        COUNT(*) AS cnt
      FROM
        sessions
      WHERE
        user_id = ${userId}
        AND is_active = TRUE
    `;
    expect(Number(activeForUser[0].cnt)).toBe(0);

    const activeForOther = await sql`
      SELECT
        COUNT(*) AS cnt
      FROM
        sessions
      WHERE
        user_id = ${otherUserId}
        AND is_active = TRUE
    `;
    expect(Number(activeForOther[0].cnt)).toBeGreaterThanOrEqual(1);
  });

  test('should return false if there are no active sessions to revoke', async () => {
    const lonelyUser = await UserDAO.createUser(
      'lonely_user',
      'lonely@test.com',
      'nopass',
    );
    const lonelyUserId = lonelyUser!.user_id;

    // nie tworzymy sesji dla lonelyUser => nic do revoke
    const result = await SessionDAO.revokeAllUserSessions(lonelyUserId);
    expect(result).toBeFalse();
  });
});
