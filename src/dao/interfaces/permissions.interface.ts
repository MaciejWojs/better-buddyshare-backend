import { Permission } from "@src/types/db/Permission";

export interface IPermissionsDAO {
  createPermission(permissionName: string): Promise<Permission | null>;
  deletePermissionById(permissionId: number): Promise<void>;
  deletePermissionByName(permissionName: string): Promise<void>;
  getAllPermissions(): Promise<Permission[] | null>;
}
