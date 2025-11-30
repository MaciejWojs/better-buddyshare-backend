import { beforeAll, beforeEach, test, expect, describe } from 'bun:test';
import { sql } from 'bun';
import {
  UserRolesDAO,
  RolesDAO,
  PermissionDAO,
  UserDAO,
} from '../../test-setup';
import { DaoError } from '@src/errors';

describe('UserRolesDAO', () => {
  let userId: number;
  let streamerId: number;
  let viewerRoleId: number;
  let moderatorRoleId: number;
  let watchPermId: number;

  beforeAll(async () => {
    // Create base data
    const user = await UserDAO.createUser(
      'testuser',
      'test@test.com',
      'password',
    );
    const streamer = await UserDAO.createUser(
      'streamer1',
      'streamer@test.com',
      'password',
    );
    userId = user!.user_id;
    streamerId = streamer!.user_id;

    const [viewerRoleRes, moderatorRoleRes, watchPermRes] = await Promise.all([
      RolesDAO.createRole('VIEWER'),
      RolesDAO.createRole('MODERATOR'),
      PermissionDAO.createPermission('WATCH_STREAM'),
    ]);

    const viewerRole = viewerRoleRes;
    const moderatorRole = moderatorRoleRes;
    const watchPerm = watchPermRes;

    viewerRoleId = viewerRole!.role_id;
    moderatorRoleId = moderatorRole!.role_id;
    watchPermId = watchPerm!.permission_id;

    await RolesDAO.assignPermissionToRole(viewerRoleId, watchPermId);
  });

  beforeEach(async () => {
    await sql`TRUNCATE TABLE user_roles CASCADE`;
  });

  //
  // 🔹 assignRoleToUser
  //
  test('should assign role to user by name', async () => {
    const result = await UserRolesDAO.assignRoleToUser(userId, 'VIEWER');
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId);
    expect(roles!.some((r) => r.name === 'VIEWER')).toBeTrue();
  });

  test('should assign role to user by ID', async () => {
    const result = await UserRolesDAO.assignRoleToUser(userId, moderatorRoleId);
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId);
    expect(roles!.some((r) => r.role_id === moderatorRoleId)).toBeTrue();
  });

  test('should assign role in context (streamerId)', async () => {
    const result = await UserRolesDAO.assignRoleToUser(
      userId,
      'MODERATOR',
      streamerId,
    );
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeTrue();
  });

  test('should return TRUE even when reassigning the same role (idempotency)', async () => {
    await UserRolesDAO.assignRoleToUser(userId, 'VIEWER');
    const result = await UserRolesDAO.assignRoleToUser(userId, 'VIEWER');
    expect(result).toBeTrue();
  });

  test('should return FALSE when assigning non-existing role by name', async () => {
    const result = await UserRolesDAO.assignRoleToUser(userId, 'FAKE_ROLE');
    expect(result).toBeFalse();
  });

  //
  // 🔹 revokeRoleFromUser
  //
  test("should remove user's role by name", async () => {
    await UserRolesDAO.assignRoleToUser(userId, 'VIEWER');
    const result = await UserRolesDAO.revokeRoleFromUser(userId, 'VIEWER');
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId);
    expect(roles!.some((r) => r.name === 'VIEWER')).toBeFalse();
  });

  test("should remove user's role by ID", async () => {
    await UserRolesDAO.assignRoleToUser(userId, moderatorRoleId);
    const result = await UserRolesDAO.revokeRoleFromUser(
      userId,
      moderatorRoleId,
    );
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId);
    expect(roles!.some((r) => r.role_id === moderatorRoleId)).toBeFalse();
  });

  test('should remove role in context (streamerId)', async () => {
    await UserRolesDAO.assignRoleToUser(userId, 'MODERATOR', streamerId);
    const result = await UserRolesDAO.revokeRoleFromUser(
      userId,
      'MODERATOR',
      streamerId,
    );
    expect(result).toBeTrue();

    const roles = await UserRolesDAO.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeFalse();
  });

  //
  // 🔹 getUserRoles & getUserPermissions
  //
  test('should return user roles', async () => {
    await Promise.all([
      UserRolesDAO.assignRoleToUser(userId, 'VIEWER'),
      UserRolesDAO.assignRoleToUser(userId, 'MODERATOR'),
    ]);
    const roles = await UserRolesDAO.getUserRoles(userId);
    expect(roles!.length).toBeGreaterThanOrEqual(2);
  });

  test('should return user roles in context', async () => {
    await Promise.all([
      UserRolesDAO.assignRoleToUser(userId, 'MODERATOR', streamerId),
      UserRolesDAO.assignRoleToUser(userId, 'VIEWER', streamerId),
    ]);
    const roles = await UserRolesDAO.getUserRoles(userId, streamerId);
    expect(roles!.some((r) => r.name === 'MODERATOR')).toBeTrue();
    expect(roles!.some((r) => r.name === 'VIEWER')).toBeTrue();
  });

  test('should return user permissions (indirectly via roles)', async () => {
    await Promise.all([
      UserRolesDAO.assignRoleToUser(userId, 'VIEWER'),
      UserRolesDAO.assignRoleToUser(userId, 'MODERATOR'),
    ]);
    const permissions = await UserRolesDAO.getUserPermissions(userId);
    expect(permissions!.some((p) => p.name === 'WATCH_STREAM')).toBeTrue();
  });

  //
  // 🔹 checkIfUserHasPermission
  //
  test('should confirm user permission by name', async () => {
    await Promise.all([
      UserRolesDAO.assignRoleToUser(userId, 'VIEWER'),
      UserRolesDAO.assignRoleToUser(userId, 'MODERATOR'),
    ]);
    const hasPermission = await UserRolesDAO.checkIfUserHasPermission(
      userId,
      'WATCH_STREAM',
    );
    expect(hasPermission).toBeTrue();
  });

  test('should return FALSE if user does not have permission', async () => {
    const hasPermission = await UserRolesDAO.checkIfUserHasPermission(
      userId,
      'FAKE_PERMISSION',
    );
    expect(hasPermission).toBeFalse();
  });

  test('should check permission in context', async () => {
    // assign role and permission in context
    await Promise.all([
      UserRolesDAO.assignRoleToUser(userId, 'MODERATOR', streamerId),
      RolesDAO.assignPermissionToRole(moderatorRoleId, watchPermId),
    ]);
    const hasPermission = await UserRolesDAO.checkIfUserHasPermission(
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
    await expect(
      // @ts-expect-error
      UserRolesDAO.assignRoleToUser(userId, { invalid: 'role' }),
    ).rejects.toThrow(DaoError);
  });

  test('should throw DaoError on invalid permission type', async () => {
    await expect(
      // @ts-expect-error
      UserRolesDAO.checkIfUserHasPermission(userId, { invalid: 'perm' }),
    ).rejects.toThrow(DaoError);
  });
});
