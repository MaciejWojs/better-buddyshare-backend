import { BaseError } from './BaseError';

export class DaoError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(message, 'DAO_ERROR', cause);
  }
}

export class DaoNotFoundError extends DaoError {
  constructor(entity: string, id: string | number) {
    super(`${entity} with ID ${id} not found`, { entity, id });
  }
}

export class DaoConnectionError extends DaoError {
  constructor(message = 'Database connection failed', cause?: unknown) {
    super(message, cause);
  }
}

export class DaoConstraintError extends DaoError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class DaoUniqueViolationError extends DaoError {
  constructor(constraint: string, cause?: unknown) {
    super(`Unique constraint violated: ${constraint}`, cause);
  }
}

// Cache related errors
export class DaoCacheConnectionError extends DaoError {
  constructor(
    message: string = 'Redis/Valkey connection failed',
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export class DaoCacheAuthenticationError extends DaoError {
  constructor(
    message: string = 'Redis/Valkey authentication error',
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
