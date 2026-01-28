import { InvalidIdError } from '../Base/IdError';

export class InvalidUserIdError extends InvalidIdError {
  constructor(userId: number) {
    super(userId, 'user');
  }
}
