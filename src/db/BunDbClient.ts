import { sql } from 'bun';
import {
  DaoError,
  DaoConnectionError,
  DaoUniqueViolationError,
  DaoConstraintError,
} from '@src/errors';
import { IDbClient } from './interfaces';

export class BunDbClient implements IDbClient {
  async query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
    try {
      const results = await sql.unsafe(queryText, params);
      return results as T[];
    } catch (error: any) {
      throw this.mapPostgresError(error);
    }
  }

  async querySingle<T = any>(
    queryText: string,
    params: any[] = [],
  ): Promise<T | null> {
    console.log('Executing single query:', queryText, 'with params:', params);

    const results = await this.query<T>(queryText, params);

    // destrukturyzacja
    const [first] = results;
    if (!first) return null;

    // sprawdzenie pustego rekordu (NULL,NULL,NULL...)
    if (Object.values(first).every((v) => v === null)) return null;

    return first;
  }

  async queryMultiple<T = any>(
    queryText: string,
    params: any[] = [],
  ): Promise<T[]> {
    console.log('Executing multiple query:', queryText, 'with params:', params);
    return this.query<T>(queryText, params);
  }

  private mapPostgresError(error: any): DaoError {
    if (error?.name === 'PostgresError') {
      const { code, constraint, message } = error;

      switch (code) {
        case '23505':
          return new DaoUniqueViolationError(constraint ?? 'unknown', error);
        case '23503':
        case '23514':
          return new DaoConstraintError(
            message ?? 'Constraint violation',
            error,
          );
        case '08001':
        case '08006':
          return new DaoConnectionError(message ?? 'Connection failure', error);
        default:
          return new DaoError(message ?? String(error), error);
      }
    }
    return new DaoError(error?.message ?? String(error), error);
  }
}
