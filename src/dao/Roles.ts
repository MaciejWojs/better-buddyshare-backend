import { Permission } from '@src/types/db/Permission';
import { Role } from '@src/types/db/Role';
import { IRolesDAO } from './interfaces/roles.interface';
import { sql } from 'bun';
import { BaseDAO } from './BaseDao';

export class RolesDAO extends BaseDAO implements IRolesDAO {
  private static instance: RolesDAO;

  private constructor() {
    super();
  }

  public static getInstance(): RolesDAO {
    if (!this.instance) {
      this.instance = new RolesDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  async createRole(roleName: string): Promise<Role | null> {
    return await this.executeQuery<Role>(
      () => sql`select * from Create_role(${roleName.toUpperCase()})`,
    );
  }

  async deleteRoleById(roleId: number): Promise<boolean> {
    const res = await this.executeQuery<{ delete_role_by_id: boolean }>(
      () => sql`select * from Delete_role_by_id(${roleId})`,
    );
    const isDeleted = res?.delete_role_by_id ?? false;
    console.log('[ID] Delete role result:', isDeleted);
    return isDeleted;
  }

  async deleteRoleByName(roleName: string): Promise<boolean> {
    const res = await this.executeQuery<{ delete_role_by_name: boolean }>(
      () => sql`select * from Delete_role_by_name(${roleName})`,
    );
    const isDeleted = res?.delete_role_by_name ?? false;
    console.log('[Name] Delete role result:', isDeleted);
    return isDeleted;
  }

  async getAllRoles(): Promise<Role[] | null> {
    return await this.executeQueryMultiple<Role>(
      () => sql`select * from Get_all_roles()`,
    );
  }

  async getRoleByName(roleName: string): Promise<Role | null> {
    return await this.executeQuery<Role>(
      () => sql`select * from Get_role_by_name(${roleName})`,
    );
  }

  async getRoleById(roleId: number): Promise<Role | null> {
    return await this.executeQuery<Role>(
      () => sql`select * from Get_role_by_id(${roleId})`,
    );
  }

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean> {
    const res = await this.executeQuery<{ assign_permission_to_role: boolean }>(
      () =>
        sql`select * from Assign_permission_to_role(${roleId}, ${permissionId})`,
    );
    const isAssigned = res?.assign_permission_to_role ?? false;
    console.log('Assign permission to role result:', isAssigned);
    return isAssigned;
  }

  async revokePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean> {
    const res = await this.executeQuery<{
      revoke_permission_from_role: boolean;
    }>(
      () =>
        sql`select * from Revoke_permission_from_role(${roleId}, ${permissionId})`,
    );
    const isRevoked = res?.revoke_permission_from_role ?? false;
    console.log('Revoke permission from role result:', isRevoked);
    return isRevoked;
  }

  async getPermissionsByRoleId(roleId: number): Promise<Permission[] | null> {
    return await this.executeQueryMultiple<Permission>(
      () => sql`select * from Get_permissions_by_role_id(${roleId})`,
    );
  }

  async getPermissionsByRoleName(
    roleName: string,
  ): Promise<Permission[] | null> {
    return await this.executeQueryMultiple<Permission>(
      () => sql`select * from Get_permissions_by_role_name(${roleName})`,
    );
  }
}
