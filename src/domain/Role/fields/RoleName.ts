import {
  RoleNameBelowMinLengthError,
  RoleNameExceedsMaxLengthError,
  RoleNameInvalidValueError,
  RoleNameProfanityError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class RoleName {
  private readonly name: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 25;

  // Only letters, numbers, underscores
  private static readonly ROLE_NAME_REGEX = /^[A-Za-z0-9_]+$/;

  constructor(name: string) {
    const trimmed = name.trim().toUpperCase();

    if (trimmed.length < RoleName.MIN_LENGTH) {
      throw new RoleNameBelowMinLengthError(trimmed, RoleName.MIN_LENGTH);
    }

    if (trimmed.length > RoleName.MAX_LENGTH) {
      throw new RoleNameExceedsMaxLengthError(trimmed, RoleName.MAX_LENGTH);
    }

    // Allowed characters check
    if (!RoleName.ROLE_NAME_REGEX.test(trimmed)) {
      throw new RoleNameInvalidValueError(
        trimmed,
        'Role name can only contain letters, numbers, and underscores',
      );
    }

    // Profanity check
    if (RoleName.filter.isProfane(trimmed)) {
      throw new RoleNameProfanityError(trimmed);
    }

    // No spaces inside role name
    if (/\s/.test(trimmed)) {
      throw new RoleNameInvalidValueError(
        trimmed,
        'Role name cannot contain spaces',
      );
    }

    this.name = trimmed;
  }

  get value(): string {
    return this.name;
  }
}
