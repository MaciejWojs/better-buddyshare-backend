import { beforeAll, afterAll, afterEach, test, expect, beforeEach } from 'bun:test';
import { $, sleep, sql } from 'bun';
import { UserDAO } from '../../src/dao/Users';

let userDao: UserDAO;


beforeEach(() => {
    userDao = UserDAO.getInstance();
});

afterEach(async () => {
    await sql`TRUNCATE TABLE users CASCADE`;
});

test("Create user", async () => {
    const user = await userDao.createUser("john_doe", "john@example.com", "password123");
    expect(user.length).toBe(1);
    expect(user[0].username).toBe("john_doe");
    expect(user[0].email).toBe("john@example.com");
});

test("Find user by ID", async () => {
    const created = await userDao.createUser("jane_doe", "jane@example.com", "securepass");
    const user_id = created[0].user_id;
    const user = await userDao.findById(user_id);
    expect(user.length).toBe(1);
    expect(user[0].username).toBe("jane_doe");
});

test("Find user by Email", async () => {
    await userDao.createUser("mark_smith", "mark@example.com", "pass123");
    const user = await userDao.findByEmail("mark@example.com");
    expect(user.length).toBe(1);
    expect(user[0].username).toBe("mark_smith");
});

test("Ban and unban user globally", async () => {
    const created = await userDao.createUser("alice", "alice@example.com", "alicepass");
    const user_id = created[0].user_id;

    const banned = await userDao.banUser(user_id, "Violation of rules");
    expect(banned[0].is_banned).toBe(true);
    expect(banned[0].ban_reason).toBe("Violation of rules");

    const unbanned = await userDao.unbanUser(user_id);
    expect(unbanned[0].is_banned).toBe(false);
    expect(unbanned[0].ban_reason).toBe(null);
});

test("Update user profile fields", async () => {
    const created = await userDao.createUser("bob", "bob@example.com", "bobpass");
    const user_id = created[0].user_id;

    const avatar = await userDao.updateProfilePicture(user_id, "avatar.png");
    expect(avatar[0].avatar).toBe("avatar.png");

    const banner = await userDao.updateProfileBanner(user_id, "banner.png");
    expect(banner[0].profile_banner).toBe("banner.png");

    const bio = await userDao.updateBio(user_id, "Hello World!");
    expect(bio[0].description).toBe("Hello World!");

    const username = await userDao.updateUsername(user_id, "bobby");
    expect(username[0].username).toBe("bobby");

    const email = await userDao.updateEmail(user_id, "bobby@example.com");
    expect(email[0].email).toBe("bobby@example.com");

    const password = await userDao.updatePassword(user_id, "newpass");
    expect(password[0].password).toBe("newpass");
});

test("Prevent duplicate users", async () => {
    await userDao.createUser("unique_user", "unique@example.com", "password");
    const duplicate = await userDao.createUser("unique_user", "unique@example.com", "password");
    expect(duplicate.length).toBe(1); // Should return the existing user
});
