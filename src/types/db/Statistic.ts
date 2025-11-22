export type StreamStatisticsType = {
  stream_statistic_type_id: number;
  name: string;
  description: string | null;
};

export type StreamStatisticInTime = {
  statistic_in_time_id: number;
  stream_id: number;
  stream_statistic_type_id: number;
  value: number;
  timepoint: Date;
};

export type StreamStatsInTimeCombinedWithStreamID = {
  statistic_in_time_id: number;
  stream_id: number;
  stream_statistic_type_id: number;
  statistic_type_name: string;
  statistic_type_description: string;
  value: number;
  timepoint: Date;
};

export type StreamStatsInTimeWithType = {
  p_stream_id: Number;
  p_stream_statistic_type_id: Number;
  p_start_date: Date;
  p_end_date: Date;
};
