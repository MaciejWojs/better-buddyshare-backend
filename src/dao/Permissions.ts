import { sql } from 'bun';
import { IPermissionsDAO } from './interfaces/permissions.interface';
import { Permission } from '@src/types/db/Permission';
import { BaseDAO } from './BaseDao';

export class PermissionDAO extends BaseDAO implements IPermissionsDAO {
  private static instance: PermissionDAO;

  private constructor() {
    super();
  }

  public static getInstance(): PermissionDAO {
    if (!this.instance) {
      this.instance = new PermissionDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  async createPermission(permissionName: string): Promise<Permission | null> {
    return await this.executeQuery<Permission>(
      () =>
        sql`select * from Create_permission(${permissionName.toUpperCase()})`,
    );
  }

  async deletePermissionById(permissionId: number): Promise<boolean> {
    const res = await this.executeQuery<{ delete_permission_by_id: boolean }>(
      () => sql`select * from Delete_permission_by_id(${permissionId})`,
    );
    const isDeleted = res?.delete_permission_by_id ?? false;
    console.log('[ID] Delete permission result:', isDeleted);
    return isDeleted;
  }

  async deletePermissionByName(permissionName: string): Promise<boolean> {
    const res = await this.executeQuery<{ delete_permission_by_name: boolean }>(
      () =>
        sql`select * from Delete_permission_by_name(${permissionName.toUpperCase()})`,
    );
    const isDeleted = res?.delete_permission_by_name ?? false;
    console.log('[NAME] Delete permission result:', isDeleted);
    return isDeleted;
  }

  async getAllPermissions(): Promise<Permission[] | null> {
    return await this.executeQueryMultiple<Permission>(
      () => sql`select * from Get_all_permissions()`,
    );
  }

  async getPermissionByName(
    permissionName: string,
  ): Promise<Permission | null> {
    return await this.executeQuery<Permission>(
      () =>
        sql`select * from Get_permission_by_name(${permissionName.toUpperCase()})`,
    );
  }

  async getPermissionById(permissionId: number): Promise<Permission | null> {
    return await this.executeQuery<Permission>(
      () => sql`select * from Get_permission_by_id(${permissionId})`,
    );
  }
}
