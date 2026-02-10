import {
  PermissionNameBelowMinLengthError,
  PermissionNameExceedsMaxLengthError,
  PermissionNameInvalidValueError,
  PermissionNameProfanityError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class PermissionName {
  private readonly name: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 25;

  // Only letters, numbers, underscores
  private static readonly PERMISSION_NAME_REGEX = /^[A-Za-z0-9_]+$/;
  constructor(name: string) {
    const trimmed = name.trim();

    if (trimmed.length < PermissionName.MIN_LENGTH) {
      throw new PermissionNameBelowMinLengthError(
        trimmed,
        PermissionName.MIN_LENGTH,
      );
    }

    if (trimmed.length > PermissionName.MAX_LENGTH) {
      throw new PermissionNameExceedsMaxLengthError(
        trimmed,
        PermissionName.MAX_LENGTH,
      );
    }

    // Allowed characters check
    if (!PermissionName.PERMISSION_NAME_REGEX.test(trimmed)) {
      throw new PermissionNameInvalidValueError(
        trimmed,
        'Permission name can only contain letters, numbers, and underscores',
      );
    }

    // Profanity check
    if (PermissionName.filter.isProfane(trimmed)) {
      throw new PermissionNameProfanityError(trimmed);
    }

    // No spaces inside permission name
    if (/\s/.test(trimmed)) {
      throw new PermissionNameInvalidValueError(
        trimmed,
        'Permission name cannot contain spaces',
      );
    }
    this.name = trimmed;
  }

  get value(): string {
    return this.name;
  }
}
