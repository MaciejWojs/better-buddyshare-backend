/**
 * Users DAO - New implementation with raw SQL queries.
 *
 * Provides data-access methods for user-related operations.
 * Uses direct SQL queries instead of stored functions.
 *
 * @module dao/Users
 */
import { BaseDAO } from './BaseDao';
import { IDbClient } from '@src/db/interfaces';
import { IUserDAO } from './interfaces';
import { User } from '@src/types';

export class UserDAO extends BaseDAO implements IUserDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async findById(id: number): Promise<User | null> {
    return await this.executeQuery<User>(
      `SELECT * FROM users WHERE user_id = $1`,
      [id],
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.executeQuery<User>(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );
  }

  async unbanUser(user_id: number): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users 
       SET is_banned = false, ban_reason = NULL, ban_expires_at = NULL
       WHERE user_id = $1
       RETURNING *`,
      [user_id],
    );
  }

  async banUser(
    user_id: number,
    reason: string | null = null,
  ): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET is_banned = true, ban_reason = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, reason],
    );
  }

  async updateProfilePicture(
    user_id: number,
    profile_picture: string,
  ): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET avatar = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, profile_picture],
    );
  }

  async updateProfileBanner(
    user_id: number,
    profile_banner: string,
  ): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET profile_banner = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, profile_banner],
    );
  }

  async updateBio(user_id: number, description: string): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET description = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, description],
    );
  }

  async updateUsername(
    user_id: number,
    username: string,
  ): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET username = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, username],
    );
  }

  async updateEmail(user_id: number, email: string): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET email = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, email],
    );
  }

  async updatePassword(
    user_id: number,
    password: string,
  ): Promise<User | null> {
    return await this.executeQuery<User>(
      `UPDATE users SET password = $2 WHERE user_id = $1 RETURNING *`,
      [user_id, password],
    );
  }

  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user) return user;

    return await this.executeQuery<User>(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [username, email, password],
    );
  }

  async updateStreamToken(user_id: number): Promise<User | null> {
    //! TODO: ZMIENIC NA RECZNA GENERACJE TOKENA + testy
    return await this.executeQuery<User>(
      `UPDATE users SET stream_token = gen_random_uuid()::text WHERE user_id = $1 RETURNING *`,
      [user_id],
    );
  }
}
