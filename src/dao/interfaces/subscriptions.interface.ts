import {
  Subscription,
  TopStreamer,
  UserAsSubscriber,
  UserAsSubscriberWithStreamer,
} from '@src/types/db/';

// -- get_recent_subscriptions_by_user(p_user_id INTEGER, p_limit INTEGER)
export interface ISubscriptionsDAO {
  // Check if a subscription exists for a user and a streamer
  subscriptionExists(userId: number, streamerId: number): Promise<boolean>;

  // Add a new subscription (or return existing one if already subscribed)
  addSubscription(
    userId: number,
    streamerId: number,
  ): Promise<Subscription | null>;

  // Remove a subscription
  removeSubscription(userId: number, streamerId: number): Promise<boolean>;

  // Get all subscriptions for a given user
  getSubscriptionsByUser(userId: number): Promise<UserAsSubscriber[]>;

  // Get all subscribers for a given streamer
  getSubscribersByStreamer(streamerId: number): Promise<UserAsSubscriber[]>;

  // Get subscription count for a user
  getSubscriptionCountByUser(userId: number): Promise<number>;

  // Get subscription count for a streamer
  getSubscriptionCountByStreamer(streamerId: number): Promise<number>;

  // Get a paginated list of subscribers for a given streamer
  getSubscribersPaginated(
    streamerId: number,
    limit: number,
    offset: number,
  ): Promise<UserAsSubscriber[]>;

  // Get a paginated list of subscriptions for a given user
  getSubscriptionsPaginated(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<UserAsSubscriber[]>;

  // Remove all subscriptions for a given user
  removeAllSubscriptionsByUser(userId: number): Promise<number>;

  // Remove all subscribers for a given streamer
  removeAllSubscribersByStreamer(streamerId: number): Promise<number>;

  // Get the details of a subscriber by their subscription ID
  getSubscriberDetails(
    subscriberId: number,
  ): Promise<UserAsSubscriberWithStreamer | null>;

  // Get the details of a subscription between a user and a streamer
  getSubscriptionDetails(
    userId: number,
    streamerId: number,
  ): Promise<UserAsSubscriberWithStreamer | null>;

  // Get the top streamers by subscriber count
  getTopStreamersBySubscribers(limit: number): Promise<TopStreamer[]>;

  // Get the recent subscriptions of a user (e.g., the last few subscriptions)
  getRecentSubscriptionsByUser(
    userId: number,
    limit: number,
  ): Promise<UserAsSubscriber[]>;
}
