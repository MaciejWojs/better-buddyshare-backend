import {
  StreamStatisticInTime,
  StreamStatsInTimeCombinedWithStreamID,
} from '@src/types';
import { BaseDAO } from '.';
import { IStreamStatisticsDAO } from './interfaces';
import { sql } from 'bun';

export class StreamStatisticsDAO
  extends BaseDAO
  implements IStreamStatisticsDAO {

  private constructor() {
    super();
  }

  async addStreamStatistic(
    stream_id: number,
    stream_statistic_type_id: number,
    value: number,
    timepoint: Date | null,
  ): Promise<StreamStatisticInTime | null> {
    return this.executeQuery<StreamStatisticInTime>(
      () => sql`
        SELECT
          *
        FROM
          add_stream_statistic (
            ${stream_id},
            ${stream_statistic_type_id},
            ${value},
            ${timepoint}
          )
      `,
    );
  }

  async updateStreamStatisticValue(
    statistic_in_time_id: number,
    value: number,
  ): Promise<StreamStatisticInTime | null> {
    return this.executeQuery<StreamStatisticInTime>(
      () => sql`
        SELECT
          *
        FROM
          update_stream_statistic_value (
            ${statistic_in_time_id},
            ${value}
          )
      `,
    );
  }
  async deleteStreamStatistic(statistic_in_time_id: number): Promise<boolean> {
    return this.getPrimitiveFromQuery<boolean>(
      () => sql`
        SELECT
          delete_stream_statistic (${statistic_in_time_id})
      `,
    );
  }

  async deleteStatisticsForStream(stream_id: number): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          delete_statistics_for_stream (${stream_id})
      `,
    );
  }

  async deleteStatisticsForType(
    stream_statistic_type_id: number,
  ): Promise<number> {
    return this.getPrimitiveFromQuery(
      () => sql`
        SELECT
          delete_statistics_for_type (${stream_statistic_type_id})
      `,
    );
  }

  async getStatisticsForStream(
    stream_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      () => sql`
        SELECT
          *
        FROM
          get_statistics_for_stream (
            ${stream_id},
            ${limit},
            ${offset}
          )
      `,
    );
  }

  async getStatisticsForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
    limit: number | null,
    offset: number | null,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      () => sql`
        SELECT
          *
        FROM
          get_statistics_for_stream_and_type (
            ${stream_id},
            ${stream_statistic_type_id},
            ${limit},
            ${offset}
          )
      `,
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
      () => sql`
        SELECT
          *
        FROM
          get_statistics_for_stream_by_date_range (
            ${stream_id},
            ${start_date},
            ${end_date},
            ${limit},
            ${offset}
          )
      `,
    );
  }

  async getLatestStatisticForStreamAndType(
    stream_id: number,
    stream_statistic_type_id: number,
  ): Promise<StreamStatsInTimeCombinedWithStreamID[]> {
    return this.executeQueryMultiple<StreamStatsInTimeCombinedWithStreamID>(
      () => sql`
        SELECT
          *
        FROM
          get_latest_statistic_for_stream_and_type (
            ${stream_id},
            ${stream_statistic_type_id}
          )
      `,
    );
  }

  async countStatisticsForStream(stream_id: number): Promise<number> {
    return this.getPrimitiveFromQuery<number>(
      () => sql`
        SELECT
          count_statistics_for_stream (${stream_id})
      `,
    );
  }

  async deleteOldStatisticsForStream(
    stream_id: number,
    olderThan: Date,
  ): Promise<number> {
    return this.getPrimitiveFromQuery<number>(
      () => sql`
        SELECT
          delete_old_statistics_for_stream (
            ${stream_id},
            ${olderThan}
          ) AS deleted_count
      `,
    );
  }
}
