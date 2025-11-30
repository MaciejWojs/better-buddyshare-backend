export interface IDbClient {
  query<T = any>(query: string, params?: any[]): Promise<T[]>;
  querySingle<T = any>(query: string, params?: any[]): Promise<T | null>;
  queryMultiple<T = any>(query: string, params?: any[]): Promise<T[]>;
}
