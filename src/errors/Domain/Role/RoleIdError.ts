import { InvalidIdError } from '@src/errors';

export class InvalidRoleIdError extends InvalidIdError {
  constructor(roleId: number) {
    super(roleId, 'role');
  }
}
