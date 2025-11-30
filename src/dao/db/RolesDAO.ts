/**
 * Roles DAO.
 *
 * Provides methods to create, delete, assign permissions and fetch role records
 * via database functions. Uses BaseDAO helpers to execute queries and map errors.
 *
 * @module dao/Roles
 */
import { IRolesDAO } from './interfaces';
import { BaseDAO } from './BaseDao';
import { Permission, Role } from '@src/types';
import { IDbClient } from '@src/db/interfaces';

export class RolesDAO extends BaseDAO implements IRolesDAO {
  /**
   * Protected constructor to enforce singleton usage via getInstance.
   */
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  /**
   * Create a new role by name.
   *
   * Calls the DB function Create_role and returns the created Role or null.
   *
   * @param roleName - Role name (uppercasing may be applied in DB call)
   * @returns The created Role or null
   */
  async createRole(roleName: string): Promise<Role | null> {
    return this.executeQuery<Role>('SELECT * FROM Create_role($1)', [
      roleName.toUpperCase(),
    ]);
  }

  /**
   * Delete a role by its numeric ID.
   *
   * Calls Delete_role_by_id DB function and returns boolean result.
   *
   * @param roleId - Numeric ID of the role to delete
   * @returns true when deleted, false otherwise
   */
  async deleteRoleById(roleId: number): Promise<boolean> {
    const res = await this.executeQuery<{ delete_role_by_id: boolean }>(
      'SELECT * FROM Delete_role_by_id($1)',
      [roleId],
    );
    const isDeleted = res?.delete_role_by_id ?? false;
    console.log('[ID] Delete role result:', isDeleted);
    return isDeleted;
  }

  /**
   * Delete a role by its name.
   *
   * Calls Delete_role_by_name DB function and returns boolean result.
   *
   * @param roleName - Name of the role to delete
   * @returns true when deleted, false otherwise
   */
  async deleteRoleByName(roleName: string): Promise<boolean> {
    const res = await this.executeQuery<{ delete_role_by_name: boolean }>(
      'SELECT * FROM Delete_role_by_name($1)',
      [roleName],
    );
    const isDeleted = res?.delete_role_by_name ?? false;
    console.log('[Name] Delete role result:', isDeleted);
    return isDeleted;
  }

  /**
   * Retrieve all roles.
   *
   * @returns Array of Role or null if none
   */
  async getAllRoles(): Promise<Role[] | null> {
    return this.executeQueryMultiple<Role>('SELECT * FROM Get_all_roles()', []);
  }

  /**
   * Get role by its name.
   *
   * @param roleName - Name of the role to look up
   * @returns Role or null if not found
   */
  async getRoleByName(roleName: string): Promise<Role | null> {
    return this.executeQuery<Role>('SELECT * FROM Get_role_by_name($1)', [
      roleName,
    ]);
  }

  /**
   * Get role by its ID.
   *
   * @param roleId - Numeric ID of the role
   * @returns Role or null if not found
   */
  async getRoleById(roleId: number): Promise<Role | null> {
    return this.executeQuery<Role>('SELECT * FROM Get_role_by_id($1)', [
      roleId,
    ]);
  }

  /**
   * Assign a permission to a role.
   *
   * Calls Assign_permission_to_role DB function and returns boolean result.
   *
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns true when assigned, false otherwise
   */
  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean> {
    const res = await this.executeQuery<{ assign_permission_to_role: boolean }>(
      'SELECT * FROM Assign_permission_to_role($1, $2)',
      [roleId, permissionId],
    );
    const isAssigned = res?.assign_permission_to_role ?? false;
    console.log('Assign permission to role result:', isAssigned);
    return isAssigned;
  }

  /**
   * Revoke a permission from a role.
   *
   * Calls Revoke_permission_from_role DB function and returns boolean result.
   *
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns true when revoked, false otherwise
   */
  async revokePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean> {
    const res = await this.executeQuery<{
      revoke_permission_from_role: boolean;
    }>('SELECT * FROM Revoke_permission_from_role($1, $2)', [
      roleId,
      permissionId,
    ]);
    const isRevoked = res?.revoke_permission_from_role ?? false;
    console.log('Revoke permission from role result:', isRevoked);
    return isRevoked;
  }

  /**
   * Get permissions assigned to a role by role ID.
   *
   * @param roleId - Role ID
   * @returns Array of Permission, or empty array if none
   */
  async getPermissionsByRoleId(roleId: number): Promise<Permission[] | null> {
    return this.executeQueryMultiple<Permission>(
      'SELECT * FROM Get_permissions_by_role_id($1)',
      [roleId],
    );
  }

  /**
   * Get permissions assigned to a role by role name.
   *
   * @param roleName - Role name
   * @returns Array of Permission, or empty array if none
   */
  async getPermissionsByRoleName(
    roleName: string,
  ): Promise<Permission[] | null> {
    return this.executeQueryMultiple<Permission>(
      'SELECT * FROM Get_permissions_by_role_name($1)',
      [roleName],
    );
  }
}
