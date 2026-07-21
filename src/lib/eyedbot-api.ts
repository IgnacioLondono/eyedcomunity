import "server-only";

import { z } from "zod";
import { IS_DEMO_MODE } from "./demo";
import type {
  CommunityMemberProfile,
  CommunityMemberSummary,
  CommunityProfile,
  CommunityServer,
  CommunityWrapped,
} from "./types";

const snowflake = z.string().regex(/^\d{10,25}$/);

export class EyedBotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  const baseUrl = process.env.EYEDBOT_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.COMMUNITY_API_KEY || process.env.EYEDBOT_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new EyedBotApiError("La API comunitaria no está configurada", 503);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  }).catch((error) => {
    throw new EyedBotApiError(
      error instanceof Error ? error.message : "EyedBot no está disponible",
      503,
    );
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new EyedBotApiError(body?.error || "No se pudo consultar EyedBot", response.status);
  }

  return (await response.json()) as T;
}

function userPath(userId: string) {
  return encodeURIComponent(snowflake.parse(userId));
}

export function getCommunityProfile(userId: string) {
  if (IS_DEMO_MODE) return Promise.resolve(demoProfile(userId));
  return request<CommunityProfile>(`/api/community/profile/${userPath(userId)}`);
}

export function getCommunityServer(userId: string) {
  if (IS_DEMO_MODE) return Promise.resolve(demoServer());
  return request<CommunityServer>(`/api/community/server?userId=${userPath(userId)}`);
}

export function getCommunityWrapped(userId: string, year: number) {
  const safeYear = Math.max(2020, Math.min(new Date().getUTCFullYear(), Math.trunc(year)));
  if (IS_DEMO_MODE) return Promise.resolve(demoWrapped(userId, safeYear));
  return request<CommunityWrapped>(
    `/api/community/wrapped/${userPath(userId)}/${safeYear}`,
  );
}

export function getCommunityMembers(viewerId: string) {
  if (IS_DEMO_MODE) return Promise.resolve(demoMembers());
  return request<{ members: CommunityMemberSummary[] }>(
    `/api/community/members?userId=${userPath(viewerId)}`,
  ).then((result) => result.members);
}

export function getCommunityMember(viewerId: string, memberId: string) {
  if (IS_DEMO_MODE) return Promise.resolve(demoMemberProfile(memberId));
  return request<CommunityMemberProfile>(
    `/api/community/member/${userPath(memberId)}?userId=${userPath(viewerId)}`,
  );
}

function demoProfile(userId: string): CommunityProfile {
  return {
    user: {
      id: userId,
      username: "nova",
      displayName: "Nova",
      avatarUrl: null,
      joinedAt: "2025-02-14T18:30:00.000Z",
    },
    stats: {
      xp: 128_460,
      level: 42,
      messages: 18_729,
      voiceMinutes: 8_340,
      rank: 3,
      memberCount: 2_847,
    },
    gacha: {
      coins: 24_850,
      collectionSize: 86,
      pulls: 412,
      bestRarity: "SSR",
    },
    activity: [],
  };
}

function demoServer(): CommunityServer {
  const today = new Date();
  const daily = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (29 - index));
    return {
      date: date.toISOString().slice(0, 10),
      messages: 420 + ((index * 137) % 690),
      voiceMinutes: 180 + ((index * 83) % 410),
      joins: 2 + (index % 8),
      leaves: index % 4,
    };
  });
  const names = ["Luna", "Kai", "Nova", "Mika", "Dante", "Ari", "Nox"];
  return {
    guild: {
      id: "1428561902086262908",
      name: "EyedComun",
      iconUrl: null,
      memberCount: 2_847,
      onlineCount: 638,
    },
    totals: {
      messages: 1_284_920,
      voiceMinutes: 384_650,
      joins: 3_210,
      leaves: 363,
    },
    trackingStartedAt: "2025-01-01T00:00:00.000Z",
    daily,
    leaderboard: names.map((displayName, index) => ({
      userId: `3997403581013033${String(16 + index)}`,
      displayName,
      avatarUrl: null,
      xp: 198_500 - index * 19_430,
      level: 51 - index * 3,
      messages: 28_400 - index * 2_350,
      voiceMinutes: 12_800 - index * 940,
    })),
  };
}

function demoWrapped(userId: string, year: number): CommunityWrapped {
  return {
    year,
    availableFrom: `${year}-01-01`,
    isCompletePeriod: year < new Date().getUTCFullYear(),
    user: demoProfile(userId).user,
    stats: {
      messages: 18_729,
      voiceMinutes: 8_340,
      xpEarned: 94_280,
      activeDays: 286,
      favoriteDay: "18 de octubre",
      monthly: [920, 1140, 1280, 1090, 1430, 1510, 1620, 1760, 1840, 2210, 1090, 839].map((messages, index) => ({
        month: index + 1,
        messages,
        voiceMinutes: 480 + ((index * 173) % 620),
        xpEarned: 5_800 + ((index * 1_337) % 5_100),
      })),
      rank: 3,
    },
    highlights: [
      "Estuviste entre el 1% de miembros más activos.",
      "Tu mes favorito fue octubre, con 2.840 mensajes.",
      "Compartiste más de 139 horas en canales de voz.",
    ],
  };
}

function demoMembers(): CommunityMemberSummary[] {
  const names = ["Luna", "Kai", "Nova", "Mika", "Dante", "Ari", "Nox", "Sora", "Iris", "Leo", "Vega", "Alex"];
  const activities = ["Visual Studio Code", "Spotify", "EyedParty", null, "Minecraft", "Spotify", null, "VALORANT", null, "YouTube", "EyedParty", null];
  const statuses: CommunityMemberSummary["status"][] = ["online", "online", "online", "idle", "dnd", "online", "offline", "online", "idle", "online", "dnd", "offline"];
  return names.map((displayName, index) => ({
    id: `3997403581013033${String(16 + index)}`,
    username: displayName.toLowerCase(),
    displayName,
    avatarUrl: null,
    bannerUrl: null,
    accentColor: ["#7957d9", "#3d92a0", "#b14f79", "#8062bd"][index % 4],
    status: statuses[index],
    activity: activities[index],
    level: Math.max(8, 51 - index * 3),
    xp: Math.max(12_500, 198_500 - index * 15_870),
    rank: index + 1,
    messages: Math.max(1_400, 28_410 - index * 1_930),
    voiceMinutes: Math.max(420, 12_720 - index * 810),
    joinedAt: new Date(Date.UTC(2024, index % 12, 4 + index)).toISOString(),
  }));
}

function demoMemberProfile(memberId: string): CommunityMemberProfile {
  const members = demoMembers();
  const member = members.find((entry) => entry.id === memberId) || members[0];
  return {
    user: member,
    gacha: {
      coins: Math.max(1_200, 28_400 - (member.rank || 1) * 1_350),
      collectionSize: Math.max(18, 102 - (member.rank || 1) * 5),
      pulls: Math.max(60, 530 - (member.rank || 1) * 26),
      bestRarity: (member.rank || 1) < 8 ? "SSR" : "SR",
    },
    badges: ["Veterano", "Conversador", (member.rank || 99) <= 3 ? "Top 3" : "Explorador"],
    mutualCircles: ["Los noctámbulos", "Gaming"],
  };
}
