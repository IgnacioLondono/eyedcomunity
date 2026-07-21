import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import * as schema from "./schema";

declare global {
  var eyedComunPool: Pool | undefined;
  var eyedComunMigrations: Promise<void> | undefined;
}

function config() {
  const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Falta la variable ${key}`);
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "Z",
    enableKeepAlive: true,
    multipleStatements: true,
  };
}

export function getPool() {
  if (!global.eyedComunPool) global.eyedComunPool = mysql.createPool(config());
  return global.eyedComunPool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}

export async function ensureMigrations() {
  if (!global.eyedComunMigrations) {
    global.eyedComunMigrations = migrate().catch((error) => {
      global.eyedComunMigrations = undefined;
      throw error;
    });
  }
  return global.eyedComunMigrations;
}

async function migrate() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS eyedcomun_migrations (
      name varchar(255) PRIMARY KEY,
      checksum char(64) NOT NULL,
      applied_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const directory = path.join(process.cwd(), "drizzle");
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const name of files) {
    const sql = await fs.readFile(path.join(directory, name), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const [rows] = await pool.query<Array<RowDataPacket & { checksum: string }>>(
      "SELECT checksum FROM eyedcomun_migrations WHERE name = ?",
      [name],
    );
    if (rows[0]) {
      if (rows[0].checksum !== checksum) throw new Error(`La migración aplicada ${name} fue modificada`);
      continue;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.query(
        "INSERT INTO eyedcomun_migrations (name, checksum) VALUES (?, ?)",
        [name, checksum],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
