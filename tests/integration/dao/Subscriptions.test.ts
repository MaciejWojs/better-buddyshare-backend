import { beforeEach, afterEach, describe, test, expect } from 'bun:test';
import { sql } from 'bun';
import { SubscriptionsDAO, UserDAO } from '@src/dao';
import { User } from '@src/types/db';

let subscriptionsDao: SubscriptionsDAO;
let userDao: UserDAO;
let user1: User;
let streamer1: User;
let streamer2: User;

beforeEach(async () => {
  subscriptionsDao = SubscriptionsDAO.getInstance();
  userDao = UserDAO.getInstance();

  // Wyczyść dane
  await sql`TRUNCATE TABLE subscribers CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;

  // Utwórz testowych użytkowników
  user1 = await userDao.createUser('viewer_1', 'viewer1@mail.com', 'pass123');
  streamer1 = await userDao.createUser(
    'streamer_1',
    'streamer1@mail.com',
    'pass123',
  );
  streamer2 = await userDao.createUser(
    'streamer_2',
    'streamer2@mail.com',
    'pass123',
  );

  // Uczyń streamerów faktycznymi streamerami
  await userDao.updateStreamToken(streamer1.user_id);
  await userDao.updateStreamToken(streamer2.user_id);
});

afterEach(async () => {
  await sql` TRUNCATE TABLE subscribers CASCADE; `;
  await sql` TRUNCATE TABLE users CASCADE; `;
});

//
// ========== TESTY ==========
//

describe('SubscriptionsDAO.addSubscription & subscriptionExists', () => {
  test('should create a new subscription and confirm existence', async () => {
    const created = await subscriptionsDao.addSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(created).not.toBeNull();
    expect(created!.user_id).toBe(user1.user_id);
    expect(created!.streamer_id).toBe(streamer1.user_id);

    const exists = await subscriptionsDao.subscriptionExists(
      user1.user_id,
      streamer1.user_id,
    );
    expect(exists).toBe(true);
  });

  test('should not create duplicate subscriptions', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const duplicate = await subscriptionsDao.addSubscription(
      user1.user_id,
      streamer1.user_id,
    );

    expect(duplicate).not.toBeNull();
    expect(duplicate!.user_id).toBe(user1.user_id);

    const count = await subscriptionsDao.getSubscriptionCountByUser(
      user1.user_id,
    );
    expect(count).toBe(1);
  });

  test('should throw when streamer does not exist', async () => {
    await expect(
      subscriptionsDao.addSubscription(user1.user_id, 9999),
    ).rejects.toThrow(/does not exist/);
  });
});

describe('SubscriptionsDAO.removeSubscription', () => {
  test('should remove existing subscription', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const result = await subscriptionsDao.removeSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(result).toBe(true);

    const exists = await subscriptionsDao.subscriptionExists(
      user1.user_id,
      streamer1.user_id,
    );
    expect(exists).toBe(false);
  });

  test('should return false when subscription does not exist', async () => {
    const result = await subscriptionsDao.removeSubscription(
      user1.user_id,
      streamer1.user_id,
    );
    expect(result).toBe(false);
  });
});

describe('SubscriptionsDAO.getSubscriptionsByUser / getSubscribersByStreamer', () => {
  test('should return user subscriptions list', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    await subscriptionsDao.addSubscription(user1.user_id, streamer2.user_id);

    const list = await subscriptionsDao.getSubscriptionsByUser(user1.user_id);
    expect(list.length).toBe(2);
  });

  test('should return streamer subscribers list', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);

    const list = await subscriptionsDao.getSubscribersByStreamer(
      streamer1.user_id,
    );
    expect(list.length).toBe(1);
    expect(list[0].user_id).toBe(user1.user_id);
  });
});

describe('SubscriptionsDAO counting & pagination', () => {
  test('should count subscriptions for a user', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    await subscriptionsDao.addSubscription(user1.user_id, streamer2.user_id);

    const count = await subscriptionsDao.getSubscriptionCountByUser(
      user1.user_id,
    );
    expect(count).toBe(2);
  });

  test('should count subscribers for a streamer', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const count = await subscriptionsDao.getSubscriptionCountByStreamer(
      streamer1.user_id,
    );
    expect(count).toBe(1);
  });

  test('should paginate subscriptions', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    await subscriptionsDao.addSubscription(user1.user_id, streamer2.user_id);

    const paginated = await subscriptionsDao.getSubscriptionsPaginated(
      user1.user_id,
      0,
      1,
    );
    expect(paginated.length).toBe(1);
  });

  test('should paginate subscribers', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const paginated = await subscriptionsDao.getSubscribersPaginated(
      streamer1.user_id,
      0,
      1,
    );
    expect(paginated.length).toBe(1);
  });
});

describe('SubscriptionsDAO bulk removals', () => {
  test('should remove all subscriptions by user', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    await subscriptionsDao.addSubscription(user1.user_id, streamer2.user_id);

    const deletedCount = await subscriptionsDao.removeAllSubscriptionsByUser(
      user1.user_id,
    );
    expect(deletedCount).toBe(2);
  });

  test('should remove all subscribers by streamer', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const deletedCount = await subscriptionsDao.removeAllSubscribersByStreamer(
      streamer1.user_id,
    );
    expect(deletedCount).toBe(1);
  });
});

describe('SubscriptionsDAO details & rankings', () => {
  test('should get subscription details', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const details = await subscriptionsDao.getSubscriptionDetails(
      user1.user_id,
      streamer1.user_id,
    );
    expect(details).not.toBeNull();
    expect(details!.streamer_id).toBe(streamer1.user_id);
  });

  test('should get top streamers', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const top = await subscriptionsDao.getTopStreamersBySubscribers(10);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top[0].streamer_id).toBe(streamer1.user_id);
  });

  test('should get recent subscriptions', async () => {
    await subscriptionsDao.addSubscription(user1.user_id, streamer1.user_id);
    const recent = await subscriptionsDao.getRecentSubscriptionsByUser(
      user1.user_id,
      5,
    );
    expect(recent.length).toBeGreaterThan(0);
  });
});
