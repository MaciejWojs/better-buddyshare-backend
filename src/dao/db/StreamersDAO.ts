import { sql } from 'bun';
import { IStreamersDAO } from './interfaces';

export class StreamersDAO implements IStreamersDAO {
  private constructor() {}

  async findById(id: number) {
    return await sql`
      SELECT
        *
      FROM
        get_user_by_id (${id})
    `;
  }

  async banUserInChat(streamerId: number, userId: number) {
    return await sql`
      SELECT
        *
      FROM
        ban_user_in_chat (
          ${streamerId},
          ${userId}
        )
    `;
  }
}
