export type Message = {
  message_id: number;
  stream_id: number;
  user_id: number;
  content: string;
  sent_at: Date;
  is_deleted: boolean;
};
