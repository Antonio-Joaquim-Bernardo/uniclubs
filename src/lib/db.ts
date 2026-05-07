import { Pool } from "pg";
import type { QueryResultRow } from "pg";

type GlobalPool = typeof globalThis & {
  __uniclubsPool?: Pool;
};

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const globalForPool = globalThis as GlobalPool;

export const pool =
  hasDatabaseUrl
    ? globalForPool.__uniclubsPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
      })
    : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForPool.__uniclubsPool = pool;
}

export async function query<T = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  if (!pool) {
    throw new Error("DATABASE_URL nao configurado.");
  }

  return pool.query<T>(text, params);
}
