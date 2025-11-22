export type StreamStatsInTimeCombinedWithStreamID = {
  statistic_in_time_id: number;
  stream_id: number;
  stream_statistic_type_id: number;
  statistic_type_name: string;
  statistic_type_description: string;
  value: number;
  timepoint: Date;
};
