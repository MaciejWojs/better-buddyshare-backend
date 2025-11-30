import {
  StreamStatisticInTime,
  StreamStatsInTimeCombinedWithStreamID,
} from '@src/types';
import { BaseDAO } from '.';
import { IStreamStatisticsDAO } from './interfaces';
import { IDbClient } from '@src/db/interfaces';

export class StreamStatisticsDAO
  extends BaseDAO
  implements IStreamStatisticsDAO
{
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async addStreamStatistic(
    stream_id: number,
    stream_statistic_type_id: number,
    value: number,
    timepoint: Date | null,
  ): Promise<StreamStatisticInTime | null> {
    return this.executeQuery<StreamStatisticInTime>(
      'SELECT * FROM add_stream_statistic($1, $2, $3, $4)',
      [stream_id, stream_statistic_type_id, value, timepoint],
    );
  }

  async updateStreamStatisticValue(
    statistic_in_time_id: number,
    value: number,
  ): Promise<StreamStatisticInTime | null> {
    return this.executeQuery<StreamStatisticInTime>(
      'SELECT * FROM update_stream_statistic_value($1, $2)',
      [statistic_in_time_id, value],
    );
  }
  async deleteStreamStatistic(statistic_in_time_id: number): Promise<boolean> {
    return this.scalar<boolean>('SELECT delete_stream_statistic($1)', [
      statistic_in_time_id,
    ]);
  }

  async deleteStatisticsForStream(stream_id: number): Promise<number> {
    return this.scalar<number>('SELECT delete_statistics_for_stream($1)', [
      stream_id,
    ]);
  }

  async deleteStatisticsForType(
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.scalar<number>('SELECT delete_statistics_for_type($1)', [
      stream_statistic_type_id,
    ]);
  }

  async getStatisticsForStream(
    stream_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      'SELECT * FROM get_statistics_for_stream($1, $2, $3)',
      [stream_id, limit, offset],
    );
  }

  async getStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      'SELECT * FROM get_statistics_for_stream_and_type($1, $2, $3, $4)',
      [stream_id, stream_statistic_type_id, limit, offset],
    );
  }

  async getStatisticsForStreamByDateRange(
    stream_id: number,
    start_date: Date,
    end_date: Date,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      'SELECT * FROM get_statistics_for_stream_by_date_range($1, $2, $3, $4, $5)',
      [stream_id, start_date, end_date, limit, offset],
    );
  }

  async getLatestStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      'SELECT * FROM get_latest_statistic_for_stream_and_type($1, $2)',
      [stream_id, stream_statistic_type_id],
    );
  }

  async countStatisticsForStream(stream_id: number): Promise<number> {
    return this.scalar<number>('SELECT count_statistics_for_stream($1)', [
      stream_id,
    ]);
  }

  async deleteOldStatisticsForStream(
    stream_id: number,
    olderThan: Date,
  ): Promise<number> {
    return this.scalar<number>(
      'SELECT delete_old_statistics_for_stream($1, $2) AS deleted_count',
      [stream_id, olderThan],
    );
  }
}
