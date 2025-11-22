# 🤖 Better BuddyShare – Copilot Instructions

## 🧩 Project context

Better BuddyShare is a backend media server written in TypeScript + Bun, using a layered architecture (DAO → Repository → Controller) and asynchronous services (RabbitMQ, Redis, S3/Minio, PostgreSQL).

The project emphasizes:

- clean, strongly-typed TypeScript code
- clear separation of responsibilities between layers
- controlled error handling
- integration with external services (S3, RabbitMQ, Redis)
- modularity and testability

---

## 🏗️ Project architecture

### 1️⃣ DAO (Data Access Object)

- DAO is the only layer that communicates with the database (PostgreSQL).
- It uses Bun SQL or Prisma ORM (depending on the module).
- Each DAO should:
  - extend `BaseDAO`
  - throw controlled errors (`DaoError`, `PostgresError`, etc.)
  - NOT implement business logic — only data access

Example:

```ts
export class UserDAO extends BaseDAO {
  async findById(id: number): Promise<User> {
    try {
      return await this.db.query(
        /* SQL */ `SELECT * FROM users WHERE id = $1`,
        [id],
      );
    } catch (err) {
      throw new DaoError('Failed to fetch user', err);
    }
  }
}
```

### 2️⃣ Repository

Combines DAO and cache to perform domain operations. Handles application logic and data consistency. Repository methods should mirror DAO methods unless additional logic is required.

Example:

```ts
export class UserRepository {
  constructor(
    private readonly dao: UserDAO,
    private readonly cache: UserCacheDao,
  ) {}

  async getUser(id: number): Promise<User> {
    const cached = await this.cache.get(id);
    if (cached) return cached;

    const user = await this.dao.findById(id);
    await this.cache.set(id, user);
    return user;
  }
}
```

### 3️⃣ Controller / Service Layer

The layer between external world (API, worker, events) and repository logic. Usually does not communicate directly with DAOs.

Example:

```ts
export class UserController {
  constructor(private readonly userRepo: UserRepository) {}

  async handleUserRequest(userId: number) {
    const user = await this.userRepo.getUser(userId);
    return { id: user.id, username: user.username };
  }
}
```

---

## ⚙️ Additional components

- RabbitMQ: services inherit from `BaseRabbitService`, sharing a connection.
- Redis / Cache: dedicated `BaseCacheDao` layer for short-term storage (TTL).
- S3 / Minio: media file storage, access via presigned URLs.

---

## ⚠️ Error handling

Example error hierarchy:

```text
AppError
 ├── DaoError
 │    └── PostgresError
 ├── RepositoryError
 ├── ServiceError
 └── ValidationError
```

Rules:

- DAO throws `DaoError`.
- Repository may wrap errors into `RepositoryError`.
- Controllers return known error types, not raw exceptions.
- Each error should include: `message`, optional `cause`, `code` (string/enum).

---

## 🧱 Coding conventions

- Language: TypeScript
- Style: clean, object-oriented
- Dependencies: injected via constructor
- Avoid "magic": explicit imports and typing
- Use async/await, minimize .then()
- Logging only in controllers/services
- DAO and Repository should not log to stdout

Recommended method names: `findById`, `findAll`, `create`, `update`, `delete`. All async methods should return `Promise<T>`.

---

## 🧰 Practical tips for Copilot

- Prefer patterns: Repository, Singleton, Base Class.
- Do not generate SQL queries in controllers.
- Do not mix business logic with data access.
- Avoid `static` in DAO/Repository (except for shared resources).
- Use types from `types/db` and `types/domain`.
- Document with TSDoc.
- Keep error types and method names consistent.

---

## 🧩 Example directory structure

```text
├── dao
│   ├── BaseCache.ts
│   ├── BaseDao.ts
│   ├── Permissions.ts
│   ├── Roles.ts
│   ├── Streamers.ts
│   ├── UserRoles.ts
│   ├── Users.ts
│   ├── UsersCache.ts
│   └── interfaces
│       ├── permissions.interface.ts
│       ├── roles.interface.ts
│       ├── streamers.interface.ts
│       ├── userRoles.interface.ts
│       └── users.interface.ts
├── errors
│   ├── BaseError.ts
│   ├── DaoError.ts
│   └── RepositoryError.ts
├── index.ts
├── repositories
│   ├── BaseRepository.ts
│   ├── user.interface.ts
│   └── user.ts
├── services
│   ├── BaseRabbit.service.ts
│   ├── cache.service.ts
│   ├── media-worker.service.ts
│   └── test.md
└── types
    └── db
        ├── Permission.ts
        ├── Role.ts
        └── User.ts
```

## ✅ Goals for Copilot

- Generate consistent classes following the above pattern.
- Respect separation of concerns.
- Add types and TSDoc.
- Suggest extensions to the error hierarchy instead of ad hoc types.
- Maintain the style and structure of the Better BuddyShare project.
