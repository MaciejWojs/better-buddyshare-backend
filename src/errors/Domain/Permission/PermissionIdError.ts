import { InvalidIdError } from '@src/errors';

export class InvalidPermissionIdError extends InvalidIdError {
  constructor(permissionId: number) {
    super(permissionId, 'permission');
  }
}
