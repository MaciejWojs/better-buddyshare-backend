import { Permission } from '@src/types/db/Permission';
import { Role } from '@src/types/db/Role';

export interface IRolesDAO {
  createRole(roleName: string): Promise<Role | null>;
  deleteRoleById(roleId: number): Promise<boolean>;
  deleteRoleByName(roleName: string): Promise<boolean>;
  getAllRoles(): Promise<Role[] | null>;
  getRoleByName(roleName: string): Promise<Role | null>;
  getRoleById(roleId: number): Promise<Role | null>;
  assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean>;
  revokePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<boolean>;
  getPermissionsByRoleId(roleId: number): Promise<Permission[] | null>;
  getPermissionsByRoleName(roleName: string): Promise<Permission[] | null>;
}
