import { UserCacheDao } from '../cache';
import { ICacheDaoFactory } from './interfaces';

export class CacheDaoFactory implements ICacheDaoFactory {
  private static instance: CacheDaoFactory;

  public constructor() {}

  public static getInstance(): CacheDaoFactory {
    if (!this.instance) {
      this.instance = new CacheDaoFactory();
    }
    return this.instance;
  }

  UserCache(): UserCacheDao {
    return new UserCacheDao();
  }
}
