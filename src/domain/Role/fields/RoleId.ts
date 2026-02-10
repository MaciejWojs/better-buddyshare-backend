import { InvalidRoleIdError } from '@src/errors';
import { BaseId } from '@src/domain';

export class RoleId extends BaseId<InvalidRoleIdError> {
  constructor(id: number) {
    super(id, InvalidRoleIdError);
  }
}
