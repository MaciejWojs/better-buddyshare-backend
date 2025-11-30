import { BaseDAO } from '@src/dao';
import { IStreamStatsDAO } from './interfaces';
import { StreamStatisticsType } from '@src/types';
import { IDbClient } from '@src/db/interfaces';

export class StreamStatsTypesDAO extends BaseDAO implements IStreamStatsDAO {
  public constructor(dbClient: IDbClient) {
    super(dbClient);
  }

  async createStatisticType(
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      'SELECT * FROM create_statistic_type($1, $2)',
      [name, description],
    );
  }

  async updateStatisticType(
    stream_statistic_type_id: number,
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      'SELECT * FROM update_statistic_type($1, $2, $3)',
      [stream_statistic_type_id, name, description],
    );
  }

  async deleteStatisticTypeById(
    stream_statistic_type_id: number,
  ): Promise<boolean> {
    return this.scalar<boolean>('SELECT delete_statistic_type($1) AS deleted', [
      stream_statistic_type_id,
    ]);
  }

  async getAllStatisticTypes(): Promise<StreamStatisticsType[]> {
    return this.executeQueryMultiple<StreamStatisticsType>(
      'SELECT * FROM get_all_statistic_types()',
      [],
    );
  }
  async getStatisticTypeById(
    stream_statistic_type_id: number,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      'SELECT * FROM get_statistic_type_by_id($1)',
      [stream_statistic_type_id],
    );
  }

  async statisticTypeExistsById(
    stream_statistic_type_id: number,
  ): Promise<boolean> {
    return this.scalar<boolean>(
      'SELECT statistic_type_exists_by_id($1) AS EXISTS',
      [stream_statistic_type_id],
    );
  }

  async statisticTypeExistsByName(name: string): Promise<boolean> {
    return this.scalar<boolean>(
      'SELECT statistic_type_exists_by_name($1) AS EXISTS',
      [name],
    );
  }
  async getStatisticTypeByName(
    name: string,
  ): Promise<StreamStatisticsType | null> {
    return this.executeQuery<StreamStatisticsType>(
      'SELECT * FROM get_statistic_type_by_name($1)',
      [name],
    );
  }
  async countStatisticTypes(): Promise<number> {
    return this.scalar<number>('SELECT count_statistic_types() AS count', []);
  }
}
