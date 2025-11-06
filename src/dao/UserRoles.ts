/**
 * UserRoles DAO.
 *
 * Provides helper methods to assign/revoke roles to users, fetch user roles
 * and permissions and check permission presence. Uses DB functions and
 * BaseDAO helpers for execution and error mapping.
 *
 * @module dao/UserRoles
 */
import { Permission } from '@src/types/db/Permission';
import { Role } from '@src/types/db/Role';
import { BaseDAO } from './BaseDao';
import { IUserRolesDAO } from './interfaces/userRoles.interface';
import { sql } from 'bun';
import { DaoError } from '@src/errors/DaoError';

/**
 * UserRoles DAO.
 *
 * Provides helper methods to assign/revoke roles to users, fetch user roles
 * and permissions and check permission presence. Uses DB functions and
 * BaseDAO helpers for execution and error mapping.
 *
 * @module dao/UserRoles
 */
export class UserRolesDAO extends BaseDAO implements IUserRolesDAO {
  /**
   * Singleton instance holder.
   */
  private static instance: UserRolesDAO;

  /**
   * Protected constructor to enforce singleton usage via getInstance.
   */
  private constructor() {
    super();
  }

  /**
   * Get singleton instance of UserRolesDAO.
   *
   * @returns UserRolesDAO singleton
   */
  public static getInstance(): UserRolesDAO {
    if (!this.instance) {
      this.instance = new UserRolesDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  /**
   * Assign a role to a user.
   *
   * Overloads:
   * @overload
   * assignRoleToUser(userId: number, roleId: number): Promise<boolean | null>
   * Assign by role id without context.
   *
   * @overload
   * assignRoleToUser(userId: number, roleName: string): Promise<boolean | null>
   * Assign by role name without context.
   *
   * @overload
   * assignRoleToUser(userId: number, roleId: number, streamerId: number): Promise<boolean | null>
   * Assign by role id within a specific streamer/context.
   *
   * @overload
   * assignRoleToUser(userId: number, roleName: string, streamerId: number): Promise<boolean | null>
   * Assign by role name within a specific streamer/context.
   *
   * Generic parameters:
   * @param userId - ID of the user receiving the role.
   * @param role - Role identifier (either numeric id or string name).
   * @param streamerId - Optional context id (e.g. streamer) to scope the assignment.
   * @returns true if the operation succeeded, false if it did not, or null in some DB-specific cases.
   * @throws DaoError when role identifier type is invalid.
   */
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

  /**
   * Revoke a role from a user.
   *
   * Overloads:
   * @overload
   * revokeRoleFromUser(userId: number, roleId: number): Promise<boolean | null>
   * Revoke by role id without context.
   *
   * @overload
   * revokeRoleFromUser(userId: number, roleName: string): Promise<boolean | null>
   * Revoke by role name without context.
   *
   * @overload
   * revokeRoleFromUser(userId: number, roleId: number, streamerId: number): Promise<boolean | null>
   * Revoke by role id within a specific streamer/context.
   *
   * @overload
   * revokeRoleFromUser(userId: number, roleName: string, streamerId: number): Promise<boolean | null>
   * Revoke by role name within a specific streamer/context.
   *
   * Generic parameters:
   * @param userId - ID of the user.
   * @param role - Role identifier (id or name).
   * @param streamerId - Optional context id to scope the revocation.
   * @returns true if revoked, false otherwise, or null if DB returns no definitive result.
   * @throws DaoError when role identifier type is invalid.
   */
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

  /**
   * Get roles assigned to a user.
   *
   * Overloads:
   * @overload
   * getUserRoles(userId: number): Promise<Role[]>
   * Get all roles assigned to the user globally.
   *
   * @overload
   * getUserRoles(userId: number, streamerId: number): Promise<Role[]>
   * Get roles assigned to the user within the given streamer/context.
   *
   * @param userId - ID of the user.
   * @param streamerId - Optional context id to limit the query.
   * @returns Array of Role objects, or empty array when no records found.
   */
  async getUserRoles(userId: number): Promise<Role[]>;
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

  /**
   * Get permissions granted to a user (via roles).
   *
   * Overloads:
   * @overload
   * getUserPermissions(userId: number): Promise<Permission[]>
   * Get all permissions for the user globally.
   *
   * @overload
   * getUserPermissions(userId: number, streamerId: number): Promise<Permission[]>
   * Get permissions for the user within the given streamer/context.
   *
   * @param userId - ID of the user.
   * @param streamerId - Optional context id to limit the query.
   * @returns Array of Permission objects, or empty array when no records found.
   */
  async getUserPermissions(userId: number): Promise<Permission[]>;
  async getUserPermissions(
    userId: number,
    streamerId: number,
  ): Promise<Permission[]>;
  async getUserPermissions(
    userId: number,
    streamerId?: number,
  ): Promise<Permission[]> {
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

  /**
   * Check whether a user has a given permission.
   *
   * Overloads:
   * @overload
   * checkIfUserHasPermission(userId: number, permissionName: string): Promise<boolean | null>
   * Check by permission name without context.
   *
   * @overload
   * checkIfUserHasPermission(userId: number, permissionId: number): Promise<boolean | null>
   * Check by permission id without context.
   *
   * @overload
   * checkIfUserHasPermission(userId: number, permissionName: string, streamerId: number): Promise<boolean | null>
   * Check by permission name within a specific streamer/context.
   *
   * @overload
   * checkIfUserHasPermission(userId: number, permissionId: number, streamerId: number): Promise<boolean | null>
   * Check by permission id within a specific streamer/context.
   *
   * Generic parameters:
   * @param userId - ID of the user.
   * @param permission - Permission identifier (name or id).
   * @param streamerId - Optional context id.
   * @returns true if the user has the permission, false otherwise, or null in DB-specific cases.
   * @throws DaoError when permission identifier type is invalid.
   */
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
