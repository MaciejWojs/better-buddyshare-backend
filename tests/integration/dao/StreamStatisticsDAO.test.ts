import { StreamStatisticsDAO, StreamsDAO, UserDAO } from '@src/dao';
import { sql } from 'bun';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { StreamStatsTypesDAO } from '../../../src/dao/db/StreamStatsTypes';

const dao = StreamStatisticsDAO.getInstance();

let testStreamId: number;
let testStatisticTypeId: number;
let streamDao = StreamsDAO.getInstance();
let userDao = UserDAO.getInstance();
let streamStatsTypesDAO = StreamStatsTypesDAO.getInstance();

beforeAll(async () => {
  const user = await userDao.createUser(
    'test_user_stats_dao',
    'daoUser@example.com',
    'pass',
  );
  await userDao.updateStreamToken(user!.user_id);
  const stream = await streamDao.createStream(
    user!.user_id,
    'Test Stream',
    'This is a test stream',
  );
  testStreamId = stream!.stream_id;

  // Tworzymy testowy typ statystyki
  const statType = await streamStatsTypesDAO.createStatisticType(
    'Test Statistic Type',
    'Description for test statistic type',
  );
  testStatisticTypeId = statType!.stream_statistic_type_id;
});

afterAll(async () => {
  // Sprzątanie: usuwamy testowy stream i typ
  await sql`
    DELETE FROM streams
    WHERE
      stream_id = ${testStreamId}
  `;
  await sql`
    DELETE FROM stream_statistics_types
    WHERE
      stream_statistic_type_id = ${testStatisticTypeId}
  `;
});

afterEach(async () => {
  // Sprzątanie po każdym teście
  await sql`
    DELETE FROM stream_statistics_in_time
    WHERE
      stream_id = ${testStreamId}
  `;
});

describe('StreamStatisticsDAO Integration Tests', () => {
  it('should add a new stream statistic', async () => {
    const stat = await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      42,
      new Date(),
    );
    expect(stat).toHaveProperty('statistic_in_time_id');
    expect(stat?.value).toBe(42);
  });

  it('should update a stream statistic value', async () => {
    const stat = await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      10,
      new Date(),
    );
    const updated = await dao.updateStreamStatisticValue(
      stat!.statistic_in_time_id,
      20,
    );
    expect(updated?.value).toBe(20);
  });

  it('should delete a stream statistic', async () => {
    const stat = await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      15,
      new Date(),
    );
    const result = await dao.deleteStreamStatistic(stat!.statistic_in_time_id);
    expect(result).toBe(true);
  });

  it('should get statistics for stream', async () => {
    await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      5,
      new Date(),
    );
    const stats = await dao.getStatisticsForStream(testStreamId, null, null);
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].stream_id).toBe(testStreamId);
  });

  it('should get statistics for stream and type', async () => {
    await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      5,
      new Date(),
    );
    const stats = await dao.getStatisticsForStreamAndType(
      testStreamId,
      testStatisticTypeId,
      null,
      null,
    );
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0].stream_statistic_type_id).toBe(testStatisticTypeId);
  });

  it('should count statistics for stream', async () => {
    await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      5,
      new Date(),
    );
    const count = await dao.countStatisticsForStream(testStreamId);
    expect(count).toBeGreaterThan(0);
  });

  it('should delete old statistics for stream', async () => {
    await dao.addStreamStatistic(
      testStreamId,
      testStatisticTypeId,
      50,
      new Date('2000-01-01'),
    );
    const deletedCount = await dao.deleteOldStatisticsForStream(
      testStreamId,
      new Date('2010-01-01'),
    );
    expect(deletedCount).toBe(1);
  });
});
