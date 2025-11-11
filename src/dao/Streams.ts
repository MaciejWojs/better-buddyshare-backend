import { sql } from 'bun';
import { BaseDAO } from './BaseDao';
import { IStreamsDAO } from './interfaces';
import { Stream } from '@src/types/db';

export class StreamsDAO extends BaseDAO implements IStreamsDAO {
  private static instance: StreamsDAO | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): StreamsDAO {
    if (!this.instance) {
      this.instance = new StreamsDAO();
    }

    return this.instance;
  }

  async checkIfUserIsStreamer(userId: number): Promise<boolean | null> {
    return await this.getBooleanFromQuery(
      () => sql`
        SELECT
          *
        FROM
          check_if_user_is_streamer (${userId})
      `,
    );
  }

  async createStream(
    streamerId: number,
    title?: string | null,
    description?: string | null,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          create_stream (
            ${streamerId},
            ${title},
            ${description}
          )
      `,
    );
  }

  async endStream(streamId: number): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          end_stream (${streamId})
      `,
    );
  }

  async endAllStreamsForUser(userId: number): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      () => sql`
        SELECT
          *
        FROM
          end_all_streams_for_user (${userId})
      `,
    );
  }

  async endAllStreams(): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      () => sql`
        SELECT
          *
        FROM
          end_all_streams ()
      `,
    );
  }

  async getActiveStreams(): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      () => sql`
        SELECT
          *
        FROM
          get_active_streams ()
      `,
    );
  }

  async checkIfUserIsStreaming(streamerId: number): Promise<boolean> {
    const result = await this.getBooleanFromQuery(
      () => sql`
        SELECT
          *
        FROM
          check_if_user_is_streaming (${streamerId})
      `,
    );
    if (!result) {
      console.log('[STREAMING CHECK] No result returned for streaming check.');
      return false;
    }
    return result;
  }

  async checkIfUserIsStreamingAndPublic(streamerId: number): Promise<boolean> {
    const result = await this.getBooleanFromQuery(
      () => sql`
        SELECT
          *
        FROM
          check_if_user_is_streaming_and_public (${streamerId})
      `,
    );
    if (!result) {
      console.log(
        '[STREAMING & PUBLIC CHECK] No result returned for streaming and public check.',
      );
      return false;
    }
    return result;
  }

  async getStreamById(streamId: number): Promise<Stream | null> {
    const result = await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          get_stream_by_id (${streamId})
      `,
    );
    return result;
  }

  async getStreamsByUserId(userId: number): Promise<Stream[]> {
    const results = await this.executeQueryMultiple<Stream>(
      () => sql`
        SELECT
          *
        FROM
          get_streams_by_user_id (${userId})
      `,
    );
    return results;
  }
  async updateStreamDetails(
    streamId: number,
    title?: string | null,
    description?: string | null,
    thumbnail?: string | null,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          update_stream_details (
            ${streamId},
            ${title},
            ${description},
            ${thumbnail}
          )
      `,
    );
  }
  async setStreamLiveStatus(
    streamId: number,
    isLive: boolean,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          set_stream_live_status (
            ${streamId},
            ${isLive}
          )
      `,
    );
  }
  async addPathToStream(
    streamId: number,
    path: string,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          add_path_to_stream (
            ${streamId},
            ${path}
          )
      `,
    );
  }
  async setStreamLockStatus(
    streamId: number,
    isLocked: boolean,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      () => sql`
        SELECT
          *
        FROM
          set_stream_lock_status (
            ${streamId},
            ${isLocked}
          )
      `,
    );
  }
}
