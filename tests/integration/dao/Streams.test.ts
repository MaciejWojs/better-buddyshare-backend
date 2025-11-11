import { beforeEach, afterEach, describe, test, expect } from 'bun:test';
import { sql } from 'bun';
import { UserDAO } from '@src/dao/Users';
import { StreamsDAO } from '@src/dao/Streams';

let streamsDao: StreamsDAO;
let userDao: UserDAO;
let streamerId: number;
let user: any;

beforeEach(async () => {
  streamsDao = StreamsDAO.getInstance();
  userDao = UserDAO.getInstance();

  await sql`TRUNCATE TABLE streams CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;

  user = await userDao.createUser('streamer1', 'streamer@test.com', 'pass123');
  await sql`
    SELECT
      *
    FROM
      update_stream_token (${user!.user_id})
  `;
  streamerId = user!.user_id;
});

afterEach(async () => {
  await sql`TRUNCATE TABLE streams CASCADE`;
  await sql`TRUNCATE TABLE users CASCADE`;
});

describe('Stream Token Management', () => {
  test('should update stream_token with a provided value', async () => {
    const customToken = 'MY_CUSTOM_TOKEN_123';
    const [updated] = await sql`
      SELECT
        *
      FROM
        update_stream_token (
          ${user.user_id},
          ${customToken}
        )
    `;
    expect(updated).not.toBeNull();
    expect(updated.stream_token).toBe(customToken);

    const [dbUser] = await sql`
      SELECT
        *
      FROM
        users
      WHERE
        user_id = ${user.user_id}
    `;
    expect(dbUser.stream_token).toBe(customToken);
  });

  test('should generate a new random stream_token automatically', async () => {
    const [updated] = await sql`
      SELECT
        *
      FROM
        update_stream_token (${user.user_id})
    `;
    expect(updated).not.toBeNull();
    expect(updated.stream_token).toBeString();
    expect(updated.stream_token.length).toBeGreaterThanOrEqual(16);

    const [dbUser] = await sql`
      SELECT
        *
      FROM
        users
      WHERE
        user_id = ${user.user_id}
    `;
    expect(dbUser.stream_token).toBe(updated.stream_token);
  });

  test('should return null if user does not exist', async () => {
    const [result] = await sql`
      SELECT
        *
      FROM
        update_stream_token (999999, 'FAKE_TOKEN')
    `;
    expect(result).toBeUndefined();
  });

  test('should overwrite old token with new one', async () => {
    const [first] = await sql`
      SELECT
        *
      FROM
        update_stream_token (${user.user_id}, 'FIRST_TOKEN')
    `;
    expect(first.stream_token).toBe('FIRST_TOKEN');

    const [second] = await sql`
      SELECT
        *
      FROM
        update_stream_token (${user.user_id})
    `;
    expect(second.stream_token).not.toBe('FIRST_TOKEN');
  });
});

describe('Stream DAO checks', () => {
  test('should detect that user is a streamer', async () => {
    const isStreamer = await streamsDao.checkIfUserIsStreamer(streamerId);
    expect(isStreamer).toBeTrue();
  });
});

describe('SQL Functions', () => {
  test('check_if_user_is_streamer returns true', async () => {
    const [row] = await sql`
      SELECT
        check_if_user_is_streamer (${streamerId}) AS is_streamer
    `;
    expect(row.is_streamer).toBeTrue();
  });

  test('create_stream via SQL returns created stream', async () => {
    const rows = await sql`
      SELECT
        *
      FROM
        create_stream (
          ${streamerId},
          'SQL Stream',
          'desc'
        )
    `;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].title).toBe('SQL Stream');
    expect(rows[0].is_live).toBeTrue();
  });

  test('create_stream throws for non-streamer user', async () => {
    const viewer = await userDao.createUser(
      'viewer_sql',
      'viewer_sql@test.com',
      'pw',
    );
    try {
      await sql`
        SELECT
          *
        FROM
          create_stream (${viewer!.user_id}, 'S', 'd')
      `;
      throw new Error('Expected create_stream to throw for non-streamer user');
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.message).toMatch(/is not a streamer/i);
    }
  });

  test('create_stream throws when active stream exists', async () => {
    await sql`
      SELECT
        *
      FROM
        create_stream (
          ${streamerId},
          'First SQL',
          'd'
        )
    `;
    try {
      await sql`
        SELECT
          *
        FROM
          create_stream (
            ${streamerId},
            'Second SQL',
            'd'
          )
      `;
      throw new Error(
        'Expected create_stream to throw when active stream exists',
      );
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.message).toMatch(/already has an active stream/i);
    }
  });

  test('end_stream sets is_live to false', async () => {
    const [created] = await sql`
      SELECT
        *
      FROM
        create_stream (${streamerId}, 'To End', 'd')
    `;
    const [ended] = await sql`
      SELECT
        *
      FROM
        end_stream (${created.stream_id})
    `;
    expect(ended.is_live).toBeFalse();
  });

  test('get_active_streams returns only public and live streams', async () => {
    const [created] = await sql`
      SELECT
        *
      FROM
        create_stream (
          ${streamerId},
          'Public SQL',
          'd'
        )
    `;
    await sql`
      UPDATE streams
      SET
        is_public = TRUE
      WHERE
        stream_id = ${created.stream_id}
    `;

    const active = await sql`
      SELECT
        *
      FROM
        get_active_streams ()
    `;
    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(active[0].is_public).toBeTrue();
    expect(active[0].is_live).toBeTrue();
  });

  test('check_if_user_is_streaming_and_public returns true for public live stream', async () => {
    const [created] = await sql`
      SELECT
        *
      FROM
        create_stream (
          ${streamerId},
          'Public Check',
          'd'
        )
    `;
    await sql`
      UPDATE streams
      SET
        is_public = TRUE
      WHERE
        stream_id = ${created.stream_id}
    `;
    const [row] = await sql`
      SELECT
        check_if_user_is_streaming_and_public (${streamerId}) AS is_public_stream
    `;
    expect(row.is_public_stream).toBeTrue();
  });
});

describe('Stream Operations via DAO', () => {
  test('should create a new stream for a streamer', async () => {
    const stream = await streamsDao.createStream(
      streamerId,
      'Test Stream',
      'Opis testowy',
    );
    expect(stream).not.toBeNull();
    expect(stream!.title).toBe('Test Stream');
    expect(stream!.is_live).toBeTrue();
  });

  test('should throw error if user is not a streamer', async () => {
    const user = await userDao.createUser('viewer1', 'viewer@test.com', 'pass');
    await expect(
      streamsDao.createStream(user!.user_id, 'Stream', 'x'),
    ).rejects.toThrow(/is not a streamer/i);
  });

  test('should throw error if streamer already has an active stream', async () => {
    await streamsDao.createStream(streamerId, 'First Stream', 'desc');
    await expect(
      streamsDao.createStream(streamerId, 'Second Stream', 'desc'),
    ).rejects.toThrow(/already has an active stream/i);
  });

  test('should end an existing stream', async () => {
    const stream = await streamsDao.createStream(streamerId, 'End Me', 'desc');
    const ended = await streamsDao.endStream(stream!.stream_id);
    expect(ended).not.toBeNull();
    expect(ended!.is_live).toBeFalse();
  });

  test('should end all active streams for user (manual multiple streams)', async () => {
    const stream1 = await sql`
      INSERT INTO
        streams (
          streamer_id,
          title,
          description,
          is_live,
          is_public
        )
      VALUES
        (
          ${streamerId},
          'Manual Stream 1',
          'desc1',
          TRUE,
          TRUE
        ) RETURNING *;
    `;
    const stream2 = await sql`
      INSERT INTO
        streams (
          streamer_id,
          title,
          description,
          is_live,
          is_public
        )
      VALUES
        (
          ${streamerId},
          'Manual Stream 2',
          'desc2',
          TRUE,
          TRUE
        ) RETURNING *;
    `;
    const ended = await streamsDao.endAllStreamsForUser(streamerId);
    expect(ended.length).toBeGreaterThanOrEqual(2);
    expect(ended.every((s) => s.is_live === false)).toBeTrue();
  });

  test('should end all active streams globally', async () => {
    await streamsDao.createStream(streamerId, 'Global Stream', 'desc');
    const ended = await streamsDao.endAllStreams();
    expect(ended.length).toBeGreaterThanOrEqual(1);
    expect(ended[0].is_live).toBeFalse();
  });

  test('should return only active and public streams', async () => {
    const stream = await streamsDao.createStream(
      streamerId,
      'Public Stream',
      'desc',
    );
    await sql`
      UPDATE streams
      SET
        is_public = TRUE
      WHERE
        stream_id = ${stream!.stream_id}
    `;
    const activeStreams = await streamsDao.getActiveStreams();
    expect(activeStreams.length).toBeGreaterThanOrEqual(1);
    expect(activeStreams[0].is_public).toBeTrue();
    expect(activeStreams[0].is_live).toBeTrue();
  });

  test('should check if user is currently streaming', async () => {
    await streamsDao.createStream(streamerId, 'Live Stream', 'desc');
    const isStreaming = await streamsDao.checkIfUserIsStreaming(streamerId);
    expect(isStreaming).toBeTrue();
  });

  test('should check if user is streaming and public', async () => {
    const stream = await streamsDao.createStream(
      streamerId,
      'Live Stream',
      'desc',
    );
    await sql`
      UPDATE streams
      SET
        is_public = TRUE
      WHERE
        stream_id = ${stream!.stream_id}
    `;
    const isPublic =
      await streamsDao.checkIfUserIsStreamingAndPublic(streamerId);
    expect(isPublic).toBeTrue();
  });

  test('should get stream by ID', async () => {
    const stream = await streamsDao.createStream(streamerId, 'Find Me', 'desc');
    const fetched = await streamsDao.getStreamById(stream!.stream_id);
    expect(fetched).not.toBeNull();
    expect(fetched!.stream_id).toBe(stream!.stream_id);
  });

  test('should get all streams by user ID', async () => {
    await streamsDao.createStream(streamerId, 'S1', 'D1');
    const streams = await streamsDao.getStreamsByUserId(streamerId);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    expect(streams[0].streamer_id).toBe(streamerId);
  });

  test('should update stream details', async () => {
    const stream = await streamsDao.createStream(streamerId, 'Old', 'Old desc');
    const updated = await streamsDao.updateStreamDetails(
      stream!.stream_id,
      'New Title',
      'New Desc',
    );
    expect(updated!.title).toBe('New Title');
    expect(updated!.description).toBe('New Desc');
  });

  test('should set stream live status', async () => {
    const stream = await streamsDao.createStream(streamerId, 'Live', 'desc');
    const updated = await streamsDao.setStreamLiveStatus(
      stream!.stream_id,
      false,
    );
    expect(updated!.is_live).toBeFalse();
  });

  test('should add path to stream', async () => {
    const stream = await streamsDao.createStream(
      streamerId,
      'With Path',
      'desc',
    );
    const updated = await streamsDao.addPathToStream(
      stream!.stream_id,
      '/test/path',
    );
    expect(updated!.path).toBe('/test/path');
  });

  test('should lock and unlock a stream', async () => {
    const stream = await streamsDao.createStream(streamerId, 'Lock Me', 'desc');
    const locked = await streamsDao.setStreamLockStatus(
      stream!.stream_id,
      true,
    );
    expect(locked!.is_locked).toBeTrue();

    const unlocked = await streamsDao.setStreamLockStatus(
      stream!.stream_id,
      false,
    );
    expect(unlocked!.is_locked).toBeFalse();
  });
});
