import { InvalidIdError } from '../Base/IdError';

export class InvalidStreamIdError extends InvalidIdError {
  constructor(id: number) {
    super(id, 'stream');
  }
}
