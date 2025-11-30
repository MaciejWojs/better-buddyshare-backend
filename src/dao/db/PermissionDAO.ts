/**
 * Permissions DAO.
 *
 * Provides methods to create, delete and fetch permission records via
 * database functions. Uses BaseDAO helpers to execute queries and map errors.
 *
 * @module dao/Permissions
 */
import { IDbClient } from '@src/db/interfaces';
import { IPermissionsDAO } from './interfaces';
import { Permission } from '@src/types';
import { BaseDAO } from './BaseDao';

export class PermissionDAO extends BaseDAO implements IPermissionsDAO {
  /**
   * Protected constructor to enforce singleton usage via getInstance.
   */
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }
  /**
   * Create a new permission by name.
   *
   * Calls the DB function Create_permission and returns the created Permission
   * or null if not created.
   *
   * @param permissionName - Permission name (will be uppercased before call)
   * @returns The created Permission or null
   */
  async createPermission(permissionName: string): Promise<Permission | null> {
    return this.executeQuery<Permission>(
      'SELECT * FROM Create_permission($1)',
      [permissionName.toUpperCase()],
    );
  }

  /**
   * Delete a permission by its numeric ID.
   *
   * Calls the DB function Delete_permission_by_id and returns boolean result.
   *
   * @param permissionId - Numeric ID of the permission to delete
   * @returns true when deleted, false otherwise
   */
  async deletePermissionById(permissionId: number): Promise<boolean> {
    const res = await this.executeQuery<{ delete_permission_by_id: boolean }>(
      'SELECT * FROM Delete_permission_by_id($1)',
      [permissionId],
    );
    const isDeleted = res?.delete_permission_by_id ?? false;
    console.log('[ID] Delete permission result:', isDeleted);
    return isDeleted;
  }

  /**f
   * Delete a permission by its name.
   *
   * The name will be uppercased before invoking the DB function.
   *
   * @param permissionName - Name of the permission to delete
   * @returns true when deleted, false otherwise
   */
  async deletePermissionByName(permissionName: string): Promise<boolean> {
    const res = await this.executeQuery<{ delete_permission_by_name: boolean }>(
      'SELECT * FROM Delete_permission_by_name($1)',
      [permissionName.toUpperCase()],
    );
    const isDeleted = res?.delete_permission_by_name ?? false;
    console.log('[NAME] Delete permission result:', isDeleted);
    return isDeleted;
  }

  /**
   * Retrieve all permissions.
   *
   * @returns Array of Permission or null if none
   */
  async getAllPermissions(): Promise<Permission[] | null> {
    return this.executeQueryMultiple<Permission>(
      'SELECT * FROM Get_all_permissions()',
      [],
    );
  }

  /**
   * Get permission by its name.
   *
   * @param permissionName - Name of the permission to look up
   * @returns Permission or null if not found
   */
  async getPermissionByName(
    permissionName: string,
  ): Promise<Permission | null> {
    return this.executeQuery<Permission>(
      'SELECT * FROM Get_permission_by_name($1)',
      [permissionName.toUpperCase()],
    );
  }

  /**
   * Get permission by its ID.
   *
   * @param permissionId - Numeric ID of the permission
   * @returns Permission or null if not found
   */
  async getPermissionById(permissionId: number): Promise<Permission | null> {
    return this.executeQuery<Permission>(
      'SELECT * FROM Get_permission_by_id($1)',
      [permissionId],
    );
  }
}
