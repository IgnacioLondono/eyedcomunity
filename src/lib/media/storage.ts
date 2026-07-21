import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export function storageRoot() {
  if (process.env.NODE_ENV !== "production" && process.env.MEDIA_STORAGE_PATH) {
    return process.env.MEDIA_STORAGE_PATH;
  }
  return process.env.NODE_ENV === "production"
    ? "/app/uploads"
    : path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "uploads");
}

export function objectPath(id: string) {
  const compact = id.replaceAll("-", "");
  return path.join("objects", compact.slice(0, 2), compact.slice(2, 4), `${id}.bin`);
}

export function resolveStoragePath(relativePath: string) {
  if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes("..")) {
    throw new Error("Ruta de almacenamiento inválida");
  }
  return path.join(/*turbopackIgnore: true*/ storageRoot(), relativePath);
}

export async function writeAtomic(relativePath: string, data: Buffer) {
  const destination = resolveStoragePath(relativePath);
  const temporaryDirectory = path.join(/*turbopackIgnore: true*/ storageRoot(), "tmp");
  const temporary = path.join(/*turbopackIgnore: true*/ temporaryDirectory, `${path.basename(relativePath)}.${process.pid}.${Date.now()}.tmp`);
  await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o750 });
  await fs.mkdir(temporaryDirectory, { recursive: true, mode: 0o750 });
  try {
    await fs.writeFile(temporary, data, { flag: "wx", mode: 0o600 });
    await fs.rename(temporary, destination);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

export function readEncrypted(relativePath: string) {
  return fs.readFile(resolveStoragePath(relativePath));
}

export function removeEncrypted(relativePath: string) {
  return fs.rm(resolveStoragePath(relativePath), { force: true });
}

export async function cleanupTemporaryFiles(maxAgeMs = 60 * 60 * 1000) {
  const directory = path.join(/*turbopackIgnore: true*/ storageRoot(), "tmp");
  await fs.mkdir(directory, { recursive: true, mode: 0o750 });
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const threshold = Date.now() - maxAgeMs;
  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile()) return;
    const file = path.join(/*turbopackIgnore: true*/ directory, entry.name);
    const stat = await fs.stat(file);
    if (stat.mtimeMs < threshold) await fs.rm(file, { force: true });
  }));
}
