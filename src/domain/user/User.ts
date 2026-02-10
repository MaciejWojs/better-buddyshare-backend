import {
  Description,
  Email,
  Password,
  Role,
  UserId,
  Username,
  StreamRole,
} from '@src/domain';

export class User {
  constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly username: Username,
    readonly passwordHash: Password,
    readonly createdAt: Date,
    readonly avatar: string,
    readonly profileBanner: string,
    readonly description: Description,
    readonly isBanned: boolean,
    readonly roles: Role[], // Role globalne (Admin, Support)
    readonly streamRoles: StreamRole[], // Role kanałowe (Moderator u kogoś)
    readonly banReason: string | null,
    readonly banExpiresAt: Date | null,
    readonly streamToken: string | null,
  ) {}

  private copy(changes: Partial<User>): User {
    return new User(
      changes.id ?? this.id,
      changes.email ?? this.email,
      changes.username ?? this.username,
      changes.passwordHash ?? this.passwordHash,
      changes.createdAt ?? this.createdAt,
      changes.avatar ?? this.avatar,
      changes.profileBanner ?? this.profileBanner,
      changes.description ?? this.description,
      changes.isBanned ?? this.isBanned,
      changes.roles ?? this.roles,
      changes.streamRoles ?? this.streamRoles,
      changes.banReason ?? this.banReason,
      changes.banExpiresAt ?? this.banExpiresAt,
      //! Uwaga: tutaj musimy obsłużyć null jawnie, jeśli changes.streamToken jest undefined, bierzemy this.streamToken
      // Jeśli changes.streamToken jest null (celowo), bierzemy null.
      changes.streamToken !== undefined
        ? changes.streamToken
        : this.streamToken,
    );
  }
  changeUsername(newName: Username): User {
    return this.copy({ username: newName });
  }

  updateDescription(newDescription: Description): User {
    return this.copy({ description: newDescription });
  }

  updateAvatar(newAvatar: string): User {
    return this.copy({ avatar: newAvatar });
  }

  changePassword(newPassword: Password): User {
    return this.copy({
      passwordHash: newPassword,
    });
  }

  ban(reason: string, expiresAt: Date): User {
    return this.copy({
      isBanned: true,
      banReason: reason,
      banExpiresAt: expiresAt,
    });
  }

  unban(): User {
    return this.copy({
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
    });
  }

  setStreamToken(token: string | null): User {
    return this.copy({ streamToken: token });
  }

  addRole(role: Role): User {
    if (this.roles.find((r) => r === role)) {
      return this;
    }
    return this.copy({ roles: [...this.roles, role] });
  }

  removeRole(role: Role): User {
    return this.copy({ roles: this.roles.filter((r) => r !== role) });
  }

  hasPermission(permission: string, contextStreamerId?: UserId): boolean {
    // 1. Sprawdź role globalne
    if (this.roles.some((r) => r.hasPermission(permission))) return true;

    // 2. Jeśli podano kontekst, sprawdź role na tym kanale
    if (contextStreamerId) {
      return this.streamRoles
        .filter((sr) => sr.streamerId.value === contextStreamerId.value)
        .some((sr) => sr.role.hasPermission(permission));
    }

    return false;
  }

  // Ulepszone hasRole - lepiej sprawdzać po nazwie (string),
  // bo obiekty Role mogą mieć różne referencje w pamięci
  hasRole(roleName: string): boolean {
    return this.roles.some((r) => r.name.value === roleName);
  }

  updateAllRoles(roles: Role[]): User {
    return this.copy({ roles });
  }

  async verifyPassword(password: string): Promise<boolean> {
    return await this.passwordHash.verify(password);
  }

  isStreamer(): boolean {
    return this.hasRole('Streamer');
  }
}
