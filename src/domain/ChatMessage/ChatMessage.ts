import {
  ChatMessageId,
  ChatMessageContent,
  StreamId,
  UserId,
} from '@src/domain';

export class ChatMessage {
  constructor(
    readonly id: ChatMessageId,
    readonly streamId: StreamId,
    readonly userId: UserId,
    readonly content: ChatMessageContent,
    readonly sentAt: Date,
    readonly isDeleted: boolean,
  ) {}

  private copy(changes: Partial<ChatMessage>): ChatMessage {
    return new ChatMessage(
      changes.id ?? this.id,
      changes.streamId ?? this.streamId,
      changes.userId ?? this.userId,
      changes.content ?? this.content,
      changes.sentAt ?? this.sentAt,
      changes.isDeleted ?? this.isDeleted,
    );
  }

  markAsDeleted(): ChatMessage {
    return this.copy({ isDeleted: true });
  }
  markAsNotDeleted(): ChatMessage {
    return this.copy({ isDeleted: false });
  }

  isDeletedMessage(): boolean {
    return this.isDeleted;
  }

  changeContent(newContent: ChatMessageContent): ChatMessage {
    return this.copy({ content: newContent });
  }

  //! TODO: add edit history tracking
  // (separate entity?, like in prisma schema)
}
