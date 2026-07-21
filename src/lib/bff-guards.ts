export class ApiAccessError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiAccessError";
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== configuredOrigin) {
    throw new ApiAccessError("Origen de solicitud no permitido", 403);
  }
}
