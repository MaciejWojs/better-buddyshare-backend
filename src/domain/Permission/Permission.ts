import { PermissionId, PermissionName } from '@src/domain';

export class Permission {
  constructor(
    readonly id: PermissionId,
    readonly name: PermissionName,
  ) {}

  private copy(changes: Partial<Permission>) {
    return new Permission(changes.id ?? this.id, changes.name ?? this.name);
  }

  changeName(newName: PermissionName) {
    return this.copy({ name: newName });
  }
}
