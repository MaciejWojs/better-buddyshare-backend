import { Permission } from "@src/types/db/Permission";
import { Role } from "@src/types/db/Role";
import { IRolesDAO } from "./interfaces/role";
import { sql } from "bun";

export class RolesDAO implements IRolesDAO {
  private static instance: RolesDAO;

  private constructor() {
    console.log(`Initializing ${this.constructor.name} DAO`);
  }

  public static getInstance(): RolesDAO {
    if (!this.instance) {
      this.instance = new RolesDAO();
      console.log(`Creating new ${this.name} instance`);
    }
    return this.instance;
  }

  async createRole(roleName: string): Promise<Role | null> {
    const results =
      await sql`select * from Create_role(${roleName.toUpperCase()})`;

    if (results.length === 0) {
      console.log(`Failed to create role: ${roleName}`);
      return null;
    }

    if (results.count === 0) {
      throw new Error(`Failed to create role: ${roleName}`);
    }

    const result = results[0];
    return result;
  }

  async deleteRoleById(roleId: number): Promise<boolean> {
    const results = await sql`select * from Delete_role_by_id(${roleId})`;
    const isDeleted = results[0].delete_role_by_id;
    console.log("[ID] Delete role result:", isDeleted);
    return isDeleted;
  }

  async deleteRoleByName(roleName: string): Promise<boolean> {
    const results = await sql`select * from Delete_role_by_name(${roleName})`;
    const isDeleted = results[0].delete_role_by_name;
    console.log("[Name] Delete role result:", isDeleted);
    return isDeleted;
  }

  async getAllRoles(): Promise<Role[] | null> {
    const results = await sql`select * from Get_all_roles()`;

    if (results.length === 0) {
      console.log("[LENGTH] No roles found in the database.");
      return null;
    }

    if (results.count === 0) {
      console.log("[COUNT] No roles found in the database.");
      return null;
    }

    return results;
  }
  async getRoleByName(roleName: string): Promise<Role | null> {
    const results = await sql`select * from Get_role_by_name(${roleName})`;

    if (results.length === 0) {
      console.log("[LENGTH] No role found in the database.");
      return null;
    }

    if (results.count === 0) {
      console.log("[COUNT] No role found in the database.");
      return null;
    }

    return results[0];
  }
  async getRoleById(roleId: number): Promise<Role | null> {
    const results = await sql`select * from Get_role_by_id(${roleId})`;

    if (results.length === 0) {
      console.log("[LENGTH] No role found in the database.");
      return null;
    }

    if (results.count === 0) {
      console.log("[COUNT] No role found in the database.");
      return null;
    }

    return results[0];
  }
  async assignPermissionToRole(
    roleId: number,
    permissionId: number
  ): Promise<boolean> {
    const results =
      await sql`select * from Assign_permission_to_role(${roleId}, ${permissionId})`;
    const isAssigned = results[0].assign_permission_to_role;
    console.log("Assign permission to role result:", isAssigned);
    return isAssigned;
  }
  async revokePermissionFromRole(
    roleId: number,
    permissionId: number
  ): Promise<boolean> {
    const results =
      await sql`select * from Revoke_permission_from_role(${roleId}, ${permissionId})`;
    const isRevoked = results[0].revoke_permission_from_role;
    console.log("Revoke permission from role result:", isRevoked);
    return isRevoked;
  }
  async getPermissionsByRoleId(roleId: number): Promise<Permission[] | null> {
    const results =
      await sql`select * from Get_permissions_by_role_id(${roleId})`;

    if (results.length === 0) {
      console.log("[LENGTH] No permissions found for role ID:", roleId);
      return null;
    }

    if (results.count === 0) {
      console.log("[COUNT] No permissions found for role ID:", roleId);
      return null;
    }

    //! Not sure if correctly handled

    return results;
  }
  async getPermissionsByRoleName(
    roleName: string
  ): Promise<Permission[] | null> {
    const results =
      await sql`select * from Get_permissions_by_role_name(${roleName})`;

    if (results.length === 0) {
      console.log("[LENGTH] No permissions found for role name:", roleName);
      return null;
    }
    if (results.count === 0) {
      console.log("[COUNT] No permissions found for role name:", roleName);
      return null;
    }

    //! Not sure if correctly handled
    return results;
  }
}
