import { Stream } from '@src/types';

export interface IStreamsDAO {
  /**
   * Checks if the user has a stream token set (Check_if_user_is_streamer).
   * @param userId - The ID of the user to check.
   * @returns A promise that resolves to a boolean indicating whether the user is a streamer.
   */
  checkIfUserIsStreamer(userId: number): Promise<boolean | null>;

  /**
   * Creates a new stream (create_stream) and returns the created record.
   * @param streamerId - The ID of the streamer who will create the stream.
   * @param title - The title of the stream (optional).
   * @param description - The description of the stream (optional).
   * @returns A promise that resolves to the created stream record.
   */
  createStream(
    streamerId: number,
    title?: string | null,
    description?: string | null,
  ): Promise<Stream | null>;

  /**
   * Ends a stream by its ID (end_stream) and returns the updated record or null.
   * @param streamId - The ID of the stream to end.
   * @returns A promise that resolves to the updated stream record or null if not found.
   */
  endStream(streamId: number): Promise<Stream | null>;

  /**
   * Ends all active streams for a user (end_all_streams_for_user) and returns the updated records.
   * @param userId - The ID of the user whose streams should be ended.
   * @returns A promise that resolves to an array of the updated streams.
   */
  endAllStreamsForUser(userId: number): Promise<Stream[]>;

  /**
   * Ends all active streams (end_all_streams) and returns the updated records.
   * @returns A promise that resolves to an array of the updated streams.
   */
  endAllStreams(): Promise<Stream[]>;

  /**
   * Returns a list of active and public streams (get_active_streams).
   * @returns A promise that resolves to an array of active and public streams.
   */
  getActiveStreams(): Promise<Stream[]>;

  /**
   * Checks if the user is currently streaming (check_if_user_is_streaming).
   * @param streamerId - The ID of the streamer to check.
   * @returns A promise that resolves to a boolean indicating whether the user is currently streaming.
   */
  checkIfUserIsStreaming(streamerId: number): Promise<boolean>;

  /**
   * Checks if the user is streaming and the stream is public (check_if_user_is_streaming_and_public).
   * @param streamerId - The ID of the streamer to check.
   * @returns A promise that resolves to a boolean indicating whether the user is streaming and the stream is public.
   */
  checkIfUserIsStreamingAndPublic(streamerId: number): Promise<boolean>;

  /**
   * Retrieves a stream by its ID (get_stream_by_id).
   * @param streamId - The ID of the stream to retrieve.
   * @returns A promise that resolves to the stream record or null if not found.
   */
  getStreamById(streamId: number): Promise<Stream | null>;

  /**
   * Retrieves all streams of a user (get_streams_by_user_id).
   * @param userId - The ID of the user whose streams are to be retrieved.
   * @returns A promise that resolves to an array of streams associated with the user.
   */
  getStreamsByUserId(userId: number): Promise<Stream[]>;

  /**
   * Updates the details of a stream (update_stream_details).
   * @param streamId - The ID of the stream to update.
   * @param title - The new title of the stream (optional).
   * @param description - The new description of the stream (optional).
   * @param thumbnail - The new thumbnail URL for the stream (optional).
   * @returns A promise that resolves to the updated stream record or null if not found.
   */
  updateStreamDetails(
    streamId: number,
    title?: string | null,
    description?: string | null,
    thumbnail?: string | null,
  ): Promise<Stream | null>;

  /**
   * Sets the live status for a stream (set_stream_live_status).
   * @param streamId - The ID of the stream to update.
   * @param isLive - The new live status of the stream (true for live, false for not live).
   * @returns A promise that resolves to the updated stream record or null if not found.
   */
  setStreamLiveStatus(
    streamId: number,
    isLive: boolean,
  ): Promise<Stream | null>;

  /**
   * Adds or updates the path for a stream (add_path_to_stream).
   * @param streamId - The ID of the stream to update.
   * @param path - The new path to associate with the stream.
   * @returns A promise that resolves to the updated stream record or null if not found.
   */
  addPathToStream(streamId: number, path: string): Promise<Stream | null>;

  /**
   * Sets the lock status for a stream (set_stream_lock_status).
   * @param streamId - The ID of the stream to update.
   * @param isLocked - The new lock status of the stream (true to lock, false to unlock).
   * @returns A promise that resolves to the updated stream record or null if not found.
   */
  setStreamLockStatus(
    streamId: number,
    isLocked: boolean,
  ): Promise<Stream | null>;
}
