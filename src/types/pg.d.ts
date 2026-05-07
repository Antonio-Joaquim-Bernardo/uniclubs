declare module "pg" {
  export type QueryResultRow = Record<string, unknown>;

  export interface QueryResult<T = QueryResultRow> {
    rows: T[];
  }

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
  }

  export interface PoolClient {
    query<T = QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<T = QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<QueryResult<T>>;
  }
}
