export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "eyedcomun",
    time: new Date().toISOString(),
  });
}
