import {
  BaseBelowMinLengthError,
  BaseExceedsMaxLengthError,
  BaseInvalidValueError,
  BaseProfanityError,
} from '../Base/ValueValidationErrors';

export class RoleNameBelowMinLengthError extends BaseBelowMinLengthError {
  constructor(roleName: string, minLength: number) {
    super(roleName, minLength, 'role name');
  }
}

export class RoleNameExceedsMaxLengthError extends BaseExceedsMaxLengthError {
  constructor(roleName: string, maxLength: number) {
    super(roleName, maxLength, 'role name');
  }
}

export class RoleNameProfanityError extends BaseProfanityError {
  constructor(roleName: string) {
    super(roleName, 'role name');
  }
}

export class RoleNameInvalidValueError extends BaseInvalidValueError {
  constructor(roleName: string, message: string) {
    super(roleName, message, 'role name');
  }
}
