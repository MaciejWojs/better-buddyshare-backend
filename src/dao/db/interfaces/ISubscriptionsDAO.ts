import {
  Subscription,
  TopStreamer,
  UserAsSubscriber,
  UserAsSubscriberWithStreamer,
} from '@src/types';

// -- get_recent_subscriptions_by_user(p_user_id INTEGER, p_limit INTEGER)
export interface ISubscriptionsDAO {
  // Check if a subscription exists for a user and a streamer
  subscriptionExists(user_id: number, streamer_id: number): Promise<boolean>;

  // Add a new subscription (or return existing one if already subscribed)
  addSubscription(
    user_id: number,
    streamer_id: number,
  ): Promise<Subscription | null>;

  // Remove a subscription
  removeSubscription(user_id: number, streamer_id: number): Promise<boolean>;

  // Get all subscriptions for a given user
  getSubscriptionsByUser(user_id: number): Promise<UserAsSubscriber[]>;

  // Get all subscribers for a given streamer
  getSubscribersByStreamer(streamer_id: number): Promise<UserAsSubscriber[]>;

  // Get subscription count for a user
  getSubscriptionCountByUser(user_id: number): Promise<number>;

  // Get subscription count for a streamer
  getSubscriptionCountByStreamer(streamer_id: number): Promise<number>;

  // Get a paginated list of subscribers for a given streamer
  getSubscribersPaginated(
    streamer_id: number,
    offset: number,
    limit: number,
  ): Promise<UserAsSubscriber[]>;

  // Get a paginated list of subscriptions for a given user
  getSubscriptionsPaginated(
    user_id: number,
    offset: number,
    limit: number,
  ): Promise<UserAsSubscriber[]>;

  // Remove all subscriptions for a given user
  removeAllSubscriptionsByUser(user_id: number): Promise<number>;

  // Remove all subscribers for a given streamer
  removeAllSubscribersByStreamer(streamer_id: number): Promise<number>;

  // Get the details of a subscriber by their subscription ID
  getSubscriberDetails(
    subscriberId: number,
  ): Promise<UserAsSubscriberWithStreamer | null>;

  // Get the details of a subscription between a user and a streamer
  getSubscriptionDetails(
    user_id: number,
    streamer_id: number,
  ): Promise<UserAsSubscriberWithStreamer | null>;

  // Get the top streamers by subscriber count
  getTopStreamersBySubscribers(limit: number): Promise<TopStreamer[]>;

  // Get the recent subscriptions of a user (e.g., the last few subscriptions)
  getRecentSubscriptionsByUser(
    user_id: number,
    limit: number,
  ): Promise<UserAsSubscriber[]>;
}
