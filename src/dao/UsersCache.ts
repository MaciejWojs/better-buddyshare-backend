import { User } from '../types/db/User';
import { isEqual } from 'lodash';
import { CacheService } from '../services/cache.service';

// const client = cacheService.getClient();

/**
 * Data Access Object for user caching operations in Redis
 *
 * Singleton class managing user data caching in Redis.
 * Provides fast access to user data and email -> user_id mapping.
 *
 * @example
 * ```typescript
 * const userCache = UserCacheDao.getInstance();
 * const user = await userCache.findById(123);
 * await userCache.upsertUser(userData);
 * ```
 */
import { BaseCache } from './BaseCache';

export class UserCacheDao extends BaseCache {
  private static instance: UserCacheDao | null = null;
  /**
   * Prywatny konstruktor dla wzorca Singleton
   * @private
   */
  private constructor() {
    super();
  }
  /**
   * Returns the single instance of UserCacheDao class (Singleton pattern)
   *
   * Creates a new instance only if it doesn't exist, otherwise returns the existing one
   *
   * @returns The UserCacheDao instance
   *
   * @example
   * ```typescript
   * const userCache = UserCacheDao.getInstance();
   * ```
   */
  public static getInstance(): UserCacheDao {
    if (!this.instance) {
      this.instance = new UserCacheDao();
      console.log(`Creating new ${this.prototype.constructor.name} instance`);
    }

    return this.instance;
  }

  /**
   * Searches for a user in Redis cache by ID
   *
   * - Fetches user from cache under key `user:${id}`
   * - Automatically converts date strings to Date objects (created_at, ban_expires_at)
   * - Logs cache hit/miss information for debugging purposes
   * - Uses CacheService for consistent error handling
   *
   * @param id - User ID to search for
   * @returns Promise resolving to user object or null if not found
   * @throws Error when Redis connection problem occurs
   *
   * @example
   * ```typescript
   * const user = await userCache.findById(123);
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   * }
   * ```
   *
   * @see {@link CacheService.get}
   */
  async findById(id: number): Promise<User | null> {
    const cachedUser = await this.cacheGet<User>(`user:${id}`);
    if (cachedUser) {
      console.log(`Cache hit for user ID ${id}`);
      // Automatyczna konwersja dat przez CacheService
      // Ręczna konwersja jako fallback (może zostać usunięta po implementacji auto-konwersji)
      if (cachedUser.created_at)
        cachedUser.created_at = new Date(cachedUser.created_at);
      if (cachedUser.ban_expires_at)
        cachedUser.ban_expires_at = new Date(cachedUser.ban_expires_at);
      return cachedUser;
    }
    console.log(`Cache miss for user ID ${id}`);
    return null;
  }

  /**
   * Searches for a user in Redis cache by email address
   *
   * - First fetches user ID from key `user:email:${email}`
   * - Then calls findById() to fetch complete user data
   * - Logs cache hit/miss information for email searches
   * - Uses two-step lookup: email -> user_id -> user data
   *
   * @param email - User email address to search for
   * @returns Promise resolving to user object or null if not found
   * @throws Error when Redis connection problem occurs
   *
   * @example
   * ```typescript
   * const user = await userCache.findByEmail('user@example.com');
   * if (user) {
   *   console.log(`Found user with ID: ${user.user_id}`);
   * }
   * ```
   *
   * @see {@link findById}
   */
  async findByEmail(email: string): Promise<User | null> {
    const mailKey = `user:email:${email}`;
    const cachedID = await this.cacheGet<string>(mailKey);
    console.log(`Looking for user email ${email} in cache`);
    if (cachedID) {
      console.log(`Cache hit for user email ${email}`);
      const userId = parseInt(cachedID);
      return this.findById(userId);
    }
    console.log(`Cache miss for user email ${email}`);
    return null;
  }

  /**
   * Creates or updates a user in Redis cache
   *
   * - Checks if user already exists in cache using findById()
   * - If exists and data is identical (comparison via lodash.isEqual), skips update
   * - If exists but data differs, removes old entry and creates new one
   * - Saves user under key `user:${id}` and creates mapping `user:email:${email}` -> `user_id`
   * - Sets cache expiration to 1 hour (3600 seconds) for both keys
   * - Uses Promise.all() for parallel Redis operations
   *
   * @param user - User object to save in cache
   * @returns Promise resolving to the user object (same as passed)
   * @throws Error when Redis write problem occurs
   *
   * @example
   * ```typescript
   * const userData = {
   *   user_id: 123,
   *   username: 'john_doe',
   *   email: 'john@example.com',
   *   created_at: new Date()
   * };
   *
   * const cachedUser = await userCache.upsertUser(userData);
   * console.log('User cached successfully:', cachedUser.username);
   * ```
   *
   * @see {@link findById}
   * @see {@link deleteUser}
   */
  async upsertUser(user: User): Promise<User> {
    const id = user.user_id;
    const key = `user:${id}`;
    const mailKey = `user:email:${user.email}`;

    const userFound = await this.findById(id);
    if (userFound) {
      if (isEqual(user, userFound)) {
        console.log(
          `User with ID ${id} has no changes. Skipping cache update.`,
        );
        return userFound;
      }

      console.log('Updating user in cache:', { old: userFound, new: user });

      await this.deleteUser(id);
      console.log(
        `User with ID ${id} already exists in cache. Updating cache with new data.`,
      );
    }

    try {
      await Promise.all([
        this.cacheSet(key, user, 3600),
        this.cacheSet(mailKey, id.toString(), 3600),
      ]);

      console.log(`User with ID ${id} cached successfully.`);
      console.log(`Cache for user ID ${id} will expire in 1 hour.`);
      console.log('Mail key set:', mailKey, '->', id);
    } catch (error) {
      console.error('Error caching user:', error);
      throw error;
    }

    return user;
  }

  /**
   * Removes a user from Redis cache
   *
   * - Removes user entry from cache under key `user:${id}`
   * - Uses CacheService.del() for consistent error handling
   * - Logs information about user removal
   *
   * @param id - User ID to remove from cache
   * @throws Error when Redis deletion problem occurs
   *
   * @example
   * ```typescript
   * await userCache.deleteUser(123);
   * console.log('User removed from cache');
   * ```
   *
   * @see {@link CacheService.del}
   */
  async deleteUser(id: number): Promise<void> {
    const key = `user:${id}`;
    const [user] = await Promise.all([
      this.cacheGet<any>(key),
      this.cacheDel(key),
    ]);

    if (user) {
      await this.cacheDel(`user:email:${user.email}`);
      console.log(
        `Removed user email key binding: user:email:${user.email} -> ${id}`,
      );
    }
  }
}
