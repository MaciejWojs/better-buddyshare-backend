import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseInvalidValueError,
  BaseProfanityError,
} from '@src/errors';

export class StreamDescriptionBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(streamDescription: string, minLength: number) {
    super(streamDescription, minLength, 'stream description');
  }
}

export class StreamDescriptionExceedsMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(streamDescription: string, maxLength: number) {
    super(streamDescription, maxLength, 'stream description');
  }
}

export class StreamDescriptionProfanityError extends BaseProfanityError {
  constructor(streamDescription: string) {
    super(streamDescription, 'stream description');
  }
}

export class StreamDescriptionInvalidValueError extends BaseInvalidValueError {
  constructor(streamDescription: string, message: string) {
    super(streamDescription, message, 'stream description');
  }
}
