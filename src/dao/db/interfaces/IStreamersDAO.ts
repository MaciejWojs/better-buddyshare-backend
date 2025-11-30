import { User } from '@src/types';

export interface IStreamersDAO {
  findById(id: number): Promise<User | null>;
  banUserInChat(streamerId: number, userId: number): Promise<null>;
}
