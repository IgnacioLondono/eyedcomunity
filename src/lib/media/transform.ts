import "server-only";

import sharp from "sharp";

export type MediaPurpose = "avatar" | "banner" | "circle";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export class MediaValidationError extends Error {}

export async function transformImage(file: File, purpose: MediaPurpose) {
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new MediaValidationError("La imagen debe pesar entre 1 byte y 8 MB");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const source = sharp(input, {
    failOn: "warning",
    limitInputPixels: 40_000_000,
    animated: false,
  });
  const metadata = await source.metadata().catch(() => null);
  if (
    !metadata?.format ||
    !ALLOWED_FORMATS.has(metadata.format) ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 8_000 ||
    metadata.height > 8_000 ||
    (metadata.pages || 1) !== 1
  ) {
    throw new MediaValidationError("Formato o dimensiones de imagen no permitidos");
  }

  let pipeline = source.rotate();
  if (purpose === "avatar") {
    pipeline = pipeline.resize(256, 256, { fit: "cover", position: "centre" });
  } else if (purpose === "banner") {
    pipeline = pipeline.resize(1200, 400, { fit: "cover", position: "centre" });
  } else {
    pipeline = pipeline.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
  }

  const quality = purpose === "avatar" ? 80 : purpose === "banner" ? 75 : 72;
  const { data, info } = await pipeline
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    mimeType: "image/webp" as const,
    width: info.width,
    height: info.height,
  };
}
