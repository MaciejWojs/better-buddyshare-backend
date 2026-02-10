import { BaseId } from '@src/domain';
import { InvalidStreamIdError } from '@src/errors';

export * from './fields';
export class StreamId extends BaseId<InvalidStreamIdError> {}
