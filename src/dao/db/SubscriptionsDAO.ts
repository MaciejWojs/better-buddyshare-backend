import {
  Subscription,
  UserAsSubscriber,
  UserAsSubscriberWithStreamer,
  TopStreamer,
} from '@src/types';
import { BaseDAO } from './BaseDao';
import { ISubscriptionsDAO } from './interfaces';
import { IDbClient } from '@src/db/interfaces';

export class SubscriptionsDAO extends BaseDAO implements ISubscriptionsDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async subscriptionExists(
    user_id: number,
    streamer_id: number,
  ): Promise<boolean> {
    return this.scalar('SELECT subscription_exists($1, $2)', [
      user_id,
      streamer_id,
    ]);
  }

  async addSubscription(
    user_id: number,
    streamer_id: number,
  ): Promise<Subscription | null> {
    return this.executeQuery<Subscription>(
      'SELECT * FROM add_subscription($1, $2)',
      [user_id, streamer_id],
    );
  }
  async removeSubscription(
    user_id: number,
    streamer_id: number,
  ): Promise<boolean> {
    return this.scalar('SELECT remove_subscription($1, $2)', [
      user_id,
      streamer_id,
    ]);
  }

  async getSubscriptionsByUser(user_id: number): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      'SELECT * FROM get_subscriptions_by_user($1)',
      [user_id],
    );
  }

  async getSubscribersByStreamer(
    streamer_id: number,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      'SELECT * FROM get_subscribers_by_streamer($1)',
      [streamer_id],
    );
  }
  async getSubscriptionCountByUser(user_id: number): Promise<number> {
    return this.scalar<number>('SELECT get_subscription_count_by_user($1)', [
      user_id,
    ]);
  }
  async getSubscriptionCountByStreamer(streamer_id: number): Promise<number> {
    return await this.scalar<number>(
      'SELECT get_subscription_count_by_streamer($1)',
      [streamer_id],
    );
  }

  async getSubscribersPaginated(
    streamer_id: number,
    offset: number = 0,
    limit: number = 10,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      'SELECT * FROM get_subscribers_paginated($1, $2, $3)',
      [streamer_id, offset, limit],
    );
  }
  async getSubscriptionsPaginated(
    user_id: number,
    offset: number = 0,
    limit: number = 10,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      'SELECT * FROM get_subscriptions_paginated($1, $2, $3)',
      [user_id, offset, limit],
    );
  }
  async removeAllSubscriptionsByUser(user_id: number): Promise<number> {
    return await this.scalar<number>(
      'SELECT remove_all_subscriptions_by_user($1)',
      [user_id],
    );
  }
  async removeAllSubscribersByStreamer(streamer_id: number): Promise<number> {
    return await this.scalar<number>(
      'SELECT remove_all_subscribers_by_streamer($1)',
      [streamer_id],
    );
  }
  async getSubscriberDetails(
    subscriberId: number,
  ): Promise<UserAsSubscriberWithStreamer | null> {
    return this.executeQuery<UserAsSubscriberWithStreamer>(
      'SELECT * FROM get_subscriber_details($1)',
      [subscriberId],
    );
  }
  async getSubscriptionDetails(
    user_id: number,
    streamer_id: number,
  ): Promise<UserAsSubscriberWithStreamer | null> {
    return this.executeQuery<UserAsSubscriberWithStreamer>(
      'SELECT * FROM get_subscription_details($1, $2)',
      [user_id, streamer_id],
    );
  }
  async getTopStreamersBySubscribers(limit: number): Promise<TopStreamer[]> {
    return this.executeQueryMultiple<TopStreamer>(
      'SELECT * FROM get_top_streamers_by_subscribers($1)',
      [limit],
    );
  }
  async getRecentSubscriptionsByUser(
    user_id: number,
    limit: number,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      'SELECT * FROM get_recent_subscriptions_by_user($1, $2)',
      [user_id, limit],
    );
  }
}
