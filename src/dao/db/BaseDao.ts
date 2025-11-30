import {
  DaoError,
  DaoConnectionError,
  DaoUniqueViolationError,
  DaoConstraintError,
  DaoCacheConnectionError,
  DaoCacheAuthenticationError,
} from '@src/errors';
import { IDbClient } from '@src/db/interfaces';

export abstract class BaseDAO {
  protected constructor(protected readonly db: IDbClient) {
    console.log(`Initializing ${this.constructor.name} DAO`);
  }

  protected mapPostgresError(error: any): DaoError {
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

    return new DaoError('Unexpected DAO error', error);
  }

  protected mapCacheError(error: any): DaoError {
    if (!error) return new DaoError('Unknown cache error', error);

    if (error.code === 'ERR_REDIS_CONNECTION_CLOSED') {
      return new DaoCacheConnectionError(error);
    }
    if (error.code === 'ERR_REDIS_AUTHENTICATION_FAILED') {
      return new DaoCacheAuthenticationError(error);
    }

    return new DaoError('Cache error', error);
  }

  protected mapError(error: any): DaoError {
    if (!error) return new DaoError('Unknown error', error);

    try {
      if (
        error.name === 'PostgresError' ||
        error.constructor?.name === 'PostgresError'
      ) {
        return this.mapPostgresError(error);
      }
    } catch (_) {}

    try {
      if (error.code && String(error.code).startsWith('ERR_REDIS')) {
        return this.mapCacheError(error);
      }
    } catch (_) {}

    if (error instanceof DaoError) return error;

    return new DaoError(error?.message ?? String(error), error);
  }

  protected async executeQuery<T>(
    query: string,
    params?: any[],
  ): Promise<T | null> {
    try {
      const results = await this.db.querySingle<T>(query, params);

      if (!results) return null;
      return results;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  protected async executeQueryMultiple<T>(
    query: string,
    params?: any[],
  ): Promise<T[]> {
    try {
      const results = await this.db.queryMultiple<T>(query, params);
      return results ?? [];
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  protected async scalar<T = any>(query: string, params?: any[]): Promise<T> {
    const result = await this.executeQuery<Record<string, T>>(query, params);
    if (!result)
      throw new DaoError(`Scalar query returned no result: ${query}`);

    const [value] = Object.values(result);
    return value as T;
  }
}
