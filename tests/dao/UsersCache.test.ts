import { describe, test, expect, beforeEach, mock } from "bun:test";

// 🧩 Mock CacheService ZANIM zaimportujemy DAO
const mockGet = mock<(key: string) => Promise<any>>(() => Promise.resolve(null));
const mockSet = mock(() => Promise.resolve(true));
const mockDel = mock(() => Promise.resolve(true));

mock.module("../../src/services/cache.service", () => ({
  CacheService: {
    getInstance: () => ({
      get: mockGet,
      set: mockSet,
      del: mockDel,
    }),
  },
}));

// 🔹 Dopiero teraz importujemy zależne moduły
import { UserCacheDao } from "../../src/dao/UsersCache";
import { User } from "../../src/types/db/User";

// 💡 Przykładowy użytkownik
const exampleUser: User = {
  user_id: 1,
  username: "john_doe",
  email: "john@example.com",
  created_at: new Date(),
  is_banned: false,
  ban_reason: null,
  ban_expires_at: null,
  stream_token: "",
  description: "Hello!",
  avatar: "",
  profile_banner: "",
  password: "secret",
};

describe("UserCacheDao", () => {
  let userCache: UserCacheDao;

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockDel.mockReset();
    userCache = UserCacheDao.getInstance();
  });

  // 🔹 findById()
  test("findById() returns null when user not in cache", async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await userCache.findById(1);
    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith("user:1");
  });

  test("findById() returns user when found in cache", async () => {
    mockGet.mockResolvedValueOnce(exampleUser);
    const result = await userCache.findById(1);
    expect(result?.username).toBe("john_doe");
  });

  // 🔹 findByEmail()
  test("findByEmail() returns null when no mapping exists", async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await userCache.findByEmail("john@example.com");
    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith("user:email:john@example.com");
  });

  test("findByEmail() returns user when mapping exists", async () => {
    mockGet
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce(exampleUser);
    const result = await userCache.findByEmail("john@example.com");
    expect(result?.user_id).toBe(1);
  });

  // 🔹 upsertUser()
  test("upsertUser() creates a new user in cache when not found", async () => {
    mockGet.mockResolvedValueOnce(null);
    await userCache.upsertUser(exampleUser);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith("user:1", exampleUser, 3600);
    expect(mockSet).toHaveBeenCalledWith("user:email:john@example.com", "1", 3600);
  });

  test("upsertUser() skips update if data is identical", async () => {
    mockGet.mockResolvedValueOnce(exampleUser);
    await userCache.upsertUser(exampleUser);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockDel).not.toHaveBeenCalled();
  });

  test("upsertUser() updates cache when user data changed", async () => {
    const modifiedUser = { ...exampleUser, username: "johnny" };
    mockGet.mockResolvedValueOnce(exampleUser);
    await userCache.upsertUser(modifiedUser);
    expect(mockDel).toHaveBeenCalledWith("user:1");
    expect(mockSet).toHaveBeenCalledTimes(2);
  });

  // 🔹 deleteUser()
  test("deleteUser() removes both user and email mapping", async () => {
    mockGet.mockResolvedValueOnce(exampleUser);
    await userCache.deleteUser(1);
    expect(mockDel).toHaveBeenCalledWith("user:1");
    expect(mockDel).toHaveBeenCalledWith("user:email:john@example.com");
  });

  test("deleteUser() only deletes user key when not found", async () => {
    mockGet.mockResolvedValueOnce(null);
    await userCache.deleteUser(2);
    expect(mockDel).toHaveBeenCalledWith("user:2");
  });
});
