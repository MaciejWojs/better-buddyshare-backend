import { beforeAll, beforeEach, test, expect, describe } from 'bun:test';
import { sql } from 'bun';
import { UserRolesDAO } from '../../src/dao/UserRoles';
import { PermissionDAO } from '../../src/dao/Permissions';
import { RolesDAO } from '../../src/dao/Roles';
import { UserDAO } from '../../src/dao/Users';
import { DaoError } from '../../src/errors/DaoError';

describe('UserRolesDAO', () => {
  let userRolesDao: UserRolesDAO;
  let rolesDao: RolesDAO;
  let permsDao: PermissionDAO;
  let userDao: UserDAO;

  let userId: number;
  let streamerId: number;
  let viewerRoleId: number;
  let moderatorRoleId: number;
  let watchPermId: number;

  beforeAll(async () => {
    userRolesDao = UserRolesDAO.getInstance();
    rolesDao = RolesDAO.getInstance();
    permsDao = PermissionDAO.getInstance();
    userDao = UserDAO.getInstance();

    // Create base data
    const user = await userDao.createUser(
      'testuser',
      'test@test.com',
      'password',
    );
    const streamer = await userDao.createUser(
      'streamer1',
      'streamer@test.com',
      'password',
    );
    userId = user!.user_id;
    streamerId = streamer!.user_id;

    const viewerRole = await rolesDao.createRole('VIEWER');
    const moderatorRole = await rolesDao.createRole('MODERATOR');
    const watchPerm = await permsDao.createPermission('WATCH_STREAM');

    viewerRoleId = viewerRole!.role_id;
    moderatorRoleId = moderatorRole!.role_id;
    watchPermId = watchPerm!.permission_id;

    await rolesDao.assignPermissionToRole(viewerRoleId, watchPermId);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE user_roles CASCADE`;
  });

  //
  // 🔹 assignRoleToUser
  //
  test('should assign role to user by name', async () => {
    const result = await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId);
    expect(roles!.some((r) => r.name === 'VIEWER')).toBeTrue();
  });

  test('should assign role to user by ID', async () => {
    const result = await userRolesDao.assignRoleToUser(userId, moderatorRoleId);
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId);
    expect(roles!.some((r) => r.role_id === moderatorRoleId)).toBeTrue();
  });

  test('should assign role in context (streamerId)', async () => {
    const result = await userRolesDao.assignRoleToUser(
      userId,
      'MODERATOR',
      streamerId,
    );
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeTrue();
  });

  test('should return TRUE even when reassigning the same role (idempotency)', async () => {
    await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    const result = await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    expect(result).toBeTrue();
  });

  test('should return FALSE when assigning non-existing role by name', async () => {
    const result = await userRolesDao.assignRoleToUser(userId, 'FAKE_ROLE');
    expect(result).toBeFalse();
  });

  //
  // 🔹 revokeRoleFromUser
  //
  test("should remove user's role by name", async () => {
    await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    const result = await userRolesDao.revokeRoleFromUser(userId, 'VIEWER');
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId);
    expect(roles!.some((r) => r.name === 'VIEWER')).toBeFalse();
  });

  test("should remove user's role by ID", async () => {
    await userRolesDao.assignRoleToUser(userId, moderatorRoleId);
    const result = await userRolesDao.revokeRoleFromUser(
      userId,
      moderatorRoleId,
    );
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId);
    expect(roles!.some((r) => r.role_id === moderatorRoleId)).toBeFalse();
  });

  test('should remove role in context (streamerId)', async () => {
    await userRolesDao.assignRoleToUser(userId, 'MODERATOR', streamerId);
    const result = await userRolesDao.revokeRoleFromUser(
      userId,
      'MODERATOR',
      streamerId,
    );
    expect(result).toBeTrue();

    const roles = await userRolesDao.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeFalse();
  });

  //
  // 🔹 getUserRoles & getUserPermissions
  //
  test('should return user roles', async () => {
    await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    const roles = await userRolesDao.getUserRoles(userId);
    expect(roles!.length).toBeGreaterThanOrEqual(1);
  });

  test('should return user roles in context', async () => {
    await userRolesDao.assignRoleToUser(userId, 'MODERATOR', streamerId);
    const roles = await userRolesDao.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeTrue();
  });

  test('should return user permissions (indirectly via roles)', async () => {
    await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    const permissions = await userRolesDao.getUserPermissions(userId);
    expect(permissions!.some((p) => p.name === 'WATCH_STREAM')).toBeTrue();
  });

  //
  // 🔹 checkIfUserHasPermission
  //
  test('should confirm user permission by name', async () => {
    await userRolesDao.assignRoleToUser(userId, 'VIEWER');
    const hasPermission = await userRolesDao.checkIfUserHasPermission(
      userId,
      'WATCH_STREAM',
    );
    expect(hasPermission).toBeTrue();
  });

  test('should return FALSE if user does not have permission', async () => {
    const hasPermission = await userRolesDao.checkIfUserHasPermission(
      userId,
      'FAKE_PERMISSION',
    );
    expect(hasPermission).toBeFalse();
  });

  test('should check permission in context', async () => {
    // assign role and permission in context
    await userRolesDao.assignRoleToUser(userId, 'MODERATOR', streamerId);
    await rolesDao.assignPermissionToRole(moderatorRoleId, watchPermId);

    const hasPermission = await userRolesDao.checkIfUserHasPermission(
      userId,
      'WATCH_STREAM',
      streamerId,
    );
    expect(hasPermission).toBeTrue();
  });

  //
  // 🔹 DaoError cases
  //
  test('should throw DaoError on invalid role type', async () => {
    // @ts-expect-error
    await expect(
      userRolesDao.assignRoleToUser(userId, { invalid: 'role' }),
    ).rejects.toThrow(DaoError);
  });

  test('should throw DaoError on invalid permission type', async () => {
    // @ts-expect-error
    await expect(
      userRolesDao.checkIfUserHasPermission(userId, { invalid: 'perm' }),
    ).rejects.toThrow(DaoError);
  });
});
