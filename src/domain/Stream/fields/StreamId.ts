import { InvalidStreamIdError } from '@src/errors';
import { BaseId } from '@src/domain';

export class StreamId extends BaseId<InvalidStreamIdError> {
  constructor(id: number) {
    super(id, InvalidStreamIdError);
  }
}
