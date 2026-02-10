import { InvalidIdError } from '../Base/IdError';

export class InvalidRoleIdError extends InvalidIdError {
  constructor(roleId: number) {
    super(roleId, 'role');
  }
}
