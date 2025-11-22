import { RefreshToken } from '@src/types';

export interface IRefreshTokenDAO {
  // Issue a new refresh token
  issueRefreshToken(
    sessionId: string,
    userId: number,
    expiresAt: Date,
    rawToken: string,
  ): Promise<RefreshToken | null>;

  // Rotate an existing refresh token and return the new token
  rotateRefreshToken(
    oldTokenHash: string,
    newExpiresAt: Date,
    newRawToken: string,
  ): Promise<RefreshToken | null>;

  // Check if the refresh token is valid
  isRefreshTokenValid(tokenHash: string): Promise<boolean>;

  // Revoke a specific refresh token (and optionally the associated session)
  revokeRefreshToken(
    tokenHash: string,
    revokeSession?: boolean,
  ): Promise<boolean>;

  // Get a refresh token by its hash
  getRefreshToken(tokenHash: string): Promise<RefreshToken | null>;

  // Get all refresh tokens for a specific session
  getRefreshTokensBySession(sessionId: string): Promise<RefreshToken[]>;

  // Get a history of refresh tokens for a user
  getUserTokenHistory(userId: number, limit?: number): Promise<RefreshToken[]>;

  // Mark a refresh token as used
  markRefreshTokenUsed(tokenHash: string): Promise<boolean>;

  // Replace an old refresh token with a new one (by ID)
  replaceRefreshToken(
    oldTokenHash: string,
    newTokenId: string,
  ): Promise<RefreshToken[]>;

  // Clean up expired sessions and tokens
  cleanupExpiredSessionsTokens(): Promise<boolean>;

  // Get sessions with the latest refresh token for each
  getSessionsWithRefreshTokens(userId: number): Promise<SessionWithLastToken[]>;

  // Revoke all refresh tokens associated with a session
  revokeTokensBySession(sessionId: string): Promise<boolean>;

  // Rotate and return a raw refresh token
  rotateAndReturnRawToken(
    oldTokenHash: string,
    newExpiresAt: Date,
  ): Promise<string | null>;
}

// // Helper type to combine session and last token data
export interface SessionWithLastToken {
  session_id: string;
  lastTokenIssuedAt: Date;
}
