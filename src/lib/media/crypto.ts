import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptionContext = {
  id: string;
  ownerId: string;
  purpose: string;
  mimeType: string;
  keyVersion: number;
};

function getMasterKey() {
  const encoded = process.env.MEDIA_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Falta MEDIA_ENCRYPTION_KEY");
  const key = /^[a-f0-9]{64}$/i.test(encoded)
    ? Buffer.from(encoded, "hex")
    : Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("MEDIA_ENCRYPTION_KEY debe contener exactamente 32 bytes");
  return key;
}

export function currentKeyVersion() {
  const version = Number(process.env.MEDIA_ENCRYPTION_KEY_VERSION || 1);
  if (!Number.isSafeInteger(version) || version < 1) throw new Error("Versión de cifrado inválida");
  return version;
}

export function mediaAad(context: EncryptionContext) {
  return Buffer.from(
    `eyedcomun-media|${context.keyVersion}|${context.id}|${context.ownerId}|${context.purpose}|${context.mimeType}`,
    "utf8",
  );
}

export function encryptMedia(plaintext: Buffer, context: EncryptionContext) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getMasterKey(), nonce);
  cipher.setAAD(mediaAad(context));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, nonce, authTag: cipher.getAuthTag() };
}

export function decryptMedia(
  ciphertext: Buffer,
  context: EncryptionContext,
  nonce: Buffer,
  authTag: Buffer,
) {
  if (context.keyVersion !== currentKeyVersion()) {
    throw new Error(`No está disponible la clave de medios v${context.keyVersion}`);
  }
  if (nonce.length !== 12 || authTag.length !== 16) throw new Error("Metadatos criptográficos inválidos");
  const decipher = createDecipheriv("aes-256-gcm", getMasterKey(), nonce);
  decipher.setAAD(mediaAad(context));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
