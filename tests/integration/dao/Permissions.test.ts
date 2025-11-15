import { afterEach, test, expect, beforeEach } from 'bun:test';
import { sql } from 'bun';
import { PermissionDAO } from '@src/dao/Permissions';
import { Permission } from '@src/types/db/Permission';

let permissionDao: PermissionDAO;

beforeEach(() => {
  permissionDao = PermissionDAO.getInstance();
});

afterEach(async () => {
  await sql`TRUNCATE TABLE permissions CASCADE`;
});

// --- TESTY ---
test('should create a new permission', async () => {
  const resultRaw = await permissionDao.createPermission('test_read');
  const result = resultRaw;
  expect(result).not.toBeNull();
  expect(result.name).toBe('TEST_READ');
});

test('should fetch permission by name', async () => {
  await permissionDao.createPermission('user_write');
  const permissionRaw = await permissionDao.getPermissionByName('user_write');
  const permission = permissionRaw;

  expect(permission).not.toBeNull();
  expect(permission!.name).toBe('USER_WRITE');
});

test('should return null when permission does not exist', async () => {
  const permission = await permissionDao.getPermissionByName('nie_istnieje');
  expect(permission).toBeNull();
});

test('should delete permission by ID', async () => {
  const createdRaw: Permission =
    await permissionDao.createPermission('delete_me');
  const created = createdRaw;
  const deleted = await permissionDao.deletePermissionById(
    created!.permission_id,
  );
  expect(deleted).toBe(true);
});

test('should delete permission by name', async () => {
  await permissionDao.createPermission('delete_by_name');
  const deleted = await permissionDao.deletePermissionByName('delete_by_name');
  expect(deleted).toBe(true);
});

test('should fetch all permissions', async () => {
  await permissionDao.createPermission('read');
  await permissionDao.createPermission('write');
  const all = await permissionDao.getAllPermissions();
  expect(all).not.toBeNull();
  expect(all!.length).toBeGreaterThanOrEqual(2);
});
