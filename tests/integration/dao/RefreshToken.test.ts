import { beforeEach, afterEach, describe, test, expect } from 'bun:test';
import { sql } from 'bun';
import { RefreshTokenDAO, UserDAO } from '../../test-setup';

let userId: number;
let sessionId: string;
let tokenHash: string;
let rawToken = 'raw_token_example';

beforeEach(async () => {
  // dao and userDao are imported from test-setup

  await sql`
    TRUNCATE TABLE refresh_tokens,
    sessions RESTART IDENTITY CASCADE;

    TRUNCATE TABLE users RESTART IDENTITY CASCADE;
  `.simple();

  const createdUser = await UserDAO.createUser(
    'testuser',
    'test@example.com',
    'hashed_password',
  );
  userId = createdUser.user_id;

  const expires = new Date(Date.now() + 1000 * 60 * 60);
  const session = await sql`
    SELECT
      *
    FROM
      create_session (
        ${userId},
        ${expires},
        '127.0.0.1',
        'bun-test',
        'linux'
      )
  `;
  sessionId = session[0].session_id;

  const issued = await RefreshTokenDAO.issueRefreshToken(
    sessionId,
    userId,
    expires,
    rawToken,
  );
  tokenHash = issued!.token_hash;
});

afterEach(async () => {
  await sql`
    TRUNCATE TABLE refresh_tokens,
    sessions RESTART IDENTITY CASCADE
  `;
});

describe('RefreshTokenDAO – issuing and fetching', () => {
  test('should issue a new refresh token', async () => {
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 2);
    const token = await RefreshTokenDAO.issueRefreshToken(
      sessionId,
      userId,
      expires,
      'new_raw_token',
    );
    expect(token).not.toBeNull();
    expect(token!.user_id).toBe(userId);
    expect(token!.session_id).toBe(sessionId);
  });

  test('should fail issuing token when raw_token empty', async () => {
    await expect(
      RefreshTokenDAO.issueRefreshToken(sessionId, userId, new Date(), ''),
    ).rejects.toThrow();
  });

  test('should get token by hash', async () => {
    const token = await RefreshTokenDAO.getRefreshToken(tokenHash);
    expect(token).not.toBeNull();
    expect(token!.token_hash).toBe(tokenHash);
  });

  test('should return null when getting nonexistent token', async () => {
    const token = await RefreshTokenDAO.getRefreshToken('nonexistent_hash');
    expect(token).toBeNull();
  });
});

describe('RefreshTokenDAO – validation & revocation', () => {
  test('should validate active token', async () => {
    const valid = await RefreshTokenDAO.isRefreshTokenValid(tokenHash);
    expect(valid).toBe(true);
  });

  test('should return false for expired token', async () => {
    await sql`
      UPDATE refresh_tokens
      SET
        expires_at = NOW () - INTERVAL '1 minute'
    `;
    const valid = await RefreshTokenDAO.isRefreshTokenValid(tokenHash);
    expect(valid).toBe(false);
  });

  test('should return false for revoked token', async () => {
    await RefreshTokenDAO.revokeRefreshToken(tokenHash);
    const valid = await RefreshTokenDAO.isRefreshTokenValid(tokenHash);
    expect(valid).toBe(false);
  });

  test('should revoke refresh token only', async () => {
    const revoked = await RefreshTokenDAO.revokeRefreshToken(tokenHash);
    expect(revoked).toBe(true);
    const token = await RefreshTokenDAO.getRefreshToken(tokenHash);
    expect(token!.revoked_at).not.toBeNull();
  });

  test('should revoke refresh token and linked session', async () => {
    const revoked = await RefreshTokenDAO.revokeRefreshToken(tokenHash, true);
    expect(revoked).toBe(true);
    const session = await sql`
      SELECT
        *
      FROM
        sessions
      WHERE
        session_id = ${sessionId}
    `;
    expect(session[0].is_active).toBe(false);
  });

  test('should return false when revoking nonexistent token', async () => {
    const revoked =
      await RefreshTokenDAO.revokeRefreshToken('nonexistent_hash');
    expect(revoked).toBe(false);
  });
});

describe('RefreshTokenDAO – rotation', () => {
  test('should rotate token and create new one', async () => {
    const newExpires = new Date(Date.now() + 1000 * 60 * 60 * 3);
    const rotated = await RefreshTokenDAO.rotateRefreshToken(
      tokenHash,
      newExpires,
      'rotated_raw',
    );
    expect(rotated).not.toBeNull();
    expect(rotated!.token_hash).not.toBe(tokenHash);
  });

  test('should fail rotation for nonexistent token', async () => {
    const newExpires = new Date(Date.now() + 1000 * 60 * 60 * 3);
    await expect(
      RefreshTokenDAO.rotateRefreshToken(
        'invalid_hash',
        newExpires,
        'rotated_raw',
      ),
    ).rejects.toThrow();
  });

  test('should rotate and return raw token', async () => {
    const newExpires = new Date(Date.now() + 1000 * 60 * 60);
    const raw = await RefreshTokenDAO.rotateAndReturnRawToken(
      tokenHash,
      newExpires,
    );

    // jeśli DAO zwróci obiekt { rotate_and_return_raw_token: '...' } rozpakowujemy wartość
    const rawStr =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object'
          ? String(Object.values(raw)[0])
          : null;

    expect(typeof rawStr).toBe('string');
    expect(rawStr!.length).toBeGreaterThan(10);
  });
});

describe('RefreshTokenDAO – maintenance and cleanup', () => {
  test('should mark refresh token as used', async () => {
    const marked = await RefreshTokenDAO.markRefreshTokenUsed(tokenHash);
    expect(marked).toBe(true);
    const updated = await RefreshTokenDAO.getRefreshToken(tokenHash);
    expect(updated!.used_at).not.toBeNull();
  });

  test('should replace refresh token link', async () => {
    // utwórz nowy token i użyj jego id jako replaced_by_id (unikamy FK error)
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 2);
    const newToken = await RefreshTokenDAO.issueRefreshToken(
      sessionId,
      userId,
      expires,
      'replacement_raw',
    );

    // próbujemy pobrać id z kilku możliwych pól zwracanych przez DAO
    const newTokenId = (newToken as any)?.token_id ?? null;

    if (!newTokenId) {
      throw new Error(
        'Could not determine new token id for replaceRefreshToken test',
      );
    }

    const tokens = await RefreshTokenDAO.replaceRefreshToken(
      tokenHash,
      String(newTokenId),
    );
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].replaced_by_id).toBe(String(newTokenId));
  });

  test('should cleanup expired sessions and tokens', async () => {
    await sql`
      UPDATE refresh_tokens
      SET
        expires_at = NOW () - INTERVAL '2 hours'
    `;
    const cleaned = await RefreshTokenDAO.cleanupExpiredSessionsTokens();
    expect(cleaned).toBe(true);
  });

  test('should revoke tokens by session', async () => {
    const revoked = await RefreshTokenDAO.revokeTokensBySession(sessionId);
    expect(revoked).toBe(true);
    const tokens = await RefreshTokenDAO.getRefreshTokensBySession(sessionId);
    expect(tokens.every((t: any) => t.revoked_at !== null)).toBe(true);
  });
});
