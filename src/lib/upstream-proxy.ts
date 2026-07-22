import "server-only";

/**
 * Reenvía un body upstream sin propagar cortes de socket (UND_ERR_SOCKET)
 * como "failed to pipe response" en Next.js.
 */
export function safeProxyBody(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  return new ReadableStream({
    async pull(controller) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => undefined);
        controller.close();
        return;
      }
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch {
        // EyedBot o el túnel cerraron la conexión; cerramos limpio.
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      return reader.cancel().catch(() => undefined);
    },
  });
}

export function isAbortLike(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "code" in error ? String(error.code) : "";
  return name === "AbortError" || code === "ABORT_ERR" || code === "UND_ERR_SOCKET";
}
