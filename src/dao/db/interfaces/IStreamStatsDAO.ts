import { StreamStatisticsType } from '@src/types';

export interface IStreamStatsDAO {
  statisticTypeExistsById(stream_statistic_type_id: number): Promise<boolean>;
  createStatisticType(
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null>;
  updateStatisticType(
    stream_statistic_type_id: number,
    name: string,
    description: string | null,
  ): Promise<StreamStatisticsType | null>;
  deleteStatisticTypeById(stream_statistic_type_id: number): Promise<boolean>;
  getAllStatisticTypes(): Promise<StreamStatisticsType[]>;
  getStatisticTypeById(
    stream_statistic_type_id: number,
  ): Promise<StreamStatisticsType | null>;

  statisticTypeExistsByName(name: string): Promise<boolean>;
  getStatisticTypeByName(name: string): Promise<StreamStatisticsType | null>;
  countStatisticTypes(): Promise<number>;
}
