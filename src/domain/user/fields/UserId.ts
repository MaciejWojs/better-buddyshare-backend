import { InvalidUserIdError } from '@src/errors';
import { BaseId } from '@src/domain';

export class UserId extends BaseId<InvalidUserIdError> {
  constructor(id: number) {
    super(id, InvalidUserIdError);
  }
}
