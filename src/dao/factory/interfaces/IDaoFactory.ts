import { ICacheDaoFactory, IDbDaoFactory } from '.';

export interface IDaoFactory {
  cache: ICacheDaoFactory;
  db: IDbDaoFactory;
}
