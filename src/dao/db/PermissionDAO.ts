/**
 * Permissions DAO - Raw SQL queries implementation.
 *
 * @module dao/Permissions
 */
import { IDbClient } from '@src/db/interfaces';
import { IPermissionsDAO } from './interfaces';
import { Permission } from '@src/types';
import { BaseDAO } from './BaseDao';

export class PermissionDAO extends BaseDAO implements IPermissionsDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async createPermission(permissionName: string): Promise<Permission | null> {
    const name = permissionName.toUpperCase();
    // Sprawdź czy już istnieje
    const existing = await this.getPermissionByName(name);
    if (existing) return existing;

    return this.executeQuery<Permission>(
      `INSERT INTO permissions (name) VALUES ($1) RETURNING *`,
      [name],
    );
  }

  async deletePermissionById(permissionId: number): Promise<boolean> {
    const res = await this.executeQuery<Permission>(
      `DELETE FROM permissions WHERE permission_id = $1 RETURNING *`,
      [permissionId],
    );
    return res !== null;
  }

  async deletePermissionByName(permissionName: string): Promise<boolean> {
    const res = await this.executeQuery<Permission>(
      `DELETE FROM permissions WHERE name = $1 RETURNING *`,
      [permissionName.toUpperCase()],
    );
    return res !== null;
  }

  async getAllPermissions(): Promise<Permission[] | null> {
    return this.executeQueryMultiple<Permission>(
      `SELECT * FROM permissions ORDER BY permission_id`,
      [],
    );
  }

  async getPermissionByName(
    permissionName: string,
  ): Promise<Permission | null> {
    return this.executeQuery<Permission>(
      `SELECT * FROM permissions WHERE name = $1`,
      [permissionName.toUpperCase()],
    );
  }

  async getPermissionById(permissionId: number): Promise<Permission | null> {
    return this.executeQuery<Permission>(
      `SELECT * FROM permissions WHERE permission_id = $1`,
      [permissionId],
    );
  }
}
