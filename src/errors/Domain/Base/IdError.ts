import { BaseDomainError } from '@src/errors';

export abstract class InvalidIdError extends BaseDomainError {
  constructor(id: number, where_from: string) {
    super(`Invalid ${where_from} ID: ${id}`);
  }
}
