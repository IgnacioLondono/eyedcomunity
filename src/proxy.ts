import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCommunitySettings } from "@/lib/eyedbot-api";
import type { CommunityFeatureKey } from "@/lib/types";

const featurePaths: Array<[string, CommunityFeatureKey]> = [
  ["/activity", "activity"],
  ["/achievements", "achievements"],
  ["/wrapped", "wrapped"],
  ["/server", "server"],
  ["/lobby", "lobby"],
  ["/members", "lobby"],
  ["/ranking", "ranking"],
  ["/circle", "circle"],
  ["/plans", "plans"],
  ["/party", "party"],
  ["/challenges", "challenges"],
];

export const proxy = auth(async (request) => {
  const userId = request.auth?.user?.id;
  if (!userId) return NextResponse.redirect(new URL("/", request.url));
  const response = await getCommunitySettings(userId).catch(() => null);
  if (!response) return NextResponse.next();
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin")) {
    return response.isAdmin
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/feature-disabled", request.url));
  }
  if (response.settings.maintenance && !response.isAdmin) {
    return NextResponse.redirect(new URL("/feature-disabled?maintenance=1", request.url));
  }
  const feature = featurePaths.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1];
  if (feature && response.settings.features[feature] === false && !response.isAdmin) {
    return NextResponse.redirect(new URL(`/feature-disabled?feature=${feature}`, request.url));
  }
  return NextResponse.next();
});

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
    "/admin/:path*",
  ],
};
