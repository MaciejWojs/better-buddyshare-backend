import { afterEach, test, expect, beforeEach } from 'bun:test';
import { sql } from 'bun';
import { PermissionDAO } from '../../src/dao/Permissions';
import { Permission } from '@src/types/db/Permission';


let permissionDao: PermissionDAO;

beforeEach(() => {
    permissionDao = PermissionDAO.getInstance();

});

afterEach(async () => {
    await sql`TRUNCATE TABLE permissions CASCADE`;
});

// --- TESTY ---
test("powinien utworzyć nowe permission", async () => {
    const resultRaw = await permissionDao.createPermission("test_read");
    const result = resultRaw[0];
    expect(result).not.toBeNull();
    expect(result.name).toBe("TEST_READ");
});

test("powinien pobrać permission po nazwie", async () => {
    await permissionDao.createPermission("user_write");
    const permissionRaw = await permissionDao.getPermissionByName("user_write");
    const permission = permissionRaw[0];

    expect(permission).not.toBeNull();
    expect(permission!.name).toBe("USER_WRITE");
});

test("powinien zwrócić null gdy permission nie istnieje", async () => {
    const permission = await permissionDao.getPermissionByName("nie_istnieje");
    expect(permission).toBeNull();
});

test("powinien usunąć permission po ID", async () => {
    const createdRaw : Permission = await permissionDao.createPermission("delete_me");
    const created = createdRaw[0];
    const deleted = await permissionDao.deletePermissionById(created!.permission_id);
    expect(deleted).toBe(true);
});

test("powinien usunąć permission po nazwie", async () => {
    await permissionDao.createPermission("delete_by_name");
    const deleted = await permissionDao.deletePermissionByName("delete_by_name");
    expect(deleted).toBe(true);
});

test("powinien pobrać wszystkie permissions", async () => {
    await permissionDao.createPermission("read");
    await permissionDao.createPermission("write");
    const all = await permissionDao.getAllPermissions();
    expect(all).not.toBeNull();
    expect(all!.length).toBeGreaterThanOrEqual(2);
});
