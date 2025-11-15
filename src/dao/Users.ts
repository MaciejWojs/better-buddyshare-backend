/**
 * Users DAO.
 *
 * Provides data-access methods for user-related operations such as finding
 * users, creating users, updating profile fields and banning/unbanning.
 * Uses BaseDAO helpers to execute queries and map errors.
 *
 * @module dao/Users
 */
import { sql } from 'bun';
import { BaseDAO } from './BaseDao';
import { IUserDAO } from './interfaces';
import { User } from '@src/types/db';

export class UserDAO extends BaseDAO implements IUserDAO {
  /**
   * Singleton instance holder.
   */
  private static instance: UserDAO | null = null;

  /**
   * Protected constructor to enforce singleton usage via getInstance.
   */
  private constructor() {
    super();
  }

  /**
   * Get singleton instance of UserDAO.
   *
   * @returns UserDAO singleton instance
   */
  public static getInstance(): UserDAO {
    if (!this.instance) {
      this.instance = new UserDAO();
      console.log(`Creating new ${this.prototype.constructor.name} instance`);
    }

    return this.instance;
  }

  /**
   * Find user by numeric id.
   *
   * @param id - User id to look up
   * @returns The User record or null when not found
   */
  async findById(id: number) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          get_user_by_id (${id})
      `,
    );
  }

  /**
   * Find user by email address.
   *
   * @param email - Email to look up
   * @returns The User record or null when not found
   */
  async findByEmail(email: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          get_user_by_email (${email})
      `,
    );
  }

  /**
   * Unban a user globally.
   *
   * @param user_id - ID of the user to unban
   * @returns Updated User record or null
   */
  async unbanUser(user_id: number) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          unban_user_globally (${user_id})
      `,
    );
  }

  /**
   * Ban a user globally with an optional reason.
   *
   * @param user_id - ID of the user to ban
   * @param reason - Optional ban reason
   * @returns Updated User record or null
   */
  async banUser(user_id: number, reason: string | null = null) {
    if (reason) {
      return await this.executeQuery<User>(
        () => sql`
          SELECT
            *
          FROM
            ban_user_globally (
              ${user_id},
              ${reason}
            )
        `,
      );
    }

    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          ban_user_globally (${user_id})
      `,
    );
  }

  /**
   * Update user's profile picture (avatar).
   *
   * @param user_id - ID of the user
   * @param profile_picture - New avatar URL or identifier
   * @returns Updated User record or null
   */
  async updateProfilePicture(user_id: number, profile_picture: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_avatar (
            ${user_id},
            ${profile_picture}
          )
      `,
    );
  }

  /**
   * Update user's profile banner.
   *
   * @param user_id - ID of the user
   * @param profile_banner - New banner URL or identifier
   * @returns Updated User record or null
   */
  async updateProfileBanner(user_id: number, profile_banner: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_profile_banner (
            ${user_id},
            ${profile_banner}
          )
      `,
    );
  }

  /**
   * Update user's bio/description.
   *
   * @param user_id - ID of the user
   * @param description - New user description
   * @returns Updated User record or null
   */
  async updateBio(user_id: number, description: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_description (
            ${user_id},
            ${description}
          )
      `,
    );
  }

  /**
   * Update user's username.
   *
   * @param user_id - ID of the user
   * @param username - New username
   * @returns Updated User record or null
   */
  async updateUsername(user_id: number, username: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_username (
            ${user_id},
            ${username}
          )
      `,
    );
  }

  /**
   * Update user's email address.
   *
   * @param user_id - ID of the user
   * @param email - New email address
   * @returns Updated User record or null
   */
  async updateEmail(user_id: number, email: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_email (
            ${user_id},
            ${email}
          )
      `,
    );
  }

  /**
   * Update user's password (hashed).
   *
   * @param user_id - ID of the user
   * @param password - New password (should be pre-hashed)
   * @returns Updated User record or null
   */
  async updatePassword(user_id: number, password: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          update_user_password (
            ${user_id},
            ${password}
          )
      `,
    );
  }

  /**
   * Create a new user with username, email and password.
   *
   * @param username - Desired username
   * @param email - User email
   * @param password - Password (should be pre-hashed)
   * @returns Newly created User record or null
   */
  async createUser(username: string, email: string, password: string) {
    return await this.executeQuery<User>(
      () => sql`
        SELECT
          *
        FROM
          create_user (
            ${username},
            ${email},
            ${password}
          )
      `,
    );
  }
}
