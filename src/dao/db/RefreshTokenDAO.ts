import { RefreshToken } from '@src/types';
import { BaseDAO } from './BaseDao';
import { IRefreshTokenDAO, SessionWithLastToken } from './interfaces';
import { IDbClient } from '@src/db/interfaces';

export class RefreshTokenDAO extends BaseDAO implements IRefreshTokenDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async issueRefreshToken(
    sessionId: string,
    userId: number,
    expiresAt: Date,
    rawToken: string,
  ): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      'SELECT * FROM issue_refresh_token($1, $2, $3, $4)',
      [sessionId, userId, expiresAt, rawToken],
    );
  }

  async rotateRefreshToken(
    oldTokenHash: string,
    newExpiresAt: Date,
    newRawToken: string,
  ): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      'SELECT * FROM rotate_refresh_token($1, $2, $3)',
      [oldTokenHash, newExpiresAt, newRawToken],
    );
  }

  async isRefreshTokenValid(tokenHash: string): Promise<boolean> {
    return this.scalar('SELECT is_refresh_token_valid($1)', [tokenHash]);
  }

  async revokeRefreshToken(
    tokenHash: string,
    revokeSession?: boolean,
  ): Promise<boolean> {
    return this.scalar('SELECT revoke_refresh_token($1, $2)', [
      tokenHash,
      revokeSession ?? false,
    ]);
  }

  async getRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash],
    );
  }

  async getRefreshTokensBySession(sessionId: string): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      'SELECT * FROM get_refresh_tokens_by_session($1)',
      [sessionId],
    );
  }

  async getUserTokenHistory(
    userId: number,
    limit?: number,
  ): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      'SELECT * FROM get_user_token_history($1, $2)',
      [userId, limit ?? 1000],
    );
  }

  async markRefreshTokenUsed(tokenHash: string): Promise<boolean> {
    return this.scalar('SELECT mark_refresh_token_used($1)', [tokenHash]);
  }

  async replaceRefreshToken(
    oldTokenHash: string,
    newTokenId: string,
  ): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      'SELECT * FROM replace_refresh_token($1, $2)',
      [oldTokenHash, newTokenId],
    );
  }

  async cleanupExpiredSessionsTokens(): Promise<boolean> {
    return this.scalar('SELECT cleanup_expired_sessions_tokens()', []);
  }

  async getSessionsWithRefreshTokens(
    userId: number,
  ): Promise<SessionWithLastToken[]> {
    return this.executeQueryMultiple<SessionWithLastToken>(
      'SELECT * FROM get_sessions_with_refresh_tokens($1)',
      [userId],
    );
  }
  async revokeTokensBySession(sessionId: string): Promise<boolean> {
    return this.scalar('SELECT revoke_tokens_by_session($1)', [sessionId]);
  }

  async rotateAndReturnRawToken(
    oldTokenHash: string,
    newExpiresAt: Date,
  ): Promise<string | null> {
    return this.executeQuery<string>(
      'SELECT rotate_and_return_raw_token($1, $2)',
      [oldTokenHash, newExpiresAt],
    );
  }
}
