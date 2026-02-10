export type Session = {
  session_id: string;
  user_id: number;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  created_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
  expires_at: Date;
  is_active: boolean;
};
