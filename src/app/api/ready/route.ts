import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureMigrations, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const root = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), "data", "uploads");
  const probe = path.join(root, "tmp", `.ready-${process.pid}-${Date.now()}`);
  try {
    const apiUrl = new URL(process.env.EYEDBOT_API_URL || "");
    const wsUrl = new URL(process.env.EYEDBOT_WS_URL || "");
    if (!["http:", "https:"].includes(apiUrl.protocol)) {
      throw new Error("EYEDBOT_API_URL debe usar HTTP o HTTPS");
    }
    if (!["ws:", "wss:"].includes(wsUrl.protocol)) {
      throw new Error("EYEDBOT_WS_URL debe usar WS o WSS");
    }
    if (!process.env.MEDIA_ENCRYPTION_KEY?.trim()) {
      throw new Error("Falta MEDIA_ENCRYPTION_KEY");
    }
    const upstreamHealth = new URL("/health", apiUrl);
    const upstreamResponse = await fetch(upstreamHealth, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!upstreamResponse.ok) {
      throw new Error(`EyedBot no está disponible (${upstreamResponse.status})`);
    }
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
