import { sql } from 'bun';
import { BaseDAO } from './BaseDao';
import { ISessionDAO } from './interfaces';
import { Session } from '@src/types/db';

export class SessionDAO extends BaseDAO implements ISessionDAO {
  private static instance: SessionDAO;
  private constructor() {
    super();
  }

  public static getInstance(): SessionDAO {
    if (!this.instance) {
      this.instance = new SessionDAO();
    }

    return this.instance;
  }

  private now_30_days_later(): Date {
    const now = new Date();
    const days = 30;
    const hours = 24;
    const minutes = 60;
    const seconds = 60;
    const milliseconds = 1000;
    now.setTime(
      now.getTime() + days * hours * minutes * seconds * milliseconds,
    );
    return now;
  }

  async createSession(
    user_id: number,
    expires_at: Date,
    ip_address?: string,
    user_agent?: string,
    device_info?: string,
  ): Promise<Session | null> {
    return this.executeQuery<Session>(
      async () => sql`
        SELECT
          *
        FROM
          create_session (
            ${user_id},
            ${expires_at},
            ${ip_address ?? null},
            ${user_agent ?? null},
            ${device_info ?? null}
          )
      `,
    );
  }

  async revokeSession(session_id: string): Promise<boolean> {
    return await this.getBooleanFromQuery(
      async () => sql`
        SELECT
          *
        FROM
          revoke_session (${session_id})
      `,
    );
  }

  async revokeAllUserSessions(userId: number): Promise<boolean> {
    return await this.getBooleanFromQuery(
      async () => sql`
        SELECT
          revoke_all_user_sessions (${userId}) AS RESULT
      `,
    );
  }

  async extendSession(
    session_id: string,
    new_expires_at: Date = this.now_30_days_later(),
  ): Promise<Session | null> {
    return this.executeQuery<Session>(
      async () => sql`
        SELECT
          *
        FROM
          extend_session_expiry (
            ${session_id},
            ${new_expires_at}
          )
      `,
    );
  }

  async getActiveSessions(user_id: number): Promise<Session[]> {
    return this.executeQueryMultiple<Session>(
      async () => sql`
        SELECT
          *
        FROM
          get_active_sessions (${user_id})
      `,
    );
  }

  async touchSessionLastUsed(session_id: string): Promise<Session | null> {
    return this.executeQuery<Session>(
      async () => sql`
        SELECT
          *
        FROM
          touch_session_last_used (${session_id})
      `,
    );
  }

  async cleanupExpiredSessionsAndTokens(): Promise<boolean> {
    const result = await this.getBooleanFromQuery(
      async () => sql`
        SELECT
          cleanup_expired_sessions_tokens () AS count
      `,
    );
    return result;
  }
}
