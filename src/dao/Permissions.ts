import { sql } from "bun";
import { IPermissionsDAO } from "./interfaces/permissions.interface";
import { Permission } from "@src/types/db/Permission";

export class PermissionDAO implements IPermissionsDAO {
  async createPermission(permissionName: string): Promise<Permission | null> {
    const result =
      await sql`select * from Create_permission(${permissionName})`;
    return result[0] || null;
  }

  async deletePermissionById(permissionId: number): Promise<void> {
    await sql`select * from Delete_permission_by_id(${permissionId})`;
  }

  async deletePermissionByName(permissionName: string): Promise<void> {
    await sql`select * from Delete_permission_by_name(${permissionName})`;
  }

  async getAllPermissions(): Promise<Permission[] | null> {
    const result = await sql`select * from Get_all_permissions()`;
    return result || null;
  }
}
