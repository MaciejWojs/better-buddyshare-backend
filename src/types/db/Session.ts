export type Session = {
  id: string; // UUID
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  isActive: boolean;
};
