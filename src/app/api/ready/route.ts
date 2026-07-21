import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureMigrations, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const root = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), "data", "uploads");
  const probe = path.join(root, "tmp", `.ready-${process.pid}-${Date.now()}`);
  try {
    await ensureMigrations();
    await getPool().query("SELECT 1");
    await fs.mkdir(path.dirname(probe), { recursive: true });
    await fs.writeFile(probe, "ok", { flag: "wx", mode: 0o600 });
    await fs.unlink(probe);
    return Response.json({ status: "ready" });
  } catch (error) {
    await fs.rm(probe, { force: true }).catch(() => undefined);
    return Response.json(
      { status: "not_ready", error: error instanceof Error ? error.message : "unknown" },
      { status: 503 },
    );
  }
}
