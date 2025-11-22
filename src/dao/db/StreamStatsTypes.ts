import { BaseDAO } from '@src/dao';
import { IStreamStatsDAO } from './interfaces';
import { StreamStatisticsType } from '@src/types';
import { sql } from 'bun';

export class StreamStatsTypesDAO extends BaseDAO implements IStreamStatsDAO {
  private static instance: StreamStatsTypesDAO;

  private constructor() {
    super();
  }

  public static getInstance(): StreamStatsTypesDAO {
    if (!this.instance) {
      this.instance = new StreamStatsTypesDAO();
    }
    return this.instance;
  }

  async createStatisticType(
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      () => sql`
        SELECT
          *
        FROM
          create_statistic_type (
            ${name},
            ${description}
          )
      `,
    );
  }

  async updateStatisticType(
    stream_statistic_type_id: number,
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      () => sql`
        SELECT
          *
        FROM
          update_statistic_type (
            ${stream_statistic_type_id},
            ${name},
            ${description}
          )
      `,
    );
  }

  async deleteStatisticTypeById(
    stream_statistic_type_id: number,
  ): Promise<boolean> {
    return this.getPrimitiveFromQuery<boolean>(
      () => sql`
        SELECT
          delete_statistic_type (${stream_statistic_type_id}) AS deleted
      `,
    );
  }

  async getAllStatisticTypes(): Promise<StreamStatisticsType[]> {
    return this.executeQueryMultiple<StreamStatisticsType>(
      () => sql`
        SELECT
          *
        FROM
          get_all_statistic_types ()
      `,
    );
  }
  async getStatisticTypeById(
    stream_statistic_type_id: number,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      () => sql`
        SELECT
          *
        FROM
          get_statistic_type_by_id (${stream_statistic_type_id})
      `,
    );
  }

  async statisticTypeExistsById(
    stream_statistic_type_id: number,
  ): Promise<boolean> {
    return this.getPrimitiveFromQuery<boolean>(
      () => sql`
        SELECT
          statistic_type_exists_by_id (${stream_statistic_type_id}) AS EXISTS
      `,
    );
  }

  async statisticTypeExistsByName(name: string): Promise<boolean> {
    return this.getPrimitiveFromQuery<boolean>(
      () => sql`
        SELECT
          statistic_type_exists_by_name (${name}) AS EXISTS
      `,
    );
  }
  async getStatisticTypeByName(
    name: string,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      () => sql`
        SELECT
          *
        FROM
          get_statistic_type_by_name (${name})
      `,
    );
  }
  async countStatisticTypes(): Promise<number> {
    return this.getPrimitiveFromQuery<number>(
      () => sql`
        SELECT
          count_statistic_types () AS count
      `,
    );
  }
}
