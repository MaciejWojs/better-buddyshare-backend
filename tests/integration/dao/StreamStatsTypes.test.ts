import {
  expect,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'bun:test';
import { sql } from 'bun';
import { StreamStatsTypesDAO } from '@src/dao';

// ⚠ Uwaga: upewnij się, że import jest poprawny względem struktury Twojego projektu

const dao = StreamStatsTypesDAO.getInstance();

describe('StreamStatsTypesDAO – Integration Tests', () => {
  afterEach(async () => {
    // Clean up the stream_statistic_types table after all tests
    await sql`TRUNCATE TABLE stream_statistics_types RESTART IDENTITY CASCADE`;
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  it('should create a statistic type', async () => {
    const res = await dao.createStatisticType('viewers', 'Number of viewers');

    expect(res).not.toBeNull();
    expect(res!.name).toBe('viewers');
    expect(res!.description).toBe('Number of viewers');

    const count = await dao.countStatisticTypes();
    expect(count).toBe(1);
  });

  it('should return existing statistic type when creating with duplicate name', async () => {
    const r1 = await dao.createStatisticType('likes', 'Likes count');
    const r2 = await dao.createStatisticType('likes', 'Another description');

    expect(r2!.stream_statistic_type_id).toBe(r1!.stream_statistic_type_id);

    const all = await dao.getAllStatisticTypes();

    expect(all.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  it('should update an existing statistic type', async () => {
    const created = await dao.createStatisticType(
      'followers',
      'User followers',
    );

    const updated = await dao.updateStatisticType(
      created!.stream_statistic_type_id,
      'followers_updated',
      'Updated desc',
    );

    expect(updated!.name).toBe('followers_updated');
    expect(updated!.description).toBe('Updated desc');
  });

  it('should throw when updating non-existent type', async () => {
    await expect(async () => {
      await dao.updateStatisticType(9999, 'x', 'y');
    }).toThrow();
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  it('should delete statistic type by id', async () => {
    const created = await dao.createStatisticType('messages', 'Chat messages');

    const deleted = await dao.deleteStatisticTypeById(
      created!.stream_statistic_type_id,
    );

    expect(deleted).toBe(true);

    const exists = await dao.statisticTypeExistsById(
      created!.stream_statistic_type_id,
    );
    expect(exists).toBe(false);
  });

  it('should return false when deleting non-existent type', async () => {
    const deleted = await dao.deleteStatisticTypeById(12345);
    expect(deleted).toBe(false);
  });

  // -------------------------------------------------------------------------
  // EXISTS
  // -------------------------------------------------------------------------

  it('should confirm existence by id', async () => {
    const created = await dao.createStatisticType('duration', null);

    const exists = await dao.statisticTypeExistsById(
      created!.stream_statistic_type_id,
    );

    expect(exists).toBe(true);
  });

  it('should confirm existence by name', async () => {
    await dao.createStatisticType('fps', 'Frames per second');

    const exists = await dao.statisticTypeExistsByName('fps');

    expect(exists).toBe(true);
  });

  it('should return false when checking non-existent name', async () => {
    const exists = await dao.statisticTypeExistsByName('not_exists');
    expect(exists).toBe(false);
  });

  // -------------------------------------------------------------------------
  // GET BY ID / NAME
  // -------------------------------------------------------------------------

  it('should get statistic type by ID', async () => {
    const created = await dao.createStatisticType('bitrate', 'Video bitrate');

    const fetched = await dao.getStatisticTypeById(
      created!.stream_statistic_type_id,
    );

    expect(fetched!.name).toBe('bitrate');
  });

  it('should get statistic type by name', async () => {
    const created = await dao.createStatisticType(
      'resolution',
      'Stream resolution',
    );

    const fetched = await dao.getStatisticTypeByName('resolution');

    expect(fetched!.stream_statistic_type_id).toBe(
      created!.stream_statistic_type_id,
    );
  });

  it('should return null from getStatisticTypeById for non-existent ID', async () => {
    const fetched = await dao.getStatisticTypeById(123456);
    expect(fetched).toBeNull();
  });

  it('should throw for getStatisticTypeByName when not exists', async () => {
    await expect(async () => {
      await dao.getStatisticTypeByName('unknown');
    }).toThrow();
  });

  // -------------------------------------------------------------------------
  // GET ALL / COUNT
  // -------------------------------------------------------------------------

  it('should return all statistic types', async () => {
    await dao.createStatisticType('t1');
    await dao.createStatisticType('t2');
    await dao.createStatisticType('t3');

    const all = await dao.getAllStatisticTypes();

    expect(all.length).toBe(3);
  });

  it('should count statistic types', async () => {
    await dao.createStatisticType('t1', null);
    await dao.createStatisticType('t2', null);

    const count = await dao.countStatisticTypes();
    expect(count).toBe(2);
  });
});
