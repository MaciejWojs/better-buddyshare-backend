import { IMessagesDAO } from './interfaces';
import { BaseDAO } from './BaseDao';
import { Message, OldMessageRecord } from '@src/types/db';
import { sql } from 'bun';

export class MessagesDAO extends BaseDAO implements IMessagesDAO {
  private constructor() {
    super();
  }

  async createChatMessage(
    stream_id: number,
    user_id: number,
    content: string,
  ): Promise<Message | null> {
    const res = await this.executeQuery<Message>(
      () => sql`
        SELECT
          *
        FROM
          Create_chat_message (
            ${stream_id},
            ${user_id},
            ${content}
          )
      `,
    );
    return res;
  }
  async getChatMessages(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_chat_messages (
            ${stream_id},
            ${limit ?? null},
            ${offset ?? null}
          )
      `,
    );
  }
  async checkIfMessageExists(message_id: number): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Check_if_message_exists (${message_id}) AS "exists"
      `,
    );
  }
  async editChatMessage(
    message_id: number,
    newContent: string,
  ): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Edit_chat_message (
            ${message_id},
            ${newContent}
          ) AS "edited"
      `,
    );
  }
  async deleteChatMessage(message_id: number): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Delete_chat_message (${message_id}) AS "deleted"
      `,
    );
  }
  async getMessageEditHistory(message_id: number): Promise<OldMessageRecord[]> {
    return this.executeQueryMultiple<OldMessageRecord>(
      () => sql`
        SELECT
          *
        FROM
          Get_message_edit_history (${message_id})
      `,
    );
  }
  async undeleteChatMessage(message_id: number): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Undelete_chat_message (${message_id}) AS "undeleted"
      `,
    );
  }
  async countChatMessages(stream_id: number): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          Count_chat_messages (${stream_id}) AS "count"
      `,
    );
  }
  async getLastMessage(stream_id: number): Promise<Message | null> {
    const res = await this.executeQuery<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_last_message (${stream_id})
      `,
    );
    return res;
  }
  async isUserMessageAuthor(
    message_id: number,
    user_id: number,
  ): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Is_user_message_author (
            ${message_id},
            ${user_id}
          ) AS "is_author"
      `,
    );
  }
  async countMessageEdits(message_id: number): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          Count_message_edits (${message_id}) AS "count"
      `,
    );
  }
  async getDeletedMessages(stream_id: number): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_deleted_messages (${stream_id})
      `,
    );
  }
  async undeleteAllChatMessages(stream_id: number): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          Undelete_all_chat_messages (${stream_id}) AS "undeleted_count"
      `,
    );
  }
  async hardDeleteChatMessage(message_id: number): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          Hard_delete_chat_message (${message_id}) AS "hard_deleted"
      `,
    );
  }
  async getDeletedMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_deleted_messages_paginated (
            ${stream_id},
            ${limit ?? null},
            ${offset ?? null}
          )
      `,
    );
  }
  async getMessageEditHistoryPaginated(
    message_id: number,
    limit?: number,
    offset?: number,
  ): Promise<OldMessageRecord[]> {
    return this.executeQueryMultiple<OldMessageRecord>(
      () => sql`
        SELECT
          *
        FROM
          Get_message_edit_history_paginated (
            ${message_id},
            ${limit ?? null},
            ${offset ?? null}
          )
      `,
    );
  }
  async getUserMessagesPaginated(
    stream_id: number,
    user_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_user_messages_paginated (
            ${stream_id},
            ${user_id},
            ${limit ?? null},
            ${offset ?? null}
          )
      `,
    );
  }
  async getAllMessagesPaginated(
    stream_id: number,
    limit?: number,
    offset?: number,
  ): Promise<Message[]> {
    return this.executeQueryMultiple<Message>(
      () => sql`
        SELECT
          *
        FROM
          Get_all_messages_paginated (
            ${stream_id},
            ${limit ?? null},
            ${offset ?? null}
          )
      `,
    );
  }
}
