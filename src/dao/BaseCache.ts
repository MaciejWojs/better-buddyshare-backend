import {
  DaoError,
  DaoCacheConnectionError,
  DaoCacheAuthenticationError,
} from '@src/errors/DaoError';
import { CacheService } from '@src/services/cache.service';

export abstract class BaseCache {
  protected cacheService: CacheService;

  protected constructor() {
    this.cacheService = CacheService.getInstance();
  }

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

  protected async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const v = await this.cacheService.get<T>(key);
      return (v ?? null) as T | null;
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }

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

  protected async cacheDel(key: string): Promise<void> {
    try {
      await this.cacheService.del(key);
    } catch (err: any) {
      throw this.mapCacheError(err);
    }
  }
}
