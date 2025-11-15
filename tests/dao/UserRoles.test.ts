import { beforeEach, afterEach, test, expect } from 'bun:test';
import { sql } from 'bun';
import { UserRolesDAO } from '../../src/dao/UserRoles';
import { PermissionDAO } from '../../src/dao/Permissions';
import { RolesDAO } from '../../src/dao/Roles';
import { UserDAO } from '../../src/dao/Users';
import { DaoError, DaoUniqueViolationError } from '../../src/errors/DaoError';

let dao: UserRolesDAO;
let permsDao: PermissionDAO;
let rolesDao: RolesDAO;
let userDao: UserDAO;

let testUserId: number;

beforeEach(async () => {
  dao = UserRolesDAO.getInstance();
  rolesDao = RolesDAO.getInstance();
  permsDao = PermissionDAO.getInstance();
  userDao = UserDAO.getInstance();

  // Wyczyść dane
  await sql`TRUNCATE TABLE user_roles CASCADE`;
  await sql`TRUNCATE TABLE role_permissions CASCADE`;
  await sql`TRUNCATE TABLE roles CASCADE`;
  await sql`TRUNCATE TABLE permissions CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;

  // Utwórz przykładowego użytkownika
  const user = await userDao.createUser(
    'testuser1',
    'test@test.com',
    'password123',
  );
  testUserId = user!.user_id;

  // Seed przykładowych ról i uprawnień
  await rolesDao.createRole('ADMIN');
  await rolesDao.createRole('MODERATOR');
  await rolesDao.createRole('VIEWER');

  await permsDao.createPermission('WATCH_STREAM');
  await permsDao.createPermission('ACCESS_CHAT');

  // Przypisz uprawnienia do ról
  const admin = await rolesDao.getRoleByName('ADMIN');
  const moderator = await rolesDao.getRoleByName('MODERATOR');
  const viewer = await rolesDao.getRoleByName('VIEWER');
  const pWatch = await permsDao.getPermissionByName('WATCH_STREAM');
  const pChat = await permsDao.getPermissionByName('ACCESS_CHAT');

  await rolesDao.assignPermissionToRole(admin!.role_id, pWatch!.permission_id);
  await rolesDao.assignPermissionToRole(admin!.role_id, pChat!.permission_id);
  await rolesDao.assignPermissionToRole(
    moderator!.role_id,
    pWatch!.permission_id,
  );
  await rolesDao.assignPermissionToRole(viewer!.role_id, pWatch!.permission_id);
});

afterEach(async () => {
  await sql`TRUNCATE TABLE user_roles CASCADE`;
  await sql`TRUNCATE TABLE role_permissions CASCADE`;
  await sql`TRUNCATE TABLE roles CASCADE`;
  await sql`TRUNCATE TABLE permissions CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;
});

//
// 🔸 TESTY INTEGRACYJNE
//

test('powinien przypisać rolę użytkownikowi po ID', async () => {
  const role = await rolesDao.getRoleByName('VIEWER');

  const result = await dao.assignRoleToUser(testUserId, role!.role_id);
  expect(result).toBeTrue();

  const roles = await dao.getUserRoles(testUserId);
  expect(Array.isArray(roles)).toBeTrue();
  expect(roles!.some((r) => r.name === 'VIEWER')).toBeTrue();
});

test('powinien przypisać rolę użytkownikowi po nazwie', async () => {
  const result = await dao.assignRoleToUser(testUserId, 'ADMIN');
  expect(result).toBeTrue();

  const roles = await dao.getUserRoles(testUserId);
  expect(roles!.some((r) => r.name === 'ADMIN')).toBeTrue();
});

test('powinien przypisać rolę użytkownikowi w kontekście (streamerId)', async () => {
  // Najpierw tworzymy streamera, żeby FK nie wywalił błędu
  const streamer = await userDao.createUser(
    'streamer1',
    'st@example.com',
    'password',
  );

  // Następnie przypisujemy rolę w kontekście istniejącego streamera
  const result = await dao.assignRoleToUser(
    testUserId,
    'MODERATOR',
    streamer!.user_id,
  );
  expect(result).toBeTrue();

  // Pobieramy role użytkownika w kontekście streamera
  const roles = await dao.getUserRoles(testUserId, streamer!.user_id);
  expect((roles ?? []).some((r) => r.name === 'MODERATOR')).toBeTrue();
});

test('powinien usunąć rolę użytkownika po ID', async () => {
  const role = await rolesDao.getRoleByName('VIEWER');
  await dao.assignRoleToUser(testUserId, role!.role_id);

  const revoked = await dao.revokeRoleFromUser(testUserId, role!.role_id);
  expect(revoked).toBeTrue();

  const roles = await dao.getUserRoles(testUserId);
  expect(roles).toBe(null); // zabezpieczenie przed null
});

test('powinien zwrócić listę ról użytkownika', async () => {
  await dao.assignRoleToUser(testUserId, 'ADMIN');
  await dao.assignRoleToUser(testUserId, 'MODERATOR');

  const roles = await dao.getUserRoles(testUserId);
  expect(roles!.length).toBe(2);
});

test('powinien zwrócić uprawnienia użytkownika (pośrednio przez role)', async () => {
  await dao.assignRoleToUser(testUserId, 'ADMIN');

  const permissions = await dao.getUserPermissions(testUserId);
  const names = permissions!.map((p) => p.name);

  expect(names).toContain('WATCH_STREAM');
  expect(names).toContain('ACCESS_CHAT');
});

test('powinien sprawdzić czy użytkownik ma dane uprawnienie po nazwie', async () => {
  await dao.assignRoleToUser(testUserId, 'ADMIN');

  const hasPermission = await dao.checkIfUserHasPermission(
    testUserId,
    'ACCESS_CHAT',
  );
  expect(hasPermission).toBeTrue();
});

test('powinien rzucić DaoError przy niepoprawnym typie roli', async () => {
  // @ts-expect-error
  await expect(
    dao.assignRoleToUser(testUserId, { bad: 'object' }),
  ).rejects.toThrow(DaoError);
});

test('powinien zwrócić false, jeśli użytkownik nie ma uprawnienia', async () => {
  const hasPermission = await dao.checkIfUserHasPermission(
    testUserId,
    'FAKE_PERMISSION',
  );
  expect(hasPermission).toBeFalse();
});
