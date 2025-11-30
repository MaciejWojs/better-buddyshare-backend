import { afterEach, test, expect, beforeEach } from 'bun:test';
import { sql } from 'bun';
import { UserDAO } from '../../test-setup';

// using exported instance from test-setup

afterEach(async () => {
  await sql`TRUNCATE TABLE users CASCADE`;
});

test('Create user', async () => {
  const user = await UserDAO.createUser(
    'john_doe',
    'john@example.com',
    'password123',
  );
  //   expect(user?.length).toBe(1);
  expect(user?.username).toBe('john_doe');
  expect(user?.email).toBe('john@example.com');
});

test('Find user by ID', async () => {
  const created = await UserDAO.createUser(
    'jane_doe',
    'jane@example.com',
    'securepass',
  );
  const user_id = created?.user_id;
  const user = await UserDAO.findById(user_id!);
  //   expect(user?.length).toBe(1);
  expect(user?.username).toBe('jane_doe');
});

test('Find user by Email', async () => {
  await UserDAO.createUser('mark_smith', 'mark@example.com', 'pass123');
  const user = await UserDAO.findByEmail('mark@example.com');
  //   expect(user?.length).toBe(1);
  expect(user?.username).toBe('mark_smith');
});

test('Ban and unban user globally', async () => {
  const created = await UserDAO.createUser(
    'alice',
    'alice@example.com',
    'alicepass',
  );
  const user_id = created?.user_id;

  const banned = await UserDAO.banUser(user_id!, 'Violation of rules');
  expect(banned?.is_banned).toBe(true);
  expect(banned?.ban_reason).toBe('Violation of rules');

  const unbanned = await UserDAO.unbanUser(user_id!);
  expect(unbanned?.is_banned).toBe(false);
  expect(unbanned?.ban_reason).toBe(null);
});

test('Update user profile fields', async () => {
  const created = await UserDAO.createUser('bob', 'bob@example.com', 'bobpass');
  const user_id = created?.user_id;

  const [avatar, banner, bio, username, email, password] = await Promise.all([
    UserDAO.updateProfilePicture(user_id!, 'avatar.png'),
    UserDAO.updateProfileBanner(user_id!, 'banner.png'),
    UserDAO.updateBio(user_id!, 'Hello World!'),
    UserDAO.updateUsername(user_id!, 'bobby'),
    UserDAO.updateEmail(user_id!, 'bobby@example.com'),
    UserDAO.updatePassword(user_id!, 'newpass'),
  ]);

  expect(avatar?.avatar).toBe('avatar.png');
  expect(banner?.profile_banner).toBe('banner.png');
  expect(bio?.description).toBe('Hello World!');
  expect(username?.username).toBe('bobby');
  expect(email?.email).toBe('bobby@example.com');
  expect(password?.password).toBe('newpass');
});

test('Prevent duplicate users', async () => {
  const original = await UserDAO.createUser(
    'unique_user',
    'unique@example.com',
    'password',
  );
  const duplicate = await UserDAO.createUser(
    'unique_user',
    'unique@example.com',
    'password',
  );
  //   expect(duplicate.length).toBe(1); // Should return the existing user
  expect(duplicate?.user_id).toBe(original?.user_id);
});
