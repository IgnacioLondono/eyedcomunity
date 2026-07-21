import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readEncrypted, resolveStoragePath, storageRoot, writeAtomic } from "./storage";

describe("almacenamiento atómico", () => {
  let directory: string;
  const originalRoot = process.env.MEDIA_STORAGE_PATH;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "eyedcomun-media-"));
    process.env.MEDIA_STORAGE_PATH = directory;
  });

  afterEach(async () => {
    if (originalRoot === undefined) delete process.env.MEDIA_STORAGE_PATH;
    else process.env.MEDIA_STORAGE_PATH = originalRoot;
    await fs.rm(directory, { recursive: true, force: true });
  });

  it("publica el objeto completo sin dejar temporales", async () => {
    await writeAtomic("objects/aa/test.bin", Buffer.from("cifrado"));
    expect(await readEncrypted("objects/aa/test.bin")).toEqual(Buffer.from("cifrado"));
    const temporary = await fs.readdir(path.join(storageRoot(), "tmp"));
    expect(temporary).toEqual([]);
  });

  it("impide escapar del volumen configurado", () => {
    expect(() => resolveStoragePath("../secreto")).toThrow("Ruta de almacenamiento inválida");
  });
});
