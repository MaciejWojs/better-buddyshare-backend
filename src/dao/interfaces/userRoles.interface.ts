import { Permission } from '@src/types/db/Permission';
import { Role } from '@src/types/db/Role';

export interface IUserRolesDAO {
  // Global roles
  assignRoleToUser(userId: number, roleId: number): Promise<boolean | null>;
  assignRoleToUser(userId: number, roleName: string): Promise<boolean | null>;

  // Scoped to streamer
  assignRoleToUser(
    userId: number,
    roleId: number,
    streamerId: number,
  ): Promise<boolean | null>;
  assignRoleToUser(
    userId: number,
    roleName: string,
    streamerId: number,
  ): Promise<boolean | null>;

  // Global roles
  revokeRoleFromUser(userId: number, roleId: number): Promise<boolean | null>;
  revokeRoleFromUser(userId: number, roleName: string): Promise<boolean | null>;

  // Scoped to streamer
  revokeRoleFromUser(
    userId: number,
    roleId: number,
    streamerId: number,
  ): Promise<boolean | null>;
  revokeRoleFromUser(
    userId: number,
    roleName: string,
    streamerId: number,
  ): Promise<boolean | null>;

  // Global roles
  getUserRoles(userId: number): Promise<Role[] | null>;
  // Scoped to streamer
  getUserRoles(userId: number, streamerId: number): Promise<Role[] | null>;

  getUserPermissions(userId: number): Promise<Permission[] | null>;
  getUserPermissions(
    userId: number,
    streamerId: number,
  ): Promise<Permission[] | null>;

  checkIfUserHasPermission(
    userId: number,
    permissionName: string,
  ): Promise<boolean | null>;
  checkIfUserHasPermission(
    userId: number,
    permissionId: number,
  ): Promise<boolean | null>;

  // Scoped to streamer
  checkIfUserHasPermission(
    userId: number,
    permissionName: string,
    streamerId: number,
  ): Promise<boolean | null>;
  checkIfUserHasPermission(
    userId: number,
    permissionId: number,
    streamerId: number,
  ): Promise<boolean | null>;
}
