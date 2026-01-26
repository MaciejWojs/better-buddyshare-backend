import { Permission, RoleId, RoleName } from '@src/domain';

export class Role {
  constructor(
    readonly id: RoleId,
    readonly name: RoleName,
    // Kluczem w Mapie będzie string (nazwa uprawnienia), a wartością obiekt Permission
    readonly permissions: Map<string, Permission>,
  ) {}

  private copy(changes: Partial<Role>) {
    return new Role(
      changes.id ?? this.id,
      changes.name ?? this.name,
      changes.permissions ?? this.permissions,
    );
  }

  changeName(newName: RoleName) {
    return this.copy({ name: newName });
  }

  updatePermissions(newPermissions: Map<string, Permission>) {
    return this.copy({ permissions: newPermissions });
  }

  addPermission(permission: Permission) {
    const updatedPermissions = new Map(this.permissions);
    updatedPermissions.set(permission.name.value, permission);
    return this.copy({ permissions: updatedPermissions });
  }

  removePermissionByTitle(permissionName: string) {
    const updatedPermissions = new Map(this.permissions);
    updatedPermissions.delete(permissionName);
    return this.copy({ permissions: updatedPermissions });
  }

  hasPermission(permissionName: string): boolean {
    return this.permissions.has(permissionName);
  }
}
