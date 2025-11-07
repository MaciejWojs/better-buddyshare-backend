import { IUserRepository } from './user.interface';
import { UserDAO } from '../dao/Users';
import { User } from '../types/db/User';
import { UserCacheDao } from '../dao/UsersCache';
import { BaseRepository } from './BaseRepository';

/**
 * Repository for user operations with caching support.
 * Provides methods for user CRUD operations while maintaining cache consistency.
 */
export class UserRepository extends BaseRepository implements IUserRepository {
  private readonly dao: UserDAO;
  private readonly cache: UserCacheDao;

  constructor(dao?: UserDAO, cache?: UserCacheDao) {
    super();
    this.dao = dao ?? UserDAO.getInstance();
    this.cache = cache ?? UserCacheDao.getInstance();
  }

  //! Important: methods in repository should be 1:1 with methods in DAO
  // ! Make sure it's returning the same type as in DAO interface -> promise<User | null>

  /**
   * Retrieves a user by their ID with cache-first strategy.
   * @param id - The user ID to search for
   * @returns Promise resolving to the user object or null if not found
   */
  async getUserById(id: number) {
    const cachedUser = await this.cache.findById(id);
    if (cachedUser) return cachedUser;

    const user = await this.safeDaoCall<User>(this.dao.findById(id));
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Creates a new user account.
   * @param username - The username for the new account
   * @param email - The email address for the new account
   * @param password - The password for the new account
   * @returns Promise resolving to the created user object
   */
  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.safeDaoCall<User>(
      this.dao.createUser(username, email, password),
    );
    if (user) this.cache.upsertUser(user);
    return user ?? null;
  }

  /**
   * Retrieves a user by their email address with cache-first strategy.
   * @param email - The email address to search for
   * @returns Promise resolving to the user object or null if not found
   */
  async getUserByEmail(email: string) {
    const cachedUser = await this.cache.findByEmail(email);
    if (cachedUser) return cachedUser;

    const user = await this.safeDaoCall<User>(this.dao.findByEmail(email));
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Bans a user account with an optional reason.
   * @param user_id - The ID of the user to ban
   * @param reason - Optional reason for the ban
   * @returns Promise resolving to the updated user object
   */
  async banUser(user_id: number, reason: string | null = null) {
    const user = await this.safeDaoCall<User>(
      this.dao.banUser(user_id, reason),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Unbans a previously banned user account.
   * @param user_id - The ID of the user to unban
   * @returns Promise resolving to the updated user object
   */
  async unbanUser(user_id: number) {
    const user = await this.safeDaoCall<User>(this.dao.unbanUser(user_id));
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's profile picture.
   * @param user_id - The ID of the user to update
   * @param profile_picture - The new profile picture URL or path
   * @returns Promise resolving to the updated user object
   */
  async updateProfilePicture(user_id: number, profile_picture: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updateProfilePicture(user_id, profile_picture),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's profile banner.
   * @param user_id - The ID of the user to update
   * @param profile_banner - The new profile banner URL or path
   * @returns Promise resolving to the updated user object
   */
  async updateProfileBanner(user_id: number, profile_banner: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updateProfileBanner(user_id, profile_banner),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's bio/description.
   * @param user_id - The ID of the user to update
   * @param description - The new bio description
   * @returns Promise resolving to the updated user object
   */
  async updateBio(user_id: number, description: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updateBio(user_id, description),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's username.
   * @param user_id - The ID of the user to update
   * @param username - The new username
   * @returns Promise resolving to the updated user object
   */
  async updateUsername(user_id: number, username: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updateUsername(user_id, username),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's email address.
   * @param user_id - The ID of the user to update
   * @param email - The new email address
   * @returns Promise resolving to the updated user object
   */
  async updateEmail(user_id: number, email: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updateEmail(user_id, email),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }

  /**
   * Updates a user's password.
   * @param user_id - The ID of the user to update
   * @param password - The new password (should be hashed)
   * @returns Promise resolving to the updated user object
   */
  async updatePassword(user_id: number, password: string) {
    const user = await this.safeDaoCall<User>(
      this.dao.updatePassword(user_id, password),
    );
    if (user) this.cache.upsertUser(user);
    return user;
  }
}
