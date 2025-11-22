import { StreamStatsInTimeWithType } from '@src/types';

export interface IStreamAnalyticsDAO {
  getAverageStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number>;
  getMaxStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number>;
  getMinStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number>;
  getSumStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<number>;

  getHourlyStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    start_date: Date,
    end_date: Date,
  ): Promise<StreamStatsInTimeWithType[]>;
  getDailyStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    start_date: Date,
    end_date: Date,
  ): Promise<StreamStatsInTimeWithType[]>;
  getTopStreamsByStatisticType(
    stream_statistic_type_id: number,
    limit: number,
    start_date: Date | null,
    end_date: Date | null,
  ): Promise<StreamStatsInTimeWithType[]>;
}
