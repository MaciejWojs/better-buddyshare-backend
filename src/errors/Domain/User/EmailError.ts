import { BaseDomainError } from '@src/errors';

export class InvalidEmailError extends BaseDomainError {
  constructor(email: string, cause?: unknown) {
    super(`The email '${email}' is invalid.`, cause);
  }
}
