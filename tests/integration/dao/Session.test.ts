import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { sql } from 'bun';
import { SessionDAO } from '@src/dao/SessionDAO';
import { UserDAO } from '@src/dao/Users';

let sessionDao: SessionDAO;
let userDao: UserDAO;
let userId: number;

beforeEach(async () => {
  sessionDao = new SessionDAO();
  userDao = UserDAO.getInstance();

  await sql`TRUNCATE TABLE refresh_tokens CASCADE`;
  await sql`TRUNCATE TABLE sessions CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;

  const user = await userDao.createUser(
    'test_user',
    'session@test.com',
    'pass123',
  );
  userId = user!.user_id;
});

afterEach(async () => {
  await sql`TRUNCATE TABLE refresh_tokens CASCADE`;
  await sql`TRUNCATE TABLE sessions CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;
});

describe('SessionDAO.createSession', () => {
  test('should create a session successfully', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const session = await sessionDao.createSession(
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
    const session = await sessionDao.createSession(userId, expires);
    expect(session).not.toBeNull();
    expect(session!.ip_address).toBeNull();
  });

  test('should fail if user_id does not exist', async () => {
    try {
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await sessionDao.createSession(999999, expires);
      throw new Error('Expected failure for non-existent user_id');
    } catch (err: any) {
      expect(err.message).toMatch(/violates foreign key constraint/i);
    }
  });
});

describe('SessionDAO.revokeSession', () => {
  test('should revoke existing session', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await sessionDao.createSession(userId, expires);
    const success = await sessionDao.revokeSession(session!.session_id);
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
    const result = await sessionDao.revokeSession('nonexistent-session-id');
    expect(result).toBeFalse();
  });
});

describe('SessionDAO.extendSession', () => {
  test('should extend session expiry', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await sessionDao.createSession(userId, expires);
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5);
    const extended = await sessionDao.extendSession(
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
    const extended = await sessionDao.extendSession('fake-id');
    expect(extended).toBeNull();
  });
});

describe('SessionDAO.getActiveSessions', () => {
  test('should return active sessions for user', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await sessionDao.createSession(userId, expires);
    const sessions = await sessionDao.getActiveSessions(userId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].is_active).toBeTrue();
  });

  test('should return empty list for inactive user sessions', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await sessionDao.createSession(userId, expires);
    await sessionDao.revokeSession(session!.session_id);

    const sessions = await sessionDao.getActiveSessions(userId);
    expect(sessions.length).toBe(0);
  });
});

describe('SessionDAO.touchSessionLastUsed', () => {
  test('should update last_used_at timestamp', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const session = await sessionDao.createSession(userId, expires);
    const updated = await sessionDao.touchSessionLastUsed(session!.session_id);
    expect(updated).not.toBeNull();
    expect(updated!.last_used_at).toBeInstanceOf(Date);
  });
});

describe('SessionDAO.cleanupExpiredSessionsAndTokens', () => {
  test('should mark expired sessions as inactive and revoke expired tokens', async () => {
    const expired = new Date(Date.now() - 1000 * 60 * 60);
    await sessionDao.createSession(userId, expired);
    const result = await sessionDao.cleanupExpiredSessionsAndTokens();
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
    await sessionDao.createSession(userId, active);
    const result = await sessionDao.cleanupExpiredSessionsAndTokens();
    expect(result).toBeFalse();
  });
});

describe('SessionDAO.revokeAllUserSessions', () => {
  test('should revoke all sessions for a user and not affect others', async () => {
    // stwórz dodatkowego użytkownika
    const otherUser = await userDao.createUser(
      'other_user',
      'other@test.com',
      'pass456',
    );
    const otherUserId = otherUser!.user_id;

    // stwórz sesje dla głównego usera
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await sessionDao.createSession(userId, expires);
    await sessionDao.createSession(userId, expires);

    // stwórz sesję dla innego usera
    await sessionDao.createSession(otherUserId, expires);

    const result = await sessionDao.revokeAllUserSessions(userId);
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
    const lonelyUser = await userDao.createUser(
      'lonely_user',
      'lonely@test.com',
      'nopass',
    );
    const lonelyUserId = lonelyUser!.user_id;

    // nie tworzymy sesji dla lonelyUser => nic do revoke
    const result = await sessionDao.revokeAllUserSessions(lonelyUserId);
    expect(result).toBeFalse();
  });
});
