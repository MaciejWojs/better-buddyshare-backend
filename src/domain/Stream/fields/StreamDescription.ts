import {
  StreamDescriptionBelowMinLengthError,
  StreamDescriptionExceedsMaxLengthError,
  StreamDescriptionInvalidValueError,
  StreamDescriptionProfanityError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class StreamDescription {
  private readonly description: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 40;
  private static readonly MAX_LENGTH = 150;
  private static readonly STREAM_DESCRIPTION_REGEX = /^[A-Za-z0-9_]+$/;

  constructor(description: string) {
    const trimmed = description.trim();

    if (trimmed.length < StreamDescription.MIN_LENGTH) {
      throw new StreamDescriptionBelowMinLengthError(
        trimmed,
        StreamDescription.MIN_LENGTH,
      );
    }

    if (trimmed.length > StreamDescription.MAX_LENGTH) {
      throw new StreamDescriptionExceedsMaxLengthError(
        trimmed,
        StreamDescription.MAX_LENGTH,
      );
    }

    if (!StreamDescription.STREAM_DESCRIPTION_REGEX.test(trimmed)) {
      throw new StreamDescriptionInvalidValueError(
        trimmed,
        'Stream description can only contain letters, numbers, and underscores',
      );
    }

    if (StreamDescription.filter.isProfane(trimmed)) {
      throw new StreamDescriptionProfanityError(trimmed);
    }

    this.description = trimmed;
  }

  get value(): string {
    return this.description;
  }
}
