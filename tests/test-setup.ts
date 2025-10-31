import { beforeAll, afterAll, afterEach, test, expect, beforeEach } from 'bun:test';
import { $, sleep } from 'bun';

const DB_NAME = "testdb";
const DB_USER = "testuser";
const DB_PASSWORD = "testpass";
const DB_PORT = 5431;

const POSTGRESS_SLEEP_TIME = 2000;

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


afterAll(async () => {
    if (process.env.CI) {
        return;
    }
    await $`docker stop test-db`;
    console.log("🛑 Zatrzymano bazę danych PostgreSQL w Dockerze.");
    await sleep(1000);
});