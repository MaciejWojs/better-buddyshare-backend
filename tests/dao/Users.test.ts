import { beforeAll, afterAll, afterEach, test, expect, beforeEach } from 'bun:test';
import { $, sleep, sql } from 'bun';
import { UserDAO } from '../../src/dao/Users';



const DB_NAME = "testdb";
const DB_USER = "testuser";
const DB_PASSWORD = "testpass";
const DB_PORT = 5431;

const POSTGRESS_SLEEP_TIME = 2000;

let userDao: UserDAO;

beforeAll(async () => {
    if (process.env.CI) {
        return;
    }

    await $`docker run -d --rm --name test-db -e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} -e POSTGRES_DB=${DB_NAME} -p ${DB_PORT}:5432 postgres:18.0-alpine3.22`;
    console.log("🚀 Uruchamiam bazę danych PostgreSQL w Dockerze...");
    await sleep(POSTGRESS_SLEEP_TIME);
    // ustaw zmienną środowiskową
    // process.env.DATABASE_URL = "postgresql://testuser:testpass@localhost:5431/testdb";
    process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}`

    // uruchom migracje
    // console.log("🚀 Uruchamiam migracje Prisma...");
    await $`bunx prisma migrate deploy`;

    // (opcjonalnie) – jeśli chcesz tylko stworzyć schemat bez wersjonowania:
    // await $`bunx prisma db push`;

    console.log("✅ Migracje zakończone!");
});

beforeEach(() => {
    userDao = UserDAO.getInstance();
});


afterAll(async () => {
    if (process.env.CI) {
        return;
    }
    await $`docker stop test-db`;
    console.log("🛑 Zatrzymano bazę danych PostgreSQL w Dockerze.");
    await sleep(1000);
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
