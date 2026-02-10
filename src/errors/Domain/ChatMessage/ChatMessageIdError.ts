import { InvalidIdError } from '../Base/IdError';

export class InvalidChatMessageIdError extends InvalidIdError {
  constructor(messageId: number) {
    super(messageId, 'ChatMessage');
  }
}
