import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { currentKeyVersion, decryptMedia, encryptMedia } from "./crypto";

const context = {
  id: "9bdd2cc8-b695-4dc8-993a-30cc668309d2",
  ownerId: "123456789012345678",
  purpose: "avatar",
  mimeType: "image/webp",
  keyVersion: 1,
};

describe("cifrado de medios", () => {
  const originalKey = process.env.MEDIA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.MEDIA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.MEDIA_ENCRYPTION_KEY_VERSION = "1";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.MEDIA_ENCRYPTION_KEY;
    else process.env.MEDIA_ENCRYPTION_KEY = originalKey;
  });

  it("recupera exactamente el contenido con AES-256-GCM", () => {
    const plaintext = Buffer.from("contenido privado de EyedComun");
    const encrypted = encryptMedia(plaintext, context);
    expect(currentKeyVersion()).toBe(1);
    expect(encrypted.nonce).toHaveLength(12);
    expect(encrypted.authTag).toHaveLength(16);
    expect(decryptMedia(encrypted.ciphertext, context, encrypted.nonce, encrypted.authTag)).toEqual(plaintext);
  });

  it("detecta cualquier manipulación del archivo", () => {
    const encrypted = encryptMedia(Buffer.from("imagen"), context);
    encrypted.ciphertext[0] ^= 1;
    expect(() => decryptMedia(encrypted.ciphertext, context, encrypted.nonce, encrypted.authTag)).toThrow();
  });

  it("vincula el cifrado al propietario mediante AAD", () => {
    const encrypted = encryptMedia(Buffer.from("imagen"), context);
    expect(() => decryptMedia(
      encrypted.ciphertext,
      { ...context, ownerId: "999999999999999999" },
      encrypted.nonce,
      encrypted.authTag,
    )).toThrow();
  });
});
