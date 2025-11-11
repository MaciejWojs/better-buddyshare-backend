/**
 * Permissions DAO.
 *
 * Provides methods to create, delete and fetch permission records via
 * database functions. Uses BaseDAO helpers to execute queries and map errors.
 *
 * @module dao/Permissions
 */
import { sql } from 'bun';
import { IPermissionsDAO } from './interfaces/permissions.interface';
import { Permission } from '@src/types/db/Permission';
import { BaseDAO } from './BaseDao';

export class PermissionDAO extends BaseDAO implements IPermissionsDAO {
  /**
   * Singleton instance holder.
   */
  private static instance: PermissionDAO;

  /**
   * Protected constructor to enforce singleton usage via getInstance.
   */
  private constructor() {
    super();
  }

  /**
   * Get singleton instance of PermissionDAO.
   *
   * @returns PermissionDAO singleton
   */
  public static getInstance(): PermissionDAO {
    if (!this.instance) {
      this.instance = new PermissionDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
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
    return await this.executeQuery<Permission>(
      () => sql`
        SELECT
          *
        FROM
          Create_permission (${permissionName.toUpperCase()})
      `,
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
      () => sql`
        SELECT
          *
        FROM
          Delete_permission_by_id (${permissionId})
      `,
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
      () => sql`
        SELECT
          *
        FROM
          Delete_permission_by_name (${permissionName.toUpperCase()})
      `,
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
    return await this.executeQueryMultiple<Permission>(
      () => sql`
        SELECT
          *
        FROM
          Get_all_permissions ()
      `,
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
    return await this.executeQuery<Permission>(
      () => sql`
        SELECT
          *
        FROM
          Get_permission_by_name (${permissionName.toUpperCase()})
      `,
    );
  }

  /**
   * Get permission by its ID.
   *
   * @param permissionId - Numeric ID of the permission
   * @returns Permission or null if not found
   */
  async getPermissionById(permissionId: number): Promise<Permission | null> {
    return await this.executeQuery<Permission>(
      () => sql`
        SELECT
          *
        FROM
          Get_permission_by_id (${permissionId})
      `,
    );
  }
}
