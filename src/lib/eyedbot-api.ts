import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import type {
  ChallengeClaim,
  CommunityAchievements,
  CommunityActivity,
  CommunityChallenges,
  CommunityMemberProfile,
  CommunityParty,
  CommunityProfile,
  CommunityRanking,
  CommunityServer,
  CommunityWrapped,
  PartyAction,
  PartyStatus,
  PlanStatus,
  RankingMetric,
  RankingPeriod,
} from "./types";

const snowflake = z.string().regex(/^\d{10,25}$/);
const iso = z.string().datetime();
const nullableIso = iso.nullable();
const nonNegative = z.number().int().nonnegative();
const requestMetadata = { requestId: z.string().min(1) };
const trackingMetadata = {
  trackingStartedAt: nullableIso,
  timezone: z.string().min(1),
  dataFrom: z.string().date().nullable(),
  dataTo: z.string().date().nullable(),
};
const userSchema = z.object({
  id: snowflake,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  joinedAt: nullableIso,
});
const activityDaySchema = z.object({
  date: z.string().date(),
  messages: nonNegative,
  voiceSeconds: nonNegative,
  voiceMinutes: nonNegative,
  xpEarned: nonNegative,
});
const profileSchema = z.object({
  user: userSchema,
  stats: z.object({
    xp: nonNegative, level: nonNegative, messages: nonNegative, voiceMinutes: nonNegative,
    rank: z.number().int().positive().nullable(), memberCount: nonNegative,
  }),
  gacha: z.object({
    coins: nonNegative, collectionSize: nonNegative, pulls: nonNegative, bestRarity: z.string().nullable(),
  }),
  activity: z.array(z.object({
    date: z.string().date(), messages: nonNegative, voiceMinutes: nonNegative, xpEarned: nonNegative,
    voiceSeconds: nonNegative.optional(),
  })),
});
const memberSummarySchema = userSchema.extend({
  bannerUrl: z.string().url().nullable(),
  accentColor: z.string().nullable(),
  status: z.enum(["online", "idle", "dnd", "offline"]),
  activity: z.string().nullable(),
  level: nonNegative,
  xp: nonNegative,
  rank: z.number().int().positive().nullable(),
  messages: nonNegative,
  voiceMinutes: nonNegative,
});
const serverSchema = z.object({
  guild: z.object({
    id: snowflake, name: z.string(), iconUrl: z.string().url().nullable(),
    memberCount: nonNegative, onlineCount: nonNegative,
  }),
  totals: z.object({ messages: nonNegative, voiceMinutes: nonNegative, joins: nonNegative, leaves: nonNegative }),
  trackingStartedAt: nullableIso,
  daily: z.array(z.object({
    date: z.string().date(), messages: nonNegative, voiceMinutes: nonNegative, joins: nonNegative, leaves: nonNegative,
  })),
  leaderboard: z.array(z.object({
    userId: snowflake, displayName: z.string(), avatarUrl: z.string().url().nullable(),
    xp: nonNegative, level: nonNegative, messages: nonNegative, voiceMinutes: nonNegative,
  })),
});
const activitySchema = z.object({
  user: userSchema, ...trackingMetadata, ...requestMetadata,
  activeVoice: z.object({
    userId: snowflake, startedAt: iso, checkpointAt: iso, uncheckpointedSeconds: nonNegative,
  }).nullable(),
  series: z.array(activityDaySchema),
});
const rankingSchema = z.object({
  metric: z.enum(["xp", "messages", "voice"]),
  period: z.enum(["all", "week", "month", "year"]),
  ...trackingMetadata,
  requesterPosition: z.number().int().positive().nullable(),
  items: z.array(z.object({
    position: z.number().int().positive(),
    user: userSchema,
    value: nonNegative,
    voiceSeconds: nonNegative.optional(),
  })),
  nextCursor: z.string().nullable(),
  ...requestMetadata,
});
const definitionSchema = z.object({
  title: z.string(), description: z.string(), metric: z.string(), target: nonNegative,
});
const rewardSchema = z.object({ eyedCoins: nonNegative });
const challengesSchema = z.object({
  userId: snowflake,
  period: z.object({ key: z.string(), startsOn: z.string().date(), endsOn: z.string().date(), timezone: z.string() }),
  items: z.array(z.object({
    id: z.string(), definition: definitionSchema, progress: nonNegative, completed: z.boolean(),
    reward: rewardSchema, claimed: z.boolean(), claimedAt: nullableIso,
  })),
  ...requestMetadata,
});
const achievementsSchema = z.object({
  userId: snowflake,
  items: z.array(z.object({
    id: z.string(), definition: definitionSchema, progress: nonNegative, unlocked: z.boolean(),
    unlockedAt: nullableIso, reward: rewardSchema,
  })),
  ...requestMetadata,
});
const planSchema = z.object({
  id: z.string().uuid(), title: z.string(), description: z.string(), location: z.string(),
  startsAt: iso, endsAt: nullableIso, status: z.enum(["upcoming", "active", "completed", "cancelled"]),
  visibility: z.enum(["guild", "private"]), ownerId: snowflake, capacity: nonNegative,
  attendeeCount: nonNegative, isAttendee: z.boolean(), canManage: z.boolean(), version: z.number().int().positive(),
  invitationStatus: z.enum(["pending", "accepted", "rejected"]).nullable(),
  createdAt: iso, updatedAt: iso,
});
const partySchema: z.ZodType<CommunityParty> = z.object({
  id: z.string().uuid(), title: z.string(), gameType: z.enum(["trivia", "dice"]),
  status: z.enum(["waiting", "active", "completed", "cancelled"]), ownerId: snowflake,
  capacity: nonNegative, participantCount: nonNegative, turnUserId: snowflake.nullable(),
  version: z.number().int().positive(),
  state: z.union([
    z.object({
      questionId: z.string().optional(), prompt: z.string().optional(), choices: z.array(z.string()).optional(),
      answeredUserIds: z.array(snowflake).optional(), winners: z.array(snowflake).optional(),
    }),
    z.object({ rolls: z.record(snowflake, nonNegative).optional(), winners: z.array(snowflake).optional() }),
  ]),
  participants: z.array(z.object({ userId: snowflake, joinedAt: iso })),
  isParticipant: z.boolean(), createdAt: iso, updatedAt: iso, completedAt: nullableIso,
});
const wrappedSchema = z.object({
  year: z.number().int().min(2020), ...trackingMetadata, generatedAt: iso, finalized: z.boolean(),
  schemaVersion: z.number().int().positive(), user: userSchema,
  stats: z.object({
    messages: nonNegative, voiceSeconds: nonNegative, voiceMinutes: nonNegative, xpEarned: nonNegative,
    activeDays: nonNegative, favoriteDay: z.string().date().nullable(),
    monthly: z.array(z.object({
      month: z.number().int().min(1).max(12), messages: nonNegative, voiceSeconds: nonNegative,
      voiceMinutes: nonNegative, xpEarned: nonNegative,
    })),
    rank: z.number().int().positive().nullable(),
  }),
  highlights: z.array(z.string()),
  ...requestMetadata,
});

export class EyedBotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "EYEDBOT_REQUEST_FAILED",
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "EyedBotApiError";
  }
}

type RequestOptions<T> = {
  userId: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  schema: z.ZodType<T>;
  headers?: HeadersInit;
  timeoutMs?: number;
};

export function canonicalCommunityRequest(input: {
  method: string; path: string; body?: string; userId: string; timestamp: string; nonce: string;
}) {
  const path = input.path.split("?")[0] || "/";
  const bodyHash = createHash("sha256").update(input.body ?? "", "utf8").digest("hex");
  return [
    input.method.toUpperCase(), path, bodyHash, snowflake.parse(input.userId),
    input.timestamp.trim(), input.nonce.trim(),
  ].join("\n");
}

export function buildCommunitySignedHeaders(input: {
  method: string; path: string; body?: string; userId: string; timestamp?: string; nonce?: string;
}) {
  const secret = process.env.COMMUNITY_SIGNING_SECRET?.trim();
  const apiKey = process.env.COMMUNITY_API_KEY?.trim();
  if (!secret || !apiKey) throw new EyedBotApiError("La API comunitaria no está configurada", 503, "SERVICE_NOT_CONFIGURED");
  const timestamp = input.timestamp ?? String(Date.now());
  const nonce = input.nonce ?? randomBytes(24).toString("base64url");
  const canonical = canonicalCommunityRequest({ ...input, timestamp, nonce });
  const signature = createHmac("sha256", secret).update(canonical).digest("hex");
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Community-User-Id": snowflake.parse(input.userId),
    "X-Community-Timestamp": timestamp,
    "X-Community-Nonce": nonce,
    "X-Community-Signature": signature,
  };
}

export function getEyedBotUrl(path: string) {
  const baseUrl = process.env.EYEDBOT_API_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new EyedBotApiError("La API comunitaria no está configurada", 503, "SERVICE_NOT_CONFIGURED");
  if (!path.startsWith("/")) throw new TypeError("La ruta de EyedBot debe ser absoluta");
  return `${baseUrl}${path}`;
}

export async function eyedBotRequest<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const method = options.method ?? "GET";
  const body = options.body === undefined ? "" : JSON.stringify(options.body);
  const signed = buildCommunitySignedHeaders({ method, path, body, userId: options.userId });
  const response = await fetch(getEyedBotUrl(path), {
    method,
    headers: {
      ...signed,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: body || undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 8_000),
  }).catch((error) => {
    throw new EyedBotApiError(
      error instanceof Error ? error.message : "EyedBot no está disponible",
      503,
      "EYEDBOT_UNAVAILABLE",
    );
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z.object({
      error: z.union([z.string(), z.object({ code: z.string(), message: z.string() })]).optional(),
      requestId: z.string().optional(),
    }).safeParse(payload);
    const error = parsed.success ? parsed.data.error : undefined;
    throw new EyedBotApiError(
      typeof error === "string" ? error : error?.message || "No se pudo consultar EyedBot",
      response.status,
      typeof error === "object" ? error.code : "EYEDBOT_REQUEST_FAILED",
      parsed.success ? parsed.data.requestId : undefined,
    );
  }
  const parsed = options.schema.safeParse(payload);
  if (!parsed.success) {
    console.error("Contrato inválido de EyedBot", { path, issues: parsed.error.issues });
    throw new EyedBotApiError("EyedBot devolvió una respuesta incompatible", 502, "INVALID_UPSTREAM_RESPONSE");
  }
  return parsed.data;
}

function userPath(userId: string) {
  return encodeURIComponent(snowflake.parse(userId));
}

export function getCommunityProfile(userId: string) {
  return eyedBotRequest<CommunityProfile>(`/api/community/profile/${userPath(userId)}`, { userId, schema: profileSchema });
}

export function getCommunityServer(userId: string) {
  return eyedBotRequest<CommunityServer>("/api/community/server", { userId, schema: serverSchema });
}

export function getCommunityWrapped(userId: string, year: number) {
  const safeYear = Math.max(2020, Math.min(new Date().getUTCFullYear(), Math.trunc(year)));
  return eyedBotRequest<CommunityWrapped>(
    `/api/community/wrapped/${userPath(userId)}/${safeYear}`,
    { userId, schema: wrappedSchema },
  );
}

export function getCommunityMembers(viewerId: string) {
  return eyedBotRequest(
    "/api/community/members",
    { userId: viewerId, schema: z.object({ members: z.array(memberSummarySchema) }) },
  ).then((result) => result.members);
}

export function getCommunityMember(viewerId: string, memberId: string) {
  return eyedBotRequest<CommunityMemberProfile>(`/api/community/member/${userPath(memberId)}`, {
    userId: viewerId,
    schema: z.object({
      user: memberSummarySchema.omit({ activity: true }),
      badges: z.array(z.string()),
    }),
  });
}

export function getCommunityActivity(userId: string, days = 168) {
  const safeDays = Math.max(1, Math.min(366, Math.trunc(days)));
  return eyedBotRequest<CommunityActivity>(`/api/community/activity/${userPath(userId)}?days=${safeDays}`, {
    userId, schema: activitySchema,
  });
}

export function getCommunityRanking(userId: string, filters: {
  metric?: RankingMetric; period?: RankingPeriod; limit?: number; cursor?: string;
} = {}) {
  const query = new URLSearchParams({
    metric: filters.metric ?? "xp",
    period: filters.period ?? "all",
    limit: String(Math.max(1, Math.min(50, filters.limit ?? 25))),
  });
  if (filters.cursor) query.set("cursor", filters.cursor);
  return eyedBotRequest<CommunityRanking>(`/api/community/ranking?${query}`, { userId, schema: rankingSchema });
}

export function getCommunityChallenges(userId: string) {
  return eyedBotRequest<CommunityChallenges>(`/api/community/challenges/${userPath(userId)}`, {
    userId, schema: challengesSchema,
  });
}

export function claimCommunityChallenge(userId: string, challengeId: string) {
  return eyedBotRequest<ChallengeClaim>(
    `/api/community/challenges/${encodeURIComponent(z.string().regex(/^[a-z0-9_-]{1,64}$/i).parse(challengeId))}/claim`,
    {
      userId, method: "POST", body: { userId },
      schema: z.object({ claimed: z.literal(true), challengeId: z.string(), reward: rewardSchema, balance: nonNegative, ...requestMetadata }),
    },
  );
}

export function getCommunityAchievements(userId: string) {
  return eyedBotRequest<CommunityAchievements>(`/api/community/achievements/${userPath(userId)}`, {
    userId, schema: achievementsSchema,
  });
}

export function listCommunityPlans(userId: string, status?: PlanStatus[]) {
  const path = status?.length ? `/api/community/plans?status=${encodeURIComponent(status.join(","))}` : "/api/community/plans";
  return eyedBotRequest(path, {
    userId, schema: z.object({ plans: z.array(planSchema), ...requestMetadata }),
  });
}

export function createCommunityPlan(userId: string, input: unknown) {
  return eyedBotRequest(`/api/community/plans`, {
    userId, method: "POST", body: input, schema: z.object({ plan: planSchema, ...requestMetadata }),
  });
}

export function mutateCommunityPlan(userId: string, id: string, action: "join" | "leave" | "status", status?: PlanStatus) {
  const uuid = z.string().uuid().parse(id);
  const path = action === "status" ? `/api/community/plans/${uuid}/status` : `/api/community/plans/${uuid}/join`;
  if (action === "leave") {
    return eyedBotRequest(path, {
      userId, method: "DELETE",
      schema: z.object({ joined: z.literal(false), idempotent: z.boolean(), ...requestMetadata }),
    });
  }
  if (action === "status") {
    return eyedBotRequest(path, {
      userId, method: "PATCH", body: { status },
      schema: z.object({ plan: planSchema, ...requestMetadata }),
    });
  }
  return eyedBotRequest(path, {
    userId, method: "POST",
    schema: z.object({ joined: z.literal(true), idempotent: z.boolean(), plan: planSchema, ...requestMetadata }),
  });
}

export function inviteCommunityPlan(userId: string, id: string, inviteeId: string) {
  return eyedBotRequest(`/api/community/plans/${z.string().uuid().parse(id)}/invitations`, {
    userId,
    method: "POST",
    body: { userId: snowflake.parse(inviteeId) },
    schema: z.object({
      invitation: z.object({
        planId: z.string().uuid(), inviteeId: snowflake, status: z.literal("pending"), updatedAt: iso,
      }),
      ...requestMetadata,
    }),
  });
}

export function respondCommunityPlanInvitation(userId: string, id: string, decision: "accept" | "reject") {
  return eyedBotRequest(`/api/community/plans/${z.string().uuid().parse(id)}/invitations/${decision}`, {
    userId,
    method: "POST",
    schema: z.object({
      invitation: z.object({
        planId: z.string().uuid(),
        status: z.enum(["accepted", "rejected"]),
        idempotent: z.boolean(),
      }),
      ...requestMetadata,
    }),
  });
}

export function listCommunityParties(userId: string, status?: PartyStatus) {
  const path = status ? `/api/community/parties?status=${status}` : "/api/community/parties";
  return eyedBotRequest(path, { userId, schema: z.object({ parties: z.array(partySchema), ...requestMetadata }) });
}

export function createCommunityParty(userId: string, input: unknown) {
  return eyedBotRequest("/api/community/parties", {
    userId, method: "POST", body: input, schema: z.object({ party: partySchema, ...requestMetadata }),
  });
}

export function getCommunityParty(userId: string, id: string) {
  return eyedBotRequest(`/api/community/parties/${z.string().uuid().parse(id)}`, {
    userId, schema: z.object({ party: partySchema, ...requestMetadata }),
  });
}

export function joinCommunityParty(userId: string, id: string) {
  return eyedBotRequest(`/api/community/parties/${z.string().uuid().parse(id)}/join`, {
    userId, method: "POST", schema: z.object({ party: partySchema, ...requestMetadata }),
  });
}

export function leaveCommunityParty(userId: string, id: string) {
  return eyedBotRequest(`/api/community/parties/${z.string().uuid().parse(id)}/join`, {
    userId,
    method: "DELETE",
    schema: z.object({
      party: partySchema, left: z.boolean(), idempotent: z.boolean(), ...requestMetadata,
    }),
  });
}

export function actCommunityParty(userId: string, id: string, action: PartyAction) {
  return eyedBotRequest(`/api/community/parties/${z.string().uuid().parse(id)}/action`, {
    userId, method: "POST", body: action,
    schema: z.object({
      actionId: z.string(), result: z.record(z.string(), z.unknown()),
      rewards: z.array(z.object({ userId: snowflake, eyedCoins: nonNegative })),
      party: partySchema, idempotent: z.boolean(), ...requestMetadata,
    }),
  });
}

export function createCommunityPartyTicket(userId: string, id: string) {
  return eyedBotRequest(`/api/community/parties/${z.string().uuid().parse(id)}/ticket`, {
    userId, method: "POST",
    schema: z.object({ ticket: z.string().min(20), expiresAt: iso, path: z.string() }),
  });
}
