import { BaseDomainError } from '../BaseDomainError';

export class InvalidEmailError extends BaseDomainError {
  constructor(email: string, cause?: unknown) {
    super(`The email '${email}' is invalid.`, cause);
  }
}
