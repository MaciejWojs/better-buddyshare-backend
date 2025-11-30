import { describe, expect, test, beforeAll } from 'bun:test';
import { RolesDAO, PermissionDAO } from '../../test-setup';

describe('RolesDAO', () => {
  let testRoleId: number;
  let testPermissionId: number;

  beforeAll(async () => {
    // Create example roles and permissions
    const rolePromise = RolesDAO.createRole('TEST_ROLE');
    const permissionPromise = PermissionDAO.createPermission('TEST_PERMISSION');

    const [role, perm] = await Promise.all([rolePromise, permissionPromise]);
    testRoleId = role!.role_id;
    testPermissionId = perm!.permission_id;
  });

  test('should create a new role', async () => {
    const role = await RolesDAO.createRole('ADMIN_TEMP');
    expect(role).not.toBeNull();
    expect(role!.name).toBe('ADMIN_TEMP');
  });

  test('should return role by name', async () => {
    const role = await RolesDAO.getRoleByName('TEST_ROLE');
    expect(role).not.toBeNull();
    expect(role!.name).toBe('TEST_ROLE');
  });

  test('should return role by ID', async () => {
    const role = await RolesDAO.getRoleById(testRoleId);
    expect(role).not.toBeNull();
    expect(role!.role_id).toBe(testRoleId);
  });

  test('should return all roles', async () => {
    const roles = await RolesDAO.getAllRoles();
    expect(Array.isArray(roles)).toBeTrue();
    expect(roles.length).toBeGreaterThan(0);
  });

  test('should assign a permission to a role', async () => {
    const result = await RolesDAO.assignPermissionToRole(
      testRoleId,
      testPermissionId,
    );
    expect(result).toBeTrue();

    const perms = await RolesDAO.getPermissionsByRoleId(testRoleId);
    expect(perms.some((p) => p.name === 'TEST_PERMISSION')).toBeTrue();
  });

  test('should revoke a permission from a role', async () => {
    const result = await RolesDAO.revokePermissionFromRole(
      testRoleId,
      testPermissionId,
    );
    expect(result).toBeTrue();

    const perms = await RolesDAO.getPermissionsByRoleId(testRoleId);
    expect(perms.some((p) => p.name === 'TEST_PERMISSION')).toBeFalse();
  });

  test('should return role permissions by ID', async () => {
    // re-assign so the test has data
    await RolesDAO.assignPermissionToRole(testRoleId, testPermissionId);
    const perms = await RolesDAO.getPermissionsByRoleId(testRoleId);
    expect(Array.isArray(perms)).toBeTrue();
    expect(perms.length).toBeGreaterThan(0);
  });

  test('should return role permissions by name', async () => {
    const perms = await RolesDAO.getPermissionsByRoleName('TEST_ROLE');
    expect(Array.isArray(perms)).toBeTrue();
    expect(perms.some((p) => p.name === 'TEST_PERMISSION')).toBeTrue();
  });

  test('should NOT delete role by ID if it has assigned permissions', async () => {
    // TEST_ROLE has TEST_PERMISSION assigned
    const result = await RolesDAO.deleteRoleById(testRoleId);
    expect(result).toBeFalse();

    const stillExists = await RolesDAO.getRoleById(testRoleId);
    expect(stillExists).not.toBeNull();
  });

  test('should NOT delete role by name if it has assigned permissions', async () => {
    const roleName = 'TEST_ROLE';
    const result = await RolesDAO.deleteRoleByName(roleName);
    expect(result).toBeFalse();

    const stillExists = await RolesDAO.getRoleByName(roleName);
    expect(stillExists).not.toBeNull();
  });

  test('should delete role by ID when it has no relations', async () => {
    // Create a new role with no assignments
    const tempRole = await RolesDAO.createRole('UNUSED_ROLE');
    const result = await RolesDAO.deleteRoleById(tempRole!.role_id);
    expect(result).toBeTrue();

    const deleted = await RolesDAO.getRoleById(tempRole!.role_id);
    expect(deleted).toBeNull();
  });

  test('should delete role by name when it has no relations', async () => {
    const roleName = 'UNUSED_ROLE_2';
    await RolesDAO.createRole(roleName);
    const result = await RolesDAO.deleteRoleByName(roleName);
    expect(result).toBeTrue();

    const deleted = await RolesDAO.getRoleByName(roleName);
    expect(deleted).toBeNull();
  });

  test('should delete TEST_ROLE after manually removing assignments', async () => {
    const roleName = 'TEST_ROLE';
    // First revoke the assigned permission
    await RolesDAO.revokePermissionFromRole(testRoleId, testPermissionId);
    const result = await RolesDAO.deleteRoleByName(roleName);
    expect(result).toBeTrue();

    const deleted = await RolesDAO.getRoleByName(roleName);
    expect(deleted).toBeNull();
  });
});
