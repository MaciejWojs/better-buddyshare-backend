import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseProfanityError,
} from '@src/errors';

const MAX_DESCRIPTION_LENGTH_FOR_ERROR = 50;

const getTruncatedDescription = (description: string): string => {
  if (description.length > MAX_DESCRIPTION_LENGTH_FOR_ERROR) {
    return description.slice(0, MAX_DESCRIPTION_LENGTH_FOR_ERROR) + '...';
  }
  return description;
}

export class DescriptionBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(description: string, length: number) {
    super(getTruncatedDescription(description), length, 'description');
  }
}

export class DescriptionMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(description: string, length: number) {
    super(getTruncatedDescription(description), length, 'description');
  }
}

export class DescriptionProfanityError extends BaseProfanityError {
  constructor(description: string) {
    super(getTruncatedDescription(description), 'description');
  }
}
