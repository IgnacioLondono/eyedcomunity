import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "eyedcomun",
    user: process.env.DB_USER || "eyedcomun",
    password: process.env.DB_PASSWORD || "",
  },
  strict: true,
  verbose: true,
});
