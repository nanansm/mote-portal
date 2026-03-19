import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";
import { ENV } from "./env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const pool = mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool, { schema, mode: "default" });
  }
  return _db;
}

export { schema };
