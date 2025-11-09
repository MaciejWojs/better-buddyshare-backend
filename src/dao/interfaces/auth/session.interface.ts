import { Session } from '@src/types/db/Session';

export interface ISessionDAO {
  // Tworzy nową sesję i zwraca jej ID
  createSession(
    userId: number,
    expiresAt: Date,
    ipAddress?: string | null,
    userAgent?: string | null,
    deviceInfo?: string | null,
  ): Promise<Session | null>;

  // Przedłuża datę wygaśnięcia sesji
  extendSession(
    sessionId: string,
    new_expires_at: Date,
  ): Promise<Session | null>;

  // Unieważnia sesję i powiązane tokeny
  revokeSession(sessionId: string): Promise<boolean>;

  // Pobiera aktywne sesje dla danego użytkownika
  getActiveSessions(userId: number): Promise<Session[]>;

  // Aktualizuje datę ostatniego użycia sesji (np. przy refresh token flow)
  touchSessionLastUsed(sessionId: string): Promise<Session | null>;

  // Usuwa wygasłe sesje i tokeny
  cleanupExpiredSessionsAndTokens(): Promise<boolean>;
}
