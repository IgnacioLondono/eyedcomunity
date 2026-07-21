export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DB_HOST) {
    const { ensureMigrations } = await import("@/lib/db");
    await ensureMigrations();
    const { cleanupAbandonedMedia } = await import("@/lib/media/service");
    await cleanupAbandonedMedia();
  }
}
