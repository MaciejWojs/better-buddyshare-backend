import { sql } from "bun";
import { IPermissionsDAO } from "./interfaces/permissions.interface";
import { Permission } from "@src/types/db/Permission";

export class PermissionDAO implements IPermissionsDAO {
  private static instance: PermissionDAO;

  private constructor() {
    console.log(`Initializing ${this.constructor.name} DAO`);
  }

  public static getInstance(): PermissionDAO {
    if (!this.instance) {
      this.instance = new PermissionDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  async createPermission(permissionName: string): Promise<Permission | null> {
    const results = await sql`select * from Create_permission(${permissionName.toUpperCase()})`;

    if (results.length === 0) {
      console.log(`Failed to create permission: ${permissionName}`);
      return null;
    }

    if (results.count === 0) {
      throw new Error(`Failed to create permission: ${permissionName}`);
    }

    const result = results[0];
    return result;
  }

  async deletePermissionById(permissionId: number): Promise<boolean> {
    const results = await sql`select * from Delete_permission_by_id(${permissionId})`;
    const isDeleted = results[0].delete_permission_by_id;
    console.log('[ID] Delete permission result:', isDeleted);
    return isDeleted;
  }

  async deletePermissionByName(permissionName: string): Promise<boolean> {
    const results = await sql`select * from Delete_permission_by_name(${permissionName.toUpperCase()})`;
    const isDeleted = results[0].delete_permission_by_name;
    console.log('[NAME] Delete permission result:', isDeleted);
    return isDeleted;
  }

  async getAllPermissions(): Promise<Permission[] | null> {
    const results = await sql`select * from Get_all_permissions()`;
    console.log('All permissions fetched:', results);

    if (results.length === 0) {
      console.log('[LENGTH] No permissions found in the database.');
      return null;
    }

    if (results.count === 0) {
      console.log('[COUNT] No permissions found in the database.');
      throw new Error('No permissions found in the database.');
    }

    //! Not sure if correctly handled
    return results;
  }

  async getPermissionByName(permissionName: string): Promise<Permission | null> {
    const results = await sql`select * from Get_permission_by_name(${permissionName.toUpperCase()})`;

    if (results.length === 0) {
      console.log(`Permission not found: ${permissionName}`);
      return null;
    }

    if (results.count === 0) {
      throw new Error(`Permission not found: ${permissionName}`);
    }

    const result = results[0];
    return result;
  }
  async getPermissionById(permissionId: number): Promise<Permission | null> {
    const results = await sql`select * from Get_permission_by_id(${permissionId})`;

    if (results.length === 0) {
      console.log(`Permission not found with ID: ${permissionId}`);
      return null;
    }

    if (results.count === 0) {
      throw new Error(`Permission not found with ID: ${permissionId}`);
    }

    const result = results[0];
    return result;
  }
}
