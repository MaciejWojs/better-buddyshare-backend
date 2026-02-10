import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseInvalidValueError,
  BaseProfanityError,
} from '../Base/ValueValidationErrors';

export class StreamTitleBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(streamTitle: string, minLength: number) {
    super(streamTitle, minLength, 'stream title');
  }
}

export class StreamTitleExceedsMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(streamTitle: string, maxLength: number) {
    super(streamTitle, maxLength, 'stream title');
  }
}

export class StreamTitleProfanityError extends BaseProfanityError {
  constructor(streamTitle: string) {
    super(streamTitle, 'stream title');
  }
}

export class StreamTitleInvalidValueError extends BaseInvalidValueError {
  constructor(streamTitle: string, message: string) {
    super(streamTitle, message, 'stream title');
  }
}
