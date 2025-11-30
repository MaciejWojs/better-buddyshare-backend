import { BaseDAO } from './BaseDao';
import { IStreamersDAO } from './interfaces';
import { User } from '@src/types';
import { IDbClient } from '@src/db/interfaces';

export class StreamersDAO extends BaseDAO implements IStreamersDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async findById(id: number) {
    return this.executeQuery<User>('SELECT * FROM get_user_by_id($1)', [id]);
  }

  async banUserInChat(streamerId: number, userId: number) {
    return this.executeQuery<null>('SELECT * FROM ban_user_in_chat($1, $2)', [
      streamerId,
      userId,
    ]);
  }
}
