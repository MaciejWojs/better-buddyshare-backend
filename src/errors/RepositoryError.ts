import { BaseError } from './BaseError';
import {
  DaoError,
  DaoNotFoundError,
  DaoConnectionError,
  DaoUniqueViolationError,
  DaoCacheAuthenticationError,
  DaoCacheConnectionError,
  DaoConstraintError,
} from './DaoError';

export interface RepositoryErrorPayload {
  message: string;
  details?: unknown;
  statusCode?: number;
  retryable?: boolean;
}

export class RepositoryError extends BaseError {
  public readonly details?: unknown;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    cause?: unknown,
    details?: unknown,
    statusCode?: number,
    retryable = false,
  ) {
    super(message, 'REPOSITORY_ERROR', cause);
    this.details = details;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }

  toJSON(): RepositoryErrorPayload {
    return {
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      retryable: this.retryable,
    };
  }

  static fromDaoError(err: DaoError): RepositoryError {
    const cause = err;

    // Direct mappings based on DaoError subclass
    if (err instanceof DaoNotFoundError) {
      // attempt to extract entity/id from cause if present
      const info = (err as any).cause ?? undefined;
      const entity = info?.entity ?? 'entity';
      const id = info?.id;
      return new RepositoryNotFoundError(entity, id as any);
    }

    if (
      err instanceof DaoUniqueViolationError ||
      (err as any).message?.includes?.('Unique constraint')
    ) {
      return new RepositoryConflictError(
        err.message,
        (err as any).cause ?? undefined,
      );
    }

    if (err instanceof DaoConstraintError) {
      return new RepositoryValidationError(
        err.message,
        (err as any).cause ?? undefined,
      );
    }

    if (err instanceof DaoConnectionError) {
      return new RepositoryError(
        err.message,
        cause,
        (err as any).cause ?? undefined,
        503,
        true,
      );
    }

    if (
      err instanceof DaoCacheConnectionError ||
      err instanceof DaoCacheAuthenticationError
    ) {
      // cache problems are treated like infra errors
      return new RepositoryError(
        err.message,
        cause,
        (err as any).cause ?? undefined,
        503,
        true,
      );
    }

    // Fallback: try to inspect nested DB error codes (Postgres)
    const inner = (err as any).cause ?? err;
    const code = inner?.code ?? inner?.cause?.code;
    if (code === '23505')
      return new RepositoryConflictError(err.message, inner);
    if (code === '23503' || code === '23514')
      return new RepositoryValidationError(err.message, inner);
    if (code === '08001' || code === '08006')
      return new RepositoryError(err.message, cause, inner, 503, true);

    return new RepositoryError(
      err.message,
      cause,
      (err as any).details ?? undefined,
    );
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  constructor(entity: string, id?: string | number) {
    super(
      `${entity} not found${id ? `: ${id}` : ''}`,
      undefined,
      { entity, id },
      404,
      false,
    );
  }
}

export class RepositoryConflictError extends RepositoryError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details, 409, false);
  }
}

export class RepositoryValidationError extends RepositoryError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details, 400, false);
  }
}

export class RepositoryPermissionError extends RepositoryError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details, 403, false);
  }
}
