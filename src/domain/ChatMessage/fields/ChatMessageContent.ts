import {
  ChatMessageBelowMinLengthError,
  ChatMessageExceedsMaxLengthError,
  ChatMessageInvalidValueError,
} from '@src/errors';
import { Filter } from 'bad-words';

export class ChatMessageContent {
  private readonly content: string;
  private static readonly filter = new Filter();
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 150;
  private static readonly CHAT_MESSAGE_REGEX = /^[A-Za-z0-9_]+$/;

  constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length < ChatMessageContent.MIN_LENGTH) {
      throw new ChatMessageBelowMinLengthError(
        trimmed,
        ChatMessageContent.MIN_LENGTH,
      );
    }

    if (trimmed.length > ChatMessageContent.MAX_LENGTH) {
      throw new ChatMessageExceedsMaxLengthError(
        trimmed,
        ChatMessageContent.MAX_LENGTH,
      );
    }

    if (!ChatMessageContent.CHAT_MESSAGE_REGEX.test(trimmed)) {
      throw new ChatMessageInvalidValueError(
        trimmed,
        'Chat message can only contain letters, numbers, and underscores',
      );
    }

    if (ChatMessageContent.filter.isProfane(trimmed)) {
      throw new ChatMessageInvalidValueError(
        trimmed,
        'Chat message contains inappropriate language',
      );
    }

    this.content = trimmed;
  }

  get value(): string {
    return this.content;
  }
}
