import { beforeEach, afterEach, describe, test, expect } from 'bun:test';
import { sql } from 'bun';
import { SubscriptionsDAO, UserDAO } from '../../test-setup';
import { User } from '@src/types';

let user1: User;
let streamer1: User;
let streamer2: User;

beforeEach(async () => {
  // instances are imported from test-setup

  // Wyczyść dane

  await sql`
    TRUNCATE TABLE subscribers CASCADE;

    TRUNCATE TABLE users CASCADE;
  `.simple();

  // Utwórz testowych użytkowników
  const [u1, s1, s2] = await Promise.all([
    UserDAO.createUser('viewer_1', 'viewer1@mail.com', 'pass123'),
    UserDAO.createUser('streamer_1', 'streamer1@mail.com', 'pass123'),
    UserDAO.createUser('streamer_2', 'streamer2@mail.com', 'pass123'),
  ]);

  user1 = u1;
  streamer1 = s1;
  streamer2 = s2;

  // Uczyń streamerów faktycznymi streamerami
  await UserDAO.updateStreamToken(streamer1.user_id);
  await UserDAO.updateStreamToken(streamer2.user_id);
});

afterEach(async () => {
  await sql`
    TRUNCATE TABLE subscribers CASCADE;

    TRUNCATE TABLE users CASCADE;
  `.simple();
});

//
// ========== TESTY ==========
//

describe('SubscriptionsDAO.addSubscription & subscriptionExists', () => {
  test('should create a new subscription and confirm existence', async () => {
    const created = await SubscriptionsDAO.addSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(created).not.toBeNull();
    expect(created!.user_id).toBe(user1.user_id);
    expect(created!.streamer_id).toBe(streamer1.user_id);

    const exists = await SubscriptionsDAO.subscriptionExists(
      user1.user_id,
      streamer1.user_id,
    );
    expect(exists).toBe(true);
  });

  test('should not create duplicate subscriptions', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const duplicate = await SubscriptionsDAO.addSubscription(
      user1.user_id,
      streamer1.user_id,
    );

    expect(duplicate).not.toBeNull();
    expect(duplicate!.user_id).toBe(user1.user_id);

    const count = await SubscriptionsDAO.getSubscriptionCountByUser(
      user1.user_id,
    );
    expect(count).toBe(1);
  });

  test('should throw when streamer does not exist', async () => {
    await expect(
      SubscriptionsDAO.addSubscription(user1.user_id, 9999),
    ).rejects.toThrow(/does not exist/);
  });
});

describe('SubscriptionsDAO.removeSubscription', () => {
  test('should remove existing subscription', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const result = await SubscriptionsDAO.removeSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(result).toBe(true);

    const exists = await SubscriptionsDAO.subscriptionExists(
      user1.user_id,
      streamer1.user_id,
    );
    expect(exists).toBe(false);
  });

  test('should return false when subscription does not exist', async () => {
    const result = await SubscriptionsDAO.removeSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(result).toBe(false);
  });
});

describe('SubscriptionsDAO.getSubscriptionsByUser / getSubscribersByStreamer', () => {
  test('should return user subscriptions list', async () => {
    await Promise.all([
      SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id),
      SubscriptionsDAO.addSubscription(user1.user_id, streamer2.user_id),
    ]);

    const list = await SubscriptionsDAO.getSubscriptionsByUser(user1.user_id);
    expect(list.length).toBe(2);
  });

  test('should return streamer subscribers list', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);

    const list = await SubscriptionsDAO.getSubscribersByStreamer(
      streamer1.user_id,
    );
    expect(list.length).toBe(1);
    expect(list[0].user_id).toBe(user1.user_id);
  });
});

describe('SubscriptionsDAO counting & pagination', () => {
  test('should count subscriptions for a user', async () => {
    await Promise.all([
      SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id),
      SubscriptionsDAO.addSubscription(user1.user_id, streamer2.user_id),
    ]);

    const count = await SubscriptionsDAO.getSubscriptionCountByUser(
      user1.user_id,
    );
    expect(count).toBe(2);
  });

  test('should count subscribers for a streamer', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const count = await SubscriptionsDAO.getSubscriptionCountByStreamer(
      streamer1.user_id,
    );
    expect(count).toBe(1);
  });

  test('should paginate subscriptions', async () => {
    await Promise.all([
      SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id),
      SubscriptionsDAO.addSubscription(user1.user_id, streamer2.user_id),
    ]);

    const paginated = await SubscriptionsDAO.getSubscriptionsPaginated(
      user1.user_id,
      0,
      1,
    );
    expect(paginated.length).toBe(1);
  });

  test('should paginate subscribers', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const paginated = await SubscriptionsDAO.getSubscribersPaginated(
      streamer1.user_id,
      0,
      1,
    );
    expect(paginated.length).toBe(1);
  });
});

describe('SubscriptionsDAO bulk removals', () => {
  test('should remove all subscriptions by user', async () => {
    await Promise.all([
      SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id),
      SubscriptionsDAO.addSubscription(user1.user_id, streamer2.user_id),
    ]);

    const deletedCount = await SubscriptionsDAO.removeAllSubscriptionsByUser(
      user1.user_id,
    );
    expect(deletedCount).toBe(2);
  });

  test('should remove all subscribers by streamer', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const deletedCount = await SubscriptionsDAO.removeAllSubscribersByStreamer(
      streamer1.user_id,
    );
    expect(deletedCount).toBe(1);
  });
});

describe('SubscriptionsDAO details & rankings', () => {
  test('should get subscription details', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const details = await SubscriptionsDAO.getSubscriptionDetails(
      user1.user_id,
      streamer1.user_id,
    );
    expect(details).not.toBeNull();
    expect(details!.streamer_id).toBe(streamer1.user_id);
  });

  test('should get top streamers', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const top = await SubscriptionsDAO.getTopStreamersBySubscribers(10);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top[0].streamer_id).toBe(streamer1.user_id);
  });

  test('should get recent subscriptions', async () => {
    await SubscriptionsDAO.addSubscription(user1.user_id, streamer1.user_id);
    const recent = await SubscriptionsDAO.getRecentSubscriptionsByUser(
      user1.user_id,
      5,
    );
    expect(recent.length).toBeGreaterThan(0);
  });
});
