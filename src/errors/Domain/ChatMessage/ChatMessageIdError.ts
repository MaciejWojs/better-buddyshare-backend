import { InvalidIdError } from '@src/errors';

export class InvalidChatMessageIdError extends InvalidIdError {
  constructor(messageId: number) {
    super(messageId, 'ChatMessage');
  }
}
