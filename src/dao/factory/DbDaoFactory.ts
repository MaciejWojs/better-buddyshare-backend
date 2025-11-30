import { IDbClient } from '@src/db/interfaces';
import {
  MessagesDAO,
  PermissionDAO,
  RefreshTokenDAO,
  RolesDAO,
  SessionDAO,
  StreamAnalyticsDAO,
  StreamStatisticsDAO,
  StreamStatsTypesDAO,
  StreamersDAO,
  StreamsDAO,
  SubscriptionsDAO,
  UserDAO,
  UserRolesDAO,
} from '@src/dao';
import { IDbDaoFactory } from './interfaces';

export class DbDaoFactory implements IDbDaoFactory {
  private static instance: DbDaoFactory;
  private constructor(private readonly dbClient: IDbClient) {}

  public static getInstance(dbClient: IDbClient): DbDaoFactory {
    if (!this.instance) {
      this.instance = new DbDaoFactory(dbClient);
    }
    return this.instance;
  }

  Messages(): MessagesDAO {
    return new MessagesDAO(this.dbClient);
  }

  Permission(): PermissionDAO {
    return new PermissionDAO(this.dbClient);
  }

  RefreshToken(): RefreshTokenDAO {
    return new RefreshTokenDAO(this.dbClient);
  }

  Roles(): RolesDAO {
    return new RolesDAO(this.dbClient);
  }

  Session(): SessionDAO {
    return new SessionDAO(this.dbClient);
  }

  StreamAnalytics(): StreamAnalyticsDAO {
    return new StreamAnalyticsDAO(this.dbClient);
  }

  StreamStatistics(): StreamStatisticsDAO {
    return new StreamStatisticsDAO(this.dbClient);
  }

  StreamStatsTypes(): StreamStatsTypesDAO {
    return new StreamStatsTypesDAO(this.dbClient);
  }

  Streamers(): StreamersDAO {
    return new StreamersDAO(this.dbClient);
  }

  Streams(): StreamsDAO {
    return new StreamsDAO(this.dbClient);
  }

  Subscriptions(): SubscriptionsDAO {
    return new SubscriptionsDAO(this.dbClient);
  }

  User(): UserDAO {
    return new UserDAO(this.dbClient);
  }

  UserRoles(): UserRolesDAO {
    return new UserRolesDAO(this.dbClient);
  }
}
