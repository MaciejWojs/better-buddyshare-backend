import { BaseDAO } from './BaseDao';
import { IStreamsDAO } from './interfaces';
import { Stream } from '@src/types';
import { IDbClient } from '@src/db/interfaces';

export class StreamsDAO extends BaseDAO implements IStreamsDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }
  async checkIfUserIsStreamer(userId: number): Promise<boolean | null> {
    return await this.scalar('SELECT check_if_user_is_streamer($1)', [userId]);
  }

  async createStream(
    streamerId: number,
    title?: string | null,
    description?: string | null,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      'SELECT * FROM create_stream($1, $2, $3)',
      [streamerId, title, description],
    );
  }

  async endStream(streamId: number): Promise<Stream | null> {
    return await this.executeQuery<Stream>('SELECT * FROM end_stream($1)', [
      streamId,
    ]);
  }

  async endAllStreamsForUser(userId: number): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      'SELECT * FROM end_all_streams_for_user($1)',
      [userId],
    );
  }

  async endAllStreams(): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      'SELECT * FROM end_all_streams()',
      [],
    );
  }

  async getActiveStreams(): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      'SELECT * FROM get_active_streams()',
      [],
    );
  }

  async checkIfUserIsStreaming(streamerId: number): Promise<boolean> {
    const result = await this.scalar('SELECT check_if_user_is_streaming($1)', [
      streamerId,
    ]);
    if (!result) {
      console.log('[STREAMING CHECK] No result returned for streaming check.');
      return false;
    }
    return result;
  }

  async checkIfUserIsStreamingAndPublic(streamerId: number): Promise<boolean> {
    const result = await this.scalar(
      'SELECT check_if_user_is_streaming_and_public($1)',
      [streamerId],
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
    return await this.executeQuery<Stream>(
      'SELECT * FROM get_stream_by_id($1)',
      [streamId],
    );
  }

  async getStreamsByUserId(userId: number): Promise<Stream[]> {
    return await this.executeQueryMultiple<Stream>(
      'SELECT * FROM get_streams_by_user_id($1)',
      [userId],
    );
  }
  async updateStreamDetails(
    streamId: number,
    title?: string | null,
    description?: string | null,
    thumbnail?: string | null,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      'SELECT * FROM update_stream_details($1, $2, $3, $4)',
      [streamId, title, description, thumbnail],
    );
  }
  async setStreamLiveStatus(
    streamId: number,
    isLive: boolean,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      'SELECT * FROM set_stream_live_status($1, $2)',
      [streamId, isLive],
    );
  }
  async addPathToStream(
    streamId: number,
    path: string,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      'SELECT * FROM add_path_to_stream($1, $2)',
      [streamId, path],
    );
  }
  async setStreamLockStatus(
    streamId: number,
    isLocked: boolean,
  ): Promise<Stream | null> {
    return await this.executeQuery<Stream>(
      'SELECT * FROM set_stream_lock_status($1, $2)',
      [streamId, isLocked],
    );
  }
}
