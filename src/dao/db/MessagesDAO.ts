import { IMessagesDAO } from './interfaces';
import { BaseDAO } from './BaseDao';
import { Message, OldMessageRecord } from '@src/types';
import { IDbClient } from '@src/db/interfaces';

export class MessagesDAO extends BaseDAO implements IMessagesDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async createChatMessage(
    stream_id: number,
    user_id: number,
    content: string,
  ): Promise<Message | null> {
    return await this.executeQuery<Message>(
      'SELECT * FROM Create_chat_message($1, $2, $3)',
      [stream_id, user_id, content],
    );
  }
  async getChatMessages(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      'SELECT * FROM Get_chat_messages($1, $2, $3)',
      [stream_id, limit ?? null, offset ?? null],
    );
  }
  async checkIfMessageExists(message_id: number): Promise<boolean> {
    return this.scalar('SELECT Check_if_message_exists($1) AS "exists"', [
      message_id,
    ]);
  }
  async editChatMessage(
    message_id: number,
    newContent: string,
  ): Promise<boolean> {
    return this.scalar('SELECT Edit_chat_message($1, $2) AS "edited"', [
      message_id,
      newContent,
    ]);
  }
  async deleteChatMessage(message_id: number): Promise<boolean> {
    return this.scalar('SELECT Delete_chat_message($1) AS "deleted"', [
      message_id,
    ]);
  }
  async getMessageEditHistory(message_id: number): Promise<OldMessageRecord[]> {
    return this.executeQueryMultiple<OldMessageRecord>(
      'SELECT * FROM Get_message_edit_history($1)',
      [message_id],
    );
  }
  async undeleteChatMessage(message_id: number): Promise<boolean> {
    return this.scalar('SELECT Undelete_chat_message($1) AS "undeleted"', [
      message_id,
    ]);
  }
  async countChatMessages(stream_id: number): Promise<number> {
    return this.scalar<number>('SELECT Count_chat_messages($1) AS "count"', [
      stream_id,
    ]);
  }
  async getLastMessage(stream_id: number): Promise<Message | null> {
    return this.executeQuery<Message>('SELECT * FROM Get_last_message($1)', [
      stream_id,
    ]);
  }
  async isUserMessageAuthor(
    message_id: number,
    user_id: number,
  ): Promise<boolean> {
    return this.scalar('SELECT Is_user_message_author($1, $2) AS "is_author"', [
      message_id,
      user_id,
    ]);
  }
  async countMessageEdits(message_id: number): Promise<number> {
    return this.scalar<number>('SELECT Count_message_edits($1) AS "count"', [
      message_id,
    ]);
  }
  async getDeletedMessages(stream_id: number): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      'SELECT * FROM Get_deleted_messages($1)',
      [stream_id],
    );
  }
  async undeleteAllChatMessages(stream_id: number): Promise<number> {
    return this.scalar<number>(
      'SELECT Undelete_all_chat_messages($1) AS "undeleted_count"',
      [stream_id],
    );
  }
  async hardDeleteChatMessage(message_id: number): Promise<boolean> {
    return this.scalar(
      'SELECT Hard_delete_chat_message($1) AS "hard_deleted"',
      [message_id],
    );
  }
  async getDeletedMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      'SELECT * FROM Get_deleted_messages_paginated($1, $2, $3)',
      [stream_id, limit ?? null, offset ?? null],
    );
  }
  async getMessageEditHistoryPaginated(
    message_id: number,
    limit?: number,
    offset?: number,
  ): Promise<OldMessageRecord[]> {
    return this.executeQueryMultiple<OldMessageRecord>(
      'SELECT * FROM Get_message_edit_history_paginated($1, $2, $3)',
      [message_id, limit ?? null, offset ?? null],
    );
  }
  async getUserMessagesPaginated(
    stream_id: number,
    user_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      'SELECT * FROM Get_user_messages_paginated($1, $2, $3, $4)',
      [stream_id, user_id, limit ?? null, offset ?? null],
    );
  }
  async getAllMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      'SELECT * FROM Get_all_messages_paginated($1, $2, $3)',
      [stream_id, limit ?? null, offset ?? null],
    );
  }
}
