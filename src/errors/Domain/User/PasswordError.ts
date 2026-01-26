import { BaseDomainError } from '@src/errors';

export class WeakPasswordError extends BaseDomainError {
  constructor(password: string) {
    super(`The provided password is too weak: ${password}`);
  }
}
