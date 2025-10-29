import { sql } from 'bun'
import { IStreamersDAO } from './interfaces/streamers.interface';

export class StreamersDAO implements IStreamersDAO {
    private static instance: StreamersDAO | null = null;

    private constructor() { }

    public static getInstance(): StreamersDAO {
        if (!this.instance) {
            this.instance = new StreamersDAO();
        }

        return this.instance;
    }

    async findById(id: number) {
        return await sql`select * from get_user_by_id(${id})`
    }


    async banUserInChat(streamerId: number, userId: number) {
        return await sql`select * from ban_user_in_chat(${streamerId}, ${userId})`
    }
}