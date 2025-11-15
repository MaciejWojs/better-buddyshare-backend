import { Message, OldMessageRecord } from '@src/types/db/';

export interface IMessagesDAO {
  createChatMessage(
    stream_id: number,
    user_id: number,
    content: string,
  ): Promise<Message | null>;
  getChatMessages(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
  checkIfMessageExists(message_id: number): Promise<boolean>;
  editChatMessage(message_id: number, newContent: string): Promise<boolean>;
  deleteChatMessage(message_id: number): Promise<boolean>;
  getMessageEditHistory(message_id: number): Promise<OldMessageRecord[]>;
  undeleteChatMessage(message_id: number): Promise<boolean>;
  countChatMessages(stream_id: number): Promise<number>;
  getLastMessage(stream_id: number): Promise<Message | null>;
  isUserMessageAuthor(message_id: number, user_id: number): Promise<boolean>;
  countMessageEdits(message_id: number): Promise<number>;
  getDeletedMessages(stream_id: number): Promise<Message[]>;
  undeleteAllChatMessages(stream_id: number): Promise<number>;
  hardDeleteChatMessage(message_id: number): Promise<boolean>;
  getDeletedMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
  getMessageEditHistoryPaginated(
    message_id: number,
    limit?: number,
    offset?: number,
  ): Promise<OldMessageRecord[]>;
  getUserMessagesPaginated(
    stream_id: number,
    user_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
  getAllMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
}
