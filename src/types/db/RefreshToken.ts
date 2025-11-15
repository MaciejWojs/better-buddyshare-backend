export type RefreshToken = {
  id: string; // UUID
  tokenHash: string;
  userId: number;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  usedAt: Date | null;
};
