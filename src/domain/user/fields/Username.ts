import {
  UsernameProfanityError,
  UsernameExceedsMaxLengthError,
  UsernameBelowMinLengthError,
  UsernameInvalidValueError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class Username {
  private readonly username: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 25;

  // Only letters, numbers, underscores
  private static readonly USERNAME_REGEX = /^[A-Za-z0-9_]+$/;

  constructor(username: string) {
    const trimmed = username.trim();

    if (trimmed.length < Username.MIN_LENGTH) {
      throw new UsernameBelowMinLengthError(trimmed, Username.MIN_LENGTH);
    }

    if (trimmed.length > Username.MAX_LENGTH) {
      throw new UsernameExceedsMaxLengthError(trimmed, Username.MAX_LENGTH);
    }

    // Allowed characters check
    if (!Username.USERNAME_REGEX.test(trimmed)) {
      throw new UsernameInvalidValueError(
        trimmed,
        `Username can only contain letters, numbers, and underscores`,
      );
    }

    // Profanity check
    if (Username.filter.isProfane(trimmed)) {
      throw new UsernameProfanityError(
        'Username contains inappropriate language',
      );
    }

    // No spaces inside username
    if (/\s/.test(trimmed)) {
      throw new UsernameInvalidValueError(
        trimmed,
        'Username cannot contain spaces',
      );
    }

    this.username = trimmed;
  }

  get value(): string {
    return this.username;
  }

  get normalized(): string {
    return this.username.toLowerCase();
  }
}
