import * as dao from '@src/dao';

export interface ICacheDaoFactory {
  UserCache(): dao.UserCacheDao;
}
