import {
  StreamStatisticInTime,
  StreamStatsInTimeCombinedWithStreamID,
} from '@src/types';

export interface IStreamStatisticsDAO {
  addStreamStatistic(
    stream_id: number,
    stream_statistic_type_id: number,
    value: number,
    timepoint: Date | null,
  ): Promise<StreamStatisticInTime | null>;
  updateStreamStatisticValue(
    statistic_in_time_id: number,
    value: number,
  ): Promise<StreamStatisticInTime | null>;
  deleteStreamStatistic(statistic_in_time_id: number): Promise<boolean>;
  deleteStatisticsForStream(stream_id: number): Promise<number>;
  deleteStatisticsForType(stream_statistic_type_id: number): Promise<number>;

  getStatisticsForStream(
    stream_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]>;
  getStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]>;
  getStatisticsForStreamByDateRange(
    stream_id: number,
    start_date: Date,
    end_date: Date,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]>;
  getLatestStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]>;

  countStatisticsForStream(stream_id: number): Promise<number>;
  deleteOldStatisticsForStream(
    stream_id: number,
    olderThan: Date,
  ): Promise<number>;
}
