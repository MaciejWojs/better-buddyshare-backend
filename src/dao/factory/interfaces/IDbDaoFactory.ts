import * as dao from '@src/dao';

export interface IDbDaoFactory {
  Messages(): dao.MessagesDAO;
  Permission(): dao.PermissionDAO;
  RefreshToken(): dao.RefreshTokenDAO;
  Roles(): dao.RolesDAO;
  Session(): dao.SessionDAO;
  StreamAnalytics(): dao.StreamAnalyticsDAO;
  StreamStatistics(): dao.StreamStatisticsDAO;
  StreamStatsTypes(): dao.StreamStatsTypesDAO;
  Streamers(): dao.StreamersDAO;
  Streams(): dao.StreamsDAO;
  Subscriptions(): dao.SubscriptionsDAO;
  User(): dao.UserDAO;
  UserRoles(): dao.UserRolesDAO;
}
