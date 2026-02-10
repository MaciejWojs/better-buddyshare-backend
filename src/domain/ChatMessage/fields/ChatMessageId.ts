import { BaseId } from '@src/domain';
import { InvalidChatMessageIdError } from '@src/errors';

export class ChatMessageId extends BaseId<InvalidChatMessageIdError> {
  constructor(chatMessageId: number) {
    super(chatMessageId, InvalidChatMessageIdError);
  }
}
