import { User } from '@src/types/db';

export interface IUserDAO {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;

  unbanUser(user_id: number): Promise<User | null>;
  banUser(user_id: number, reason: string | null): Promise<User | null>;
  updateProfilePicture(
    user_id: number,
    profile_picture: string,
  ): Promise<User | null>;
  updateProfileBanner(
    user_id: number,
    profile_banner: string,
  ): Promise<User | null>;
  updateBio(user_id: number, description: string): Promise<User | null>;
  updateUsername(user_id: number, username: string): Promise<User | null>;
  updateEmail(user_id: number, email: string): Promise<User | null>;
  updatePassword(user_id: number, password: string): Promise<User | null>;
  createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<User | null>;
}
