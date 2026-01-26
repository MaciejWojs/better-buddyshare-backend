import { InvalidIdError } from '@src/errors';

export class InvalidUserIdError extends InvalidIdError {
  constructor(userId: number) {
    super(userId, 'user');
  }
}
