import { afterEach, test, expect, beforeEach } from 'bun:test';
import { sql } from 'bun';
import { Permission } from '@src/types';
import { PermissionDAO } from '../../test-setup';

// Using exported instance from test-setup

afterEach(async () => {
  await sql`TRUNCATE TABLE permissions CASCADE`;
});

// --- TESTY ---
test('should create a new permission', async () => {
  const resultRaw = await PermissionDAO.createPermission('test_read');
  const result = resultRaw;
  expect(result).not.toBeNull();
  expect(result.name).toBe('TEST_READ');
});

test('should fetch permission by name', async () => {
  await PermissionDAO.createPermission('user_write');
  const permissionRaw = await PermissionDAO.getPermissionByName('user_write');
  const permission = permissionRaw;

  expect(permission).not.toBeNull();
  expect(permission!.name).toBe('USER_WRITE');
});

test('should return null when permission does not exist', async () => {
  const permission = await PermissionDAO.getPermissionByName('nie_istnieje');
  expect(permission).toBeNull();
});

test('should delete permission by ID', async () => {
  const createdRaw: Permission =
    await PermissionDAO.createPermission('delete_me');
  const created = createdRaw;
  const deleted = await PermissionDAO.deletePermissionById(
    created!.permission_id,
  );
  expect(deleted).toBe(true);
});

test('should delete permission by name', async () => {
  await PermissionDAO.createPermission('delete_by_name');
  const deleted = await PermissionDAO.deletePermissionByName('delete_by_name');
  expect(deleted).toBe(true);
});

test('should fetch all permissions', async () => {
  await Promise.all([
    PermissionDAO.createPermission('read'),
    PermissionDAO.createPermission('write'),
  ]);
  const all = await PermissionDAO.getAllPermissions();
  expect(all).not.toBeNull();
  expect(all!.length).toBeGreaterThanOrEqual(2);
});
