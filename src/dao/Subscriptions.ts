import {
  Subscription,
  UserAsSubscriber,
  UserAsSubscriberWithStreamer,
  TopStreamer,
} from '@src/types/db';
import { BaseDAO } from './BaseDao';
import { ISubscriptionsDAO } from './interfaces';
import { sql } from 'bun';

export class SubscriptionsDAO extends BaseDAO implements ISubscriptionsDAO {
  private static instance: SubscriptionsDAO;

  private constructor() {
    super();
  }

  public static getInstance(): SubscriptionsDAO {
    if (!SubscriptionsDAO.instance) {
      SubscriptionsDAO.instance = new SubscriptionsDAO();
    }
    return SubscriptionsDAO.instance;
  }

  async subscriptionExists(
    user_id: number,
    streamer_id: number,
  ): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          *
        FROM
          subscription_exists (
            ${user_id},
            ${streamer_id}
          )
      `,
    );
  }

  async addSubscription(
    user_id: number,
    streamer_id: number,
  ): Promise<Subscription | null> {
    return this.executeQuery<Subscription>(
      () => sql`
        SELECT
          *
        FROM
          add_subscription (
            ${user_id},
            ${streamer_id}
          )
      `,
    );
  }
  async removeSubscription(
    user_id: number,
    streamer_id: number,
  ): Promise<boolean> {
    return this.getBooleanFromQuery(
      () => sql`
        SELECT
          *
        FROM
          remove_subscription (
            ${user_id},
            ${streamer_id}
          )
      `,
    );
  }

  async getSubscriptionsByUser(user_id: number): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      () => sql`
        SELECT
          *
        FROM
          get_subscriptions_by_user (${user_id})
      `,
    );
  }

  async getSubscribersByStreamer(
    streamer_id: number,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      () => sql`
        SELECT
          *
        FROM
          get_subscribers_by_streamer (${streamer_id})
      `,
    );
  }
  async getSubscriptionCountByUser(user_id: number): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          *
        FROM
          get_subscription_count_by_user (${user_id})
      `,
    );
  }
  async getSubscriptionCountByStreamer(streamer_id: number): Promise<number> {
    return await this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          *
        FROM
          get_subscription_count_by_streamer (${streamer_id})
      `,
    );
  }

  async getSubscribersPaginated(
    streamer_id: number,
    offset: number = 0,
    limit: number = 10,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      () => sql`
        SELECT
          *
        FROM
          get_subscribers_paginated (
            ${streamer_id},
            ${offset},
            ${limit}
          )
      `,
    );
  }
  async getSubscriptionsPaginated(
    user_id: number,
    offset: number = 0,
    limit: number = 10,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      () => sql`
        SELECT
          *
        FROM
          get_subscriptions_paginated (
            ${user_id},
            ${offset},
            ${limit}
          )
      `,
    );
  }
  async removeAllSubscriptionsByUser(user_id: number): Promise<number> {
    return await this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          *
        FROM
          remove_all_subscriptions_by_user (${user_id})
      `,
    );
  }
  async removeAllSubscribersByStreamer(streamer_id: number): Promise<number> {
    return await this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          *
        FROM
          remove_all_subscribers_by_streamer (${streamer_id})
      `,
    );
  }
  async getSubscriberDetails(
    subscriberId: number,
  ): Promise<UserAsSubscriberWithStreamer | null> {
    return this.executeQuery<UserAsSubscriberWithStreamer>(
      () => sql`
        SELECT
          *
        FROM
          get_subscriber_details (${subscriberId})
      `,
    );
  }
  async getSubscriptionDetails(
    user_id: number,
    streamer_id: number,
  ): Promise<UserAsSubscriberWithStreamer | null> {
    return this.executeQuery<UserAsSubscriberWithStreamer>(
      () => sql`
        SELECT
          *
        FROM
          get_subscription_details (
            ${user_id},
            ${streamer_id}
          )
      `,
    );
  }
  async getTopStreamersBySubscribers(limit: number): Promise<TopStreamer[]> {
    return this.executeQueryMultiple<TopStreamer>(
      () => sql`
        SELECT
          *
        FROM
          get_top_streamers_by_subscribers (${limit})
      `,
    );
  }
  async getRecentSubscriptionsByUser(
    user_id: number,
    limit: number,
  ): Promise<UserAsSubscriber[]> {
    return this.executeQueryMultiple<UserAsSubscriber>(
      () => sql`
        SELECT
          *
        FROM
          get_recent_subscriptions_by_user (
            ${user_id},
            ${limit}
          )
      `,
    );
  }
}
