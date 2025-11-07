export type Stream = {
  stream_id: number;
  streamer_id: number;
  title: string;
  description: string;
  thumbnail: string | '';
  is_live: boolean;
  is_public: boolean;
  is_locked: boolean;
  started_at: Date;
  ended_at: Date | null;
  path: string | null;
};
