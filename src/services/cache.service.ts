import { User } from '@src/types';
import { RedisClient } from 'bun';

export class CacheService {
  private static instance: CacheService | null = null;
  private client: RedisClient;

  private constructor() {
    console.log(`Initializing ${this.constructor.name} service`);
    this.client = new RedisClient();
    this.client
      .connect()
      .then(() => {
        console.log('Redis/valkey client connected successfully');
      })
      .catch((error) => {
        console.error('Error connecting to Redis:', error);
      });
  }

  public static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  public async get<T = User>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  public async getRaw(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error getting raw key ${key} from Redis:`, error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
    }
  }

  public async setRaw(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`Error setting raw key ${key} in Redis:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
    }
  }

  public async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`Error setting expiration for key ${key}:`, error);
    }
  }

  // Dodatkowe utility methods
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Error getting keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results = await this.client.mget(...keys);
      return results.map((result) => (result ? JSON.parse(result) : null));
    } catch (error) {
      console.error(`Error getting multiple keys:`, error);
      return new Array(keys.length).fill(null);
    }
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(
          `Invalidated ${keys.length} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      console.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }

  // Bezpośredni dostęp do klienta jeśli potrzebny
  public getClient(): RedisClient {
    return this.client;
  }
}
