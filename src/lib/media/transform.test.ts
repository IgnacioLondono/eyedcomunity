import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MediaValidationError, transformImage } from "./transform";

describe("normalización de imágenes", () => {
  it("elimina el original y produce un avatar WebP 256x256", async () => {
    const png = await sharp({
      create: { width: 600, height: 400, channels: 3, background: "#7950c8" },
    }).png().toBuffer();
    const result = await transformImage(new File([png], "avatar.png", { type: "image/png" }), "avatar");
    expect(result.mimeType).toBe("image/webp");
    expect(result.width).toBe(256);
    expect(result.height).toBe(256);
    expect((await sharp(result.data).metadata()).format).toBe("webp");
  });

  it("rechaza SVG aunque el navegador indique que es una imagen", async () => {
    const svg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      "ataque.svg",
      { type: "image/svg+xml" },
    );
    await expect(transformImage(svg, "circle")).rejects.toBeInstanceOf(MediaValidationError);
  });

  it("rechaza cargas superiores a 8 MB antes de procesarlas", async () => {
    const oversized = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "grande.png");
    await expect(transformImage(oversized, "banner")).rejects.toThrow("8 MB");
  });
});
