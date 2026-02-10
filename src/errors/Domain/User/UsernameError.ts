import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseInvalidValueError,
  BaseProfanityError,
} from '../Base/ValueValidationErrors';

export class UsernameInvalidValueError extends BaseInvalidValueError {
  constructor(username: string, message: string) {
    super(username, message, 'username');
  }
}

export class UsernameProfanityError extends BaseProfanityError {
  constructor(username: string) {
    super(username, 'username');
  }
}

export class UsernameExceedsMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(username: string, maxLength: number) {
    super(username, maxLength, 'username');
  }
}

export class UsernameBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(username: string, minLength: number) {
    super(username, minLength, 'username');
  }
}
