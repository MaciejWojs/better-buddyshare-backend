import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseInvalidValueError,
  BaseProfanityError,
} from '../Base/ValueValidationErrors';

export class PermissionNameBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(permissionName: string, minLength: number) {
    super(permissionName, minLength, 'permission name');
  }
}
export class PermissionNameExceedsMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(permissionName: string, maxLength: number) {
    super(permissionName, maxLength, 'permission name');
  }
}
export class PermissionNameProfanityError extends BaseProfanityError {
  constructor(permissionName: string) {
    super(permissionName, 'permission name');
  }
}
export class PermissionNameInvalidValueError extends BaseInvalidValueError {
  constructor(permissionName: string, message: string) {
    super(permissionName, message, 'permission name');
  }
}
