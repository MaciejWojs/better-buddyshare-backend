import {
  DescriptionProfanityError,
  DescriptionMaxLengthError,
  DescriptionBelowMinLengthError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class Description {
  static readonly MIN_LENGTH = 1;
  static readonly MAX_LENGTH = 160;

  constructor(private readonly description: string) {
    const trimmed = description.trim();

    if (trimmed.length > Description.MAX_LENGTH) {
      throw new DescriptionMaxLengthError(trimmed, Description.MAX_LENGTH);
    }

    if (trimmed.length < Description.MIN_LENGTH) {
      throw new DescriptionBelowMinLengthError(trimmed, Description.MIN_LENGTH);
    }

    // Profanity check
    const filter = new Filter();
    if (filter.isProfane(trimmed)) {
      throw new DescriptionProfanityError(trimmed);
    }

    this.description = trimmed;
  }

  get value(): string {
    return this.description;
  }
}
