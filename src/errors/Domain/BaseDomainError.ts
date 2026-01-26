import { BaseError } from '../BaseError';

export class BaseDomainError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(message, 'BASE_DOMAIN_ERROR', cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
