import {
  StreamTitleBelowMinLengthError,
  StreamTitleExceedsMaxLengthError,
  StreamTitleInvalidValueError,
  StreamTitleProfanityError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class StreamTitle {
  private readonly title: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 40;
  private static readonly MAX_LENGTH = 150;
  private static readonly STREAM_TITLE_REGEX = /^[A-Za-z0-9_]+$/;

  constructor(title: string) {
    const trimmed = title.trim();

    if (trimmed.length < StreamTitle.MIN_LENGTH) {
      throw new StreamTitleBelowMinLengthError(trimmed, StreamTitle.MIN_LENGTH);
    }

    if (trimmed.length > StreamTitle.MAX_LENGTH) {
      throw new StreamTitleExceedsMaxLengthError(
        trimmed,
        StreamTitle.MAX_LENGTH,
      );
    }

    if (!StreamTitle.STREAM_TITLE_REGEX.test(trimmed)) {
      throw new StreamTitleInvalidValueError(
        trimmed,
        'Stream title can only contain letters, numbers, and underscores',
      );
    }

    if (StreamTitle.filter.isProfane(trimmed)) {
      throw new StreamTitleProfanityError(trimmed);
    }

    this.title = trimmed;
  }

  get value(): string {
    return this.title;
  }
}
