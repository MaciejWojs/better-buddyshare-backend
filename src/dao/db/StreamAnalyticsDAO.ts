import { StreamStatsInTimeWithType } from '@src/types';
import { BaseDAO } from './BaseDao';
import { IStreamAnalyticsDAO } from './interfaces/IStreamAnalyticsDAO';
import { IDbClient } from '@src/db/interfaces';

export class StreamAnalyticsDAO extends BaseDAO implements IStreamAnalyticsDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }
  async getAverageStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.scalar(
      'select * from get_average_statistic_for_stream_and_type($1, $2)',
      [stream_id, stream_statistic_type_id],
    );
  }
  async getMaxStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.scalar(
      'select * from get_max_statistic_for_stream_and_type($1, $2)',
      [stream_id, stream_statistic_type_id],
    );
  }
  async getMinStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.scalar(
      'select * from get_min_statistic_for_stream_and_type($1, $2)',
      [stream_id, stream_statistic_type_id],
    );
  }
  async getSumStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.scalar(
      'select * from get_sum_statistic_for_stream_and_type($1, $2)',
      [stream_id, stream_statistic_type_id],
    );
  }
  async getHourlyStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    start_date: Date,
    end_date: Date,
  ): Promise<StreamStatsInTimeWithType[]> {
    return this.executeQueryMultiple<StreamStatsInTimeWithType>(
      'select * from get_hourly_statistics_for_stream_and_type($1, $2, $3, $4)',
      [stream_id, stream_statistic_type_id, start_date, end_date],
    );
  }
  async getDailyStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    start_date: Date,
    end_date: Date,
  ): Promise<StreamStatsInTimeWithType[]> {
    return this.executeQueryMultiple<StreamStatsInTimeWithType>(
      'select * from get_daily_statistics_for_stream_and_type($1, $2, $3, $4)',
      [stream_id, stream_statistic_type_id, start_date, end_date],
    );
  }
  async getTopStreamsByStatisticType(
    stream_statistic_type_id: number,
    limit: number,
    start_date: Date | null,
    end_date: Date | null,
  ): Promise<StreamStatsInTimeWithType[]> {
    return this.executeQueryMultiple<StreamStatsInTimeWithType>(
      'select * from get_top_streams_by_statistic_type($1, $2, $3, $4)',
      [stream_statistic_type_id, limit, start_date, end_date],
    );
  }
}
