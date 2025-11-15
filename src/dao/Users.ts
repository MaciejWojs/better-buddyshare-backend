import { sql } from 'bun'
import { IUserDAO } from './interfaces/users.interface';

export class UserDAO implements IUserDAO {
    private static instance: UserDAO | null = null;

    private constructor() { }

    public static getInstance(): UserDAO {
        if (!this.instance) {
            this.instance = new UserDAO();
            console.log(`Creating new ${this.prototype.constructor.name} instance`);
        }

        return this.instance;
    }

    async findById(id: number) {
        const user = await sql`select * from get_user_by_id(${id})`
        // console.log('findById user:', user);
        // console.log(user.length, user.count, user);

        if (user.length === 0) {
            console.log(`User with ID ${id} does not exist first time`);

            console.log(`user = ${user}`);
            return null; // No user found
        }

        if (user.count === 0) {
            throw new Error(`User with ID ${id} does not exist second time`);
            console.log(`user = ${user}`);
        }
        return user;
    }

    async findByEmail(email: string) {
        const user = await sql`select * from get_user_by_email(${email})`
        // console.log(user.length, user.count, user);

        if (user.length === 0) {
            console.log(`User with email ${email} does not exist first time`);
            return null; // No user found

        }
        if (user.count === 0) {
            throw new Error(`User with email ${email} does not exist second time`);
        }
        return user;
    }

    async unbanUser(user_id: number) {
        const user = await sql`select * from unban_user_globally(${user_id})`
        const error_message = `User banning went wrong!`
        if (user.length === 0) {
            console.log(error_message)
            return null;
        }

        if (user.count === 0) {
            throw new Error(error_message);
        }
        // !TODO: sprawdź czy działa
        return user;
    }

    async banUser(user_id: number, reason: string | null = null) {
        // !TODO: sprawdź czy działa
        if (reason) {
            return await sql`select * from ban_user_globally(${user_id}, ${reason})`
        }

        return await sql`select * from ban_user_globally(${user_id})`
    }

    async updateProfilePicture(user_id: number, profile_picture: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_avatar(${user_id}, ${profile_picture})`
    }

    async updateProfileBanner(user_id: number, profile_banner: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_profile_banner(${user_id}, ${profile_banner})`
    }

    async updateBio(user_id: number, description: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_description(${user_id}, ${description})`
    }

    async updateUsername(user_id: number, username: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_username(${user_id}, ${username})`
    }

    async updateEmail(user_id: number, email: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_email(${user_id}, ${email})`
    }

    async updatePassword(user_id: number, password: string) {
        // !TODO: sprawdź czy działa
        return await sql`select * from update_user_password(${user_id}, ${password})`
    }

    async createUser(username: string, email: string, password: string) {
        return await sql`select * from create_user(${username}, ${email}, ${password})`
    }

}