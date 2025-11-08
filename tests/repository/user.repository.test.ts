import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { UserRepository } from '../../src/repositories/user';
import { User } from '../../src/types/db/User';

// 💡 Przykładowy użytkownik
const exampleUser: User = {
  user_id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  created_at: new Date(),
  is_banned: false,
  ban_reason: null,
  ban_expires_at: null,
  stream_token: '',
  description: 'Hello!',
  avatar: '',
  profile_banner: '',
  password: 'secret',
};

// 🧱 Mock DAO i Cache
let mockDao: any;
let mockCache: any;
let repo: UserRepository;

beforeEach(() => {
  mockDao = {
    findById: mock(() => Promise.resolve([exampleUser])),
    createUser: mock(() => Promise.resolve([exampleUser])),
    findByEmail: mock(() => Promise.resolve([exampleUser])),
    banUser: mock(() => Promise.resolve([exampleUser])),
    unbanUser: mock(() => Promise.resolve([exampleUser])),
    updateProfilePicture: mock(() => Promise.resolve([exampleUser])),
    updateProfileBanner: mock(() => Promise.resolve([exampleUser])),
    updateBio: mock(() => Promise.resolve([exampleUser])),
    updateUsername: mock(() => Promise.resolve([exampleUser])),
    updateEmail: mock(() => Promise.resolve([exampleUser])),
    updatePassword: mock(() => Promise.resolve([exampleUser])),
  };

  mockCache = {
    findById: mock(() => Promise.resolve(null)),
    findByEmail: mock(() => Promise.resolve(null)),
    upsertUser: mock(() => Promise.resolve(exampleUser)),
  };

  repo = new UserRepository(mockDao, mockCache);
});

describe('UserRepository', () => {
  // 🔹 getUserById()
  test('getUserById returns cached user if available', async () => {
    mockCache.findById.mockResolvedValueOnce(exampleUser);
    const result = await repo.getUserById(1);
    expect(result).toEqual(exampleUser);
    expect(mockDao.findById).not.toHaveBeenCalled();
  });

  test('getUserById fetches from DB and caches if not found in cache', async () => {
    mockCache.findById.mockResolvedValueOnce(null);
    const result = await repo.getUserById(1);
    expect(result).toEqual(exampleUser);
    expect(mockDao.findById).toHaveBeenCalledWith(1);
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 createUser()
  test('createUser calls DAO and caches the result', async () => {
    const result = await repo.createUser(
      'john_doe',
      'john@example.com',
      'secret',
    );
    expect(result).toEqual(exampleUser);
    expect(mockDao.createUser).toHaveBeenCalledWith(
      'john_doe',
      'john@example.com',
      'secret',
    );
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 getUserByEmail()
  test('getUserByEmail returns cached user if available', async () => {
    mockCache.findByEmail.mockResolvedValueOnce(exampleUser);
    const result = await repo.getUserByEmail('john@example.com');
    expect(result).toEqual(exampleUser);
    expect(mockDao.findByEmail).not.toHaveBeenCalled();
  });

  test('getUserByEmail fetches from DB if not in cache', async () => {
    mockCache.findByEmail.mockResolvedValueOnce(null);
    const result = await repo.getUserByEmail('john@example.com');
    expect(result).toEqual(exampleUser);
    expect(mockDao.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 banUser()
  test('banUser calls DAO and updates cache', async () => {
    const result = await repo.banUser(1, 'spam');
    expect(result).toEqual(exampleUser);
    expect(mockDao.banUser).toHaveBeenCalledWith(1, 'spam');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 unbanUser()
  test('unbanUser calls DAO and updates cache', async () => {
    const result = await repo.unbanUser(1);
    expect(result).toEqual(exampleUser);
    expect(mockDao.unbanUser).toHaveBeenCalledWith(1);
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updateProfilePicture()
  test('updateProfilePicture updates DAO and cache', async () => {
    const result = await repo.updateProfilePicture(1, 'new_pic.png');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updateProfilePicture).toHaveBeenCalledWith(1, 'new_pic.png');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updateProfileBanner()
  test('updateProfileBanner updates DAO and cache', async () => {
    const result = await repo.updateProfileBanner(1, 'banner.jpg');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updateProfileBanner).toHaveBeenCalledWith(1, 'banner.jpg');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updateBio()
  test('updateBio updates DAO and cache', async () => {
    const result = await repo.updateBio(1, 'new bio');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updateBio).toHaveBeenCalledWith(1, 'new bio');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updateUsername()
  test('updateUsername updates DAO and cache', async () => {
    const result = await repo.updateUsername(1, 'new_name');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updateUsername).toHaveBeenCalledWith(1, 'new_name');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updateEmail()
  test('updateEmail updates DAO and cache', async () => {
    const result = await repo.updateEmail(1, 'new@example.com');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updateEmail).toHaveBeenCalledWith(1, 'new@example.com');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });

  // 🔹 updatePassword()
  test('updatePassword updates DAO and cache', async () => {
    const result = await repo.updatePassword(1, 'hashedpass');
    expect(result).toEqual(exampleUser);
    expect(mockDao.updatePassword).toHaveBeenCalledWith(1, 'hashedpass');
    expect(mockCache.upsertUser).toHaveBeenCalledWith(exampleUser);
  });
});
