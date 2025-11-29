import { RefreshToken } from '@src/types';
import { BaseDAO } from './BaseDao';
import { IRefreshTokenDAO, SessionWithLastToken } from './interfaces';
import { sql } from 'bun';

export class RefreshTokenDAO extends BaseDAO implements IRefreshTokenDAO {
  private constructor() {
    super();
  }

  async issueRefreshToken(
    sessionId: string,
    userId: number,
    expiresAt: Date,
    rawToken: string,
  ): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          issue_refresh_token (
            ${sessionId},
            ${userId},
            ${expiresAt},
            ${rawToken}
          )
      `,
    );
  }

  async rotateRefreshToken(
    oldTokenHash: string,
    newExpiresAt: Date,
    newRawToken: string,
  ): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          rotate_refresh_token (
            ${oldTokenHash},
            ${newExpiresAt},
            ${newRawToken}
          )
      `,
    );
  }

  async isRefreshTokenValid(tokenHash: string): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          is_refresh_token_valid (${tokenHash})
      `,
    );
  }

  async revokeRefreshToken(
    tokenHash: string,
    revokeSession?: boolean,
  ): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          revoke_refresh_token (
            ${tokenHash},
            ${revokeSession ?? false}
          )
      `,
    );
  }

  async getRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.executeQuery<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          refresh_tokens
        WHERE
          token_hash = ${tokenHash}
      `,
    );
  }

  async getRefreshTokensBySession(sessionId: string): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          get_refresh_tokens_by_session (${sessionId})
      `,
    );
  }

  async getUserTokenHistory(
    userId: number,
    limit?: number,
  ): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          get_user_token_history (
            ${userId},
            ${limit ?? 1000}
          )
      `,
    );
  }

  async markRefreshTokenUsed(tokenHash: string): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          mark_refresh_token_used (${tokenHash})
      `,
    );
  }

  async replaceRefreshToken(
    oldTokenHash: string,
    newTokenId: string,
  ): Promise<RefreshToken[]> {
    return this.executeQueryMultiple<RefreshToken>(
      () => sql`
        SELECT
          *
        FROM
          replace_refresh_token (
            ${oldTokenHash},
            ${newTokenId}
          )
      `,
    );
  }

  async cleanupExpiredSessionsTokens(): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          cleanup_expired_sessions_tokens ()
      `,
    );
  }

  async getSessionsWithRefreshTokens(
    userId: number,
  ): Promise<SessionWithLastToken[]> {
    return this.executeQueryMultiple<SessionWithLastToken>(
      () => sql`
        SELECT
          *
        FROM
          get_sessions_with_refresh_tokens (${userId})
      `,
    );
  }
  async revokeTokensBySession(sessionId: string): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          revoke_tokens_by_session (${sessionId})
      `,
    );
  }

  async rotateAndReturnRawToken(
    oldTokenHash: string,
    newExpiresAt: Date,
  ): Promise<string | null> {
    return this.executeQuery<string>(
      () => sql`
        SELECT
          rotate_and_return_raw_token (
            ${oldTokenHash},
            ${newExpiresAt}
          )
      `,
    );
  }
}
