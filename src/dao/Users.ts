import { sql } from 'bun';
import { IUserDAO } from './interfaces/users.interface';
import { BaseDAO } from './BaseDao';
import { User } from '../types/db/User';

export class UserDAO extends BaseDAO implements IUserDAO {
  private static instance: UserDAO | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): UserDAO {
    if (!this.instance) {
      this.instance = new UserDAO();
      console.log(`Creating new ${this.prototype.constructor.name} instance`);
    }

    return this.instance;
  }

  async findById(id: number) {
    return await this.executeQuery<User>(
      () => sql`select * from get_user_by_id(${id})`,
    );
  }

  async findByEmail(email: string) {
    return await this.executeQuery<User>(
      () => sql`select * from get_user_by_email(${email})`,
    );
  }

  async unbanUser(user_id: number) {
    return await this.executeQuery<User>(
      () => sql`select * from unban_user_globally(${user_id})`,
    );
  }

  async banUser(user_id: number, reason: string | null = null) {
    if (reason) {
      return await this.executeQuery<User>(
        () => sql`select * from ban_user_globally(${user_id}, ${reason})`,
      );
    }

    return await this.executeQuery<User>(
      () => sql`select * from ban_user_globally(${user_id})`,
    );
  }

  async updateProfilePicture(user_id: number, profile_picture: string) {
    return await this.executeQuery<User>(
      () =>
        sql`select * from update_user_avatar(${user_id}, ${profile_picture})`,
    );
  }

  async updateProfileBanner(user_id: number, profile_banner: string) {
    return await this.executeQuery<User>(
      () =>
        sql`select * from update_user_profile_banner(${user_id}, ${profile_banner})`,
    );
  }

  async updateBio(user_id: number, description: string) {
    return await this.executeQuery<User>(
      () =>
        sql`select * from update_user_description(${user_id}, ${description})`,
    );
  }

  async updateUsername(user_id: number, username: string) {
    return await this.executeQuery<User>(
      () => sql`select * from update_user_username(${user_id}, ${username})`,
    );
  }

  async updateEmail(user_id: number, email: string) {
    return await this.executeQuery<User>(
      () => sql`select * from update_user_email(${user_id}, ${email})`,
    );
  }

  async updatePassword(user_id: number, password: string) {
    return await this.executeQuery<User>(
      () => sql`select * from update_user_password(${user_id}, ${password})`,
    );
  }

  async createUser(username: string, email: string, password: string) {
    return await this.executeQuery<User>(
      () => sql`select * from create_user(${username}, ${email}, ${password})`,
    );
  }
}
