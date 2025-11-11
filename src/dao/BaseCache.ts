/**
 * DAO cache helpers and error mapping utilities.
 *
 * This module provides BaseCache, an abstract base class for DAOs that
 * interact with a caching layer. It centralizes mapping of low-level cache
 * client errors to DaoError subclasses and exposes convenient async helpers
 * for get/mget/set/del operations.
 *
 * @module dao/BaseCache
 */
import {
  DaoError,
  DaoCacheConnectionError,
  DaoCacheAuthenticationError,
} from '@src/errors';
import { CacheService } from '@src/services/cache.service';

/**
 * Base abstraction for DAOs that use a caching layer.
 *
 * Provides helper methods to interact with CacheService and maps
 * underlying cache errors into DaoError subclasses.
 */
export abstract class BaseCache {
  /**
   * Instance of the CacheService used to perform cache operations.
   */
  protected cacheService: CacheService;

  /**
   * Initialize the BaseCache with the singleton CacheService instance.
   */
  protected constructor() {
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Map low-level cache errors to DaoError subclasses.
   *
   * @param error - The original error thrown by the cache client.
   * @returns A DaoError or a more specific subclass representing the failure.
   */
  protected mapCacheError(error: any): DaoError {
    if (!error) return new DaoError('Unknown cache error', error);

    if (error.code === 'ERR_REDIS_CONNECTION_CLOSED') {
      return new DaoCacheConnectionError('Cache connection closed', error);
    }
    if (error.code === 'ERR_REDIS_AUTHENTICATION_FAILED') {
      return new DaoCacheAuthenticationError(
        'Cache authentication failed',
        error,
      );
    }

    return new DaoError('Cache error', error);
  }

  /**
   * Get a value from cache by key.
   *
   * Returns null when the key does not exist.
   *
   * @template T - Expected type of the cached value.
   * @param key - Cache key to read.
   * @returns The value stored under the key or null if not present.
   * @throws DaoError when a cache-related error occurs.
   */
  protected async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const v = await this.cacheService.get<T>(key);
      return (v ?? null) as T | null;
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }

  /**
   * Get multiple values from cache by an array of keys.
   *
   * If the underlying CacheService does not provide a batch get,
   * this method falls back to parallel single gets.
   *
   * @template T - Expected type of each cached value.
   * @param keys - Array of cache keys to read.
   * @returns An array containing the values or nulls for missing keys.
   * @throws DaoError when a cache-related error occurs.
   */
  protected async cacheMGet<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      // CacheService may not have mget; fallback to parallel get
      const results = await Promise.all(
        keys.map((k) => this.cacheService.get<T>(k)),
      );
      return results.map((r) => (r ?? null) as T | null);
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }

  /**
   * Set a value in cache with optional TTL.
   *
   * @template T - Type of the value to store.
   * @param key - Cache key to set.
   * @param value - Value to store.
   * @param ttlSeconds - Optional time-to-live in seconds.
   * @throws DaoError when a cache-related error occurs.
   */
  protected async cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      await this.cacheService.set(key, value, ttlSeconds);
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }

  /**
   * Delete a key from cache.
   *
   * @param key - Cache key to remove.
   * @throws DaoError when a cache-related error occurs.
   */
  protected async cacheDel(key: string): Promise<void> {
    try {
      await this.cacheService.del(key);
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }
}
