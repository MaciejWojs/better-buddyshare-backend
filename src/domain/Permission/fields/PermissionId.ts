import { InvalidPermissionIdError } from '@src/errors';
import { BaseId } from '@src/domain';

export class PermissionId extends BaseId<InvalidPermissionIdError> {
  constructor(id: number) {
    super(id, InvalidPermissionIdError);
  }
}
