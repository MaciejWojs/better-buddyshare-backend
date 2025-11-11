import { Permission } from '@src/types/db/Permission';

export interface IPermissionsDAO {
  createPermission(permissionName: string): Promise<Permission | null>;
  deletePermissionById(permissionId: number): Promise<boolean>;
  deletePermissionByName(permissionName: string): Promise<boolean>;
  getAllPermissions(): Promise<Permission[] | null>;
  getPermissionByName(permissionName: string): Promise<Permission | null>;
  getPermissionById(permissionId: number): Promise<Permission | null>;
}
