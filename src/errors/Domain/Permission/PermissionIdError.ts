import { InvalidIdError } from '../Base/IdError';

export class InvalidPermissionIdError extends InvalidIdError {
  constructor(permissionId: number) {
    super(permissionId, 'permission');
  }
}
