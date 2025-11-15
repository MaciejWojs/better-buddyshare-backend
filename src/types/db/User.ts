

export type User = {
    user_id: number;
    email: string;
    username: string;
    password: string;
    created_at: Date;
    avatar: string;
    profile_banner: string;
    description: string;
    is_banned: boolean;
    ban_reason: string | null,
    ban_expires_at: Date | null,
    stream_token: string | null,
}