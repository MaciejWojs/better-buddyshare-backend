import {
  DaoError,
  DaoConnectionError,
  DaoUniqueViolationError,
  DaoConstraintError,
  DaoCacheConnectionError,
  DaoCacheAuthenticationError,
} from '@src/errors/DaoError';

export abstract class BaseDAO {
  protected constructor() {
    console.log(`Initializing ${this.constructor.name} DAO`);
  }

  protected mapPostgresError(error: any): DaoError {
    // Bun.sql rzuca PostgresError
    if (error.name === 'PostgresError') {
      switch (error.code) {
        case '23505': // unique_violation
          return new DaoUniqueViolationError(
            error.constraint ?? error.column ?? 'unknown',
            error,
          );
        case '23503': // foreign_key_violation
        case '23514': // check_violation
          return new DaoConstraintError(
            error.message ?? 'Constraint violation',
            error,
          );
        case '08001': // connection failure
        case '08006':
          return new DaoConnectionError(
            error.message ?? 'Connection failure',
            error,
          );
        default:
          return new DaoError(
            `Database error: ${error.message ?? String(error)}`,
            error,
          );
      }
    }

    // Inne błędy (np. runtime)
    return new DaoError('Unexpected DAO error', error);
  }

  protected mapCacheError(error: any): DaoError {
    if (!error) return new DaoError('Unknown cache error', error);

    // detect redis/valkey style errors by code/name
    if (error.code === 'ERR_REDIS_CONNECTION_CLOSED') {
      return new DaoCacheConnectionError(error);
    }
    if (error.code === 'ERR_REDIS_AUTHENTICATION_FAILED') {
      return new DaoCacheAuthenticationError(error);
    }

    // fallback
    return new DaoError('Cache error', error);
  }

  /**
   * Generic error mapper: detects DB/cache/other and returns a DaoError subclass.
   */
  protected mapError(error: any): DaoError {
    if (!error) return new DaoError('Unknown error', error);

    // Postgres/Bun detection
    try {
      if (
        error.name === 'PostgresError' ||
        error.constructor?.name === 'PostgresError'
      ) {
        return this.mapPostgresError(error);
      }
    } catch (_) {
      // continue to other detectors
    }

    // Cache detection
    try {
      // Redis/Valkey style
      if (error.code && String(error.code).startsWith('ERR_REDIS')) {
        return this.mapCacheError(error);
      }
    } catch (_) {
      // ignore
    }

    // Fallback: if it's already a DaoError, return as-is
    if (error instanceof DaoError) return error;

    // Generic wrap
    return new DaoError(error?.message ?? String(error), error);
  }

  /**
   * Executes a query that should return a single row.
   */
  protected async executeQuery<T>(
    query: () => Promise<any>,
  ): Promise<T | null> {
    try {
      const results = await query();

      if (!results)
        console.log(`[QUERY RESULT] during ${query.toString()}`, results);

      if (!Array.isArray(results)) {
        throw new DaoError('[DB ERROR] Query did not return an array', results);
      }

      if (results.length === 0) {
        console.log('[LENGTH] No records found in the database.');
        return null;
      }

      // // Jeśli funkcja SQL zwraca np. [{ function_name: null }]
      const first = results[0];
      if (
        first &&
        typeof first === 'object' &&
        Object.values(first).every((v) => v === null)
      ) {
        console.log('[NULL] Query returned only NULL values.');
        return null;
      }

      return first as T;
    } catch (error: any) {
      const mapped = this.mapError(error);
      console.error('[DB ERROR]', mapped);
      throw mapped;
    }
  }

  /**
   * Executes a query that returns multiple rows.
   */
  protected async executeQueryMultiple<T>(
    query: () => Promise<T>,
  ): Promise<T[] | null> {
    try {
      const results = await query();

      if (!Array.isArray(results)) {
        throw new DaoError('[DB ERROR] Query did not return an array', results);
      }

      if (results.length === 0) {
        console.log('[LENGTH] No records found in the database.');
        return null;
      }

      return results as T[];
    } catch (error: any) {
      const mapped = this.mapError(error);
      console.error('[DB ERROR]', mapped);
      throw mapped;
    }
  }

  protected async getBooleanFromQuery(
    query: () => any,
  ): Promise<boolean | null> {
    const res = await this.executeQuery<Record<string, boolean>>(query);
    if (!res) return null;
    const firstValue = Object.values(res)[0];
    return typeof firstValue === 'boolean' ? firstValue : false;
  }
}
