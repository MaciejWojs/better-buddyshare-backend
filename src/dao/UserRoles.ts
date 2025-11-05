import { Permission } from '@src/types/db/Permission';
import { Role } from '@src/types/db/Role';
import { BaseDAO } from './BaseDao';
import { IUserRolesDAO } from './interfaces/userRoles.interface';
import { sql } from 'bun';
import { DaoError } from '@src/errors/DaoError';

export class UserRolesDAO extends BaseDAO implements IUserRolesDAO {
  private static instance: UserRolesDAO;

  private constructor() {
    super();
  }

  public static getInstance(): UserRolesDAO {
    if (!this.instance) {
      this.instance = new UserRolesDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
  ): Promise<boolean | null>;
  async assignRoleToUser(
    userId: number,
    roleName: string,
  ): Promise<boolean | null>;
  async assignRoleToUser(
    userId: number,
    roleId: number,
    streamerId: number,
  ): Promise<boolean | null>;
  async assignRoleToUser(
    userId: number,
    roleName: string,
    streamerId: number,
  ): Promise<boolean | null>;
  async assignRoleToUser(
    userId: number,
    role: string | number,
    streamerId?: number,
  ): Promise<boolean | null> {
    if (typeof role === 'number') {
      if (streamerId) {
        return await this.getBooleanFromQuery(
          () =>
            sql`select * from Assign_role_to_user_in_context_by_role_id(${userId}, ${role}, ${streamerId})`,
        );
      }
      return await this.getBooleanFromQuery(
        () =>
          sql`select * from Assign_role_to_user_by_role_id(${userId}, ${role})`,
      );
    } else if (typeof role === 'string') {
      if (streamerId) {
        return await this.getBooleanFromQuery(
          () =>
            sql`select * from Assign_role_to_user_in_context_by_role_name(${userId}, ${role}, ${streamerId})`,
        );
      }
      return await this.getBooleanFromQuery(
        () =>
          sql`select * from Assign_role_to_user_by_role_name(${userId}, ${role})`,
      );
    }
    throw new DaoError('Invalid role identifier type');
  }

  async revokeRoleFromUser(
    userId: number,
    roleId: number,
  ): Promise<boolean | null>;
  async revokeRoleFromUser(
    userId: number,
    roleName: string,
  ): Promise<boolean | null>;
  async revokeRoleFromUser(
    userId: number,
    roleId: number,
    streamerId: number,
  ): Promise<boolean | null>;
  async revokeRoleFromUser(
    userId: number,
    roleName: string,
    streamerId: number,
  ): Promise<boolean | null>;
  async revokeRoleFromUser(
    userId: number,
    role: string | number,
    streamerId?: number,
  ): Promise<boolean | null> {
    if (typeof role === 'number') {
      if (streamerId) {
        return await this.getBooleanFromQuery(
          () =>
            sql`select * from Revoke_role_from_user_in_context_by_role_id(${userId}, ${role}, ${streamerId})`,
        );
      }
      return await this.getBooleanFromQuery(
        () =>
          sql`select * from Revoke_role_from_user_by_role_id(${userId}, ${role})`,
      );
    } else if (typeof role === 'string') {
      if (streamerId) {
        return await this.getBooleanFromQuery(
          () =>
            sql`select * from Revoke_role_from_user_in_context_by_role_name(${userId}, ${role}, ${streamerId})`,
        );
      }
      return await this.getBooleanFromQuery(
        () =>
          sql`select * from Revoke_role_from_user_by_role_name(${userId}, ${role})`,
      );
    }
    throw new DaoError('Invalid role identifier type');
  }

  async getUserRoles(userId: number): Promise<Role[] | null>;
  async getUserRoles(
    userId: number,
    streamerId: number,
  ): Promise<Role[] | null>;
  async getUserRoles(
    userId: number,
    streamerId?: number,
  ): Promise<Role[] | null> {
    if (streamerId) {
      return await this.executeQueryMultiple<Role>(
        () =>
          sql`select * from Get_roles_by_user_in_context(${userId}, ${streamerId})`,
      );
    }
    return await this.executeQueryMultiple<Role>(
      () => sql`select * from Get_roles_by_user(${userId})`,
    );
  }

  async getUserPermissions(userId: number): Promise<Permission[] | null>;
  async getUserPermissions(
    userId: number,
    streamerId: number,
  ): Promise<Permission[] | null>;
  async getUserPermissions(
    userId: number,
    streamerId?: number,
  ): Promise<Permission[] | null> {
    if (streamerId) {
      return await this.executeQueryMultiple<Permission>(
        () =>
          sql`select * from Get_permissions_by_user_in_context(${userId}, ${streamerId})`,
      );
    }
    return await this.executeQueryMultiple<Permission>(
      () => sql`select * from Get_permissions_by_user(${userId})`,
    );
  }
  async checkIfUserHasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean | null>;
  async checkIfUserHasPermission(
    userId: number,
    permissionId: number,
  ): Promise<boolean | null>;
  async checkIfUserHasPermission(
    userId: number,
    permissionName: string,
    streamerId: number,
  ): Promise<boolean | null>;
  async checkIfUserHasPermission(
    userId: number,
    permissionId: number,
    streamerId: number,
  ): Promise<boolean | null>;
  async checkIfUserHasPermission(
    userId: number,
    permission: number | string,
    streamerId?: number,
  ): Promise<boolean | null> {
    if (typeof permission === 'number') {
      if (streamerId) {
        const res = await this.getBooleanFromQuery(
          () =>
            sql`select * from User_has_permission_by_permission_id_in_context(${userId}, ${permission}, ${streamerId})`,
        );
        return res;
      }
      const res = await this.getBooleanFromQuery(
        () =>
          sql`select * from User_has_permission_by_permission_id(${userId}, ${permission})`,
      );
      return res;
    } else if (typeof permission === 'string') {
      if (streamerId) {
        const res = await this.getBooleanFromQuery(
          () =>
            sql`select * from User_has_permission_by_permission_name_in_context(${userId}, ${permission}, ${streamerId})`,
        );
        return res;
      }
      const res = await this.getBooleanFromQuery(
        () => sql`select * from User_has_permission(${userId}, ${permission})`,
      );
      return res;
    }
    throw new DaoError('Invalid permission identifier type');
  }
}
