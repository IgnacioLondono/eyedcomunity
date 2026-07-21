export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activity/:path*",
    "/achievements/:path*",
    "/server/:path*",
    "/lobby/:path*",
    "/members/:path*",
    "/ranking/:path*",
    "/circle/:path*",
    "/plans/:path*",
    "/party/:path*",
    "/challenges/:path*",
    "/roadmap/:path*",
    "/wrapped/:path*",
  ],
};
