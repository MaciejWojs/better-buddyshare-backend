import { BunDbClient } from '@src/db';
import { CacheDaoFactory } from './CacheDaoFactory';
import { DbDaoFactory } from './DbDaoFactory';
import { ICacheDaoFactory, IDbDaoFactory } from './interfaces';
import { IDaoFactory } from './interfaces/IDaoFactory';

export class DaoFactory implements IDaoFactory {
  public readonly cache: ICacheDaoFactory;
  public readonly db: IDbDaoFactory;

  private static instance: DaoFactory;

  private constructor(
    cacheDaoFactory?: ICacheDaoFactory,
    dbDaoFactory?: IDbDaoFactory,
  ) {
    this.cache = cacheDaoFactory ?? CacheDaoFactory.getInstance();
    this.db = dbDaoFactory ?? DbDaoFactory.getInstance(new BunDbClient());
  }

  public static getInstance(
    cacheDaoFactory?: ICacheDaoFactory,
    dbDaoFactory?: IDbDaoFactory,
  ): DaoFactory {
    if (!this.instance) {
      this.instance = new DaoFactory(cacheDaoFactory, dbDaoFactory);
    }
    return this.instance;
  }
}
