export type RefreshToken = {
  token_id: string;
  token_hash: string;
  user_id: number;
  session_id: string;
  issued_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_id: string | null;
  used_at: Date | null;
};
