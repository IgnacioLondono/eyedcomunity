export type CommunityUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
};

export type RequestMetadata = { requestId: string };

export type CommunityFeatureKey =
  | "activity"
  | "achievements"
  | "wrapped"
  | "server"
  | "lobby"
  | "ranking"
  | "circle"
  | "plans"
  | "party"
  | "challenges"
  | "shop";

export type CommunitySettings = {
  maintenance: boolean;
  achievementNotifications: boolean;
  features: Record<CommunityFeatureKey, boolean>;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type CommunityShopProduct = {
  id: string;
  type: "character" | "role" | "item";
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  priceCoins: number;
  stock: number | null;
  remainingStock: number | null;
  soldCount: number;
  perUserLimit: number | null;
  purchasedQuantity: number;
  ownedQuantity: number;
  active: boolean;
  sortOrder: number;
};

export type CommunityShopCatalog = RequestMetadata & {
  products: CommunityShopProduct[];
  categories: string[];
  balance: number;
};

export type CommunityShopPurchase = RequestMetadata & {
  purchaseId: string;
  productId: string;
  quantity: number;
  spentCoins: number;
  balance: number;
  status: "completed";
  idempotent: boolean;
};

export type TrackingMetadata = {
  trackingStartedAt: string | null;
  timezone: string;
  dataFrom: string | null;
  dataTo: string | null;
};

export type ActivityDay = {
  date: string;
  messages: number;
  voiceSeconds: number;
  voiceMinutes: number;
  xpEarned: number;
};

export type CommunityActivity = TrackingMetadata & RequestMetadata & {
  user: CommunityUser;
  activeVoice: null | {
    userId: string;
    startedAt: string;
    checkpointAt: string;
    uncheckpointedSeconds: number;
  };
  series: ActivityDay[];
};

export type RankingMetric = "xp" | "messages" | "voice";
export type RankingPeriod = "all" | "week" | "month" | "year";
export type CommunityRanking = TrackingMetadata & RequestMetadata & {
  metric: RankingMetric;
  period: RankingPeriod;
  requesterPosition: number | null;
  items: Array<{
    position: number;
    user: CommunityUser;
    value: number;
    voiceSeconds?: number;
  }>;
  nextCursor: string | null;
};

export type Challenge = {
  id: string;
  definition: { title: string; description: string; metric: string; target: number };
  progress: number;
  completed: boolean;
  reward: { eyedCoins: number };
  claimed: boolean;
  claimedAt: string | null;
};

export type CommunityChallenges = RequestMetadata & {
  userId: string;
  period: { key: string; startsOn: string; endsOn: string; timezone: string };
  items: Challenge[];
};

export type ChallengeClaim = RequestMetadata & {
  claimed: true;
  challengeId: string;
  reward: { eyedCoins: number };
  balance: number;
};

export type Achievement = {
  id: string;
  definition: { title: string; description: string; metric: string; target: number };
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  reward: { eyedCoins: number };
};

export type CommunityAchievements = RequestMetadata & {
  userId: string;
  items: Achievement[];
};

export type PlanStatus = "upcoming" | "active" | "completed" | "cancelled";
export type CommunityPlan = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  status: PlanStatus;
  visibility: "guild" | "private";
  ownerId: string;
  capacity: number;
  attendeeCount: number;
  isAttendee: boolean;
  invitationStatus: "pending" | "accepted" | "rejected" | null;
  canManage: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PartyStatus = "waiting" | "active" | "completed" | "cancelled";
export type PartyGameType = "trivia" | "dice";
export type TriviaState = {
  questionId?: string;
  prompt?: string;
  choices?: string[];
  answeredUserIds?: string[];
  winners?: string[];
};
export type DiceState = { rolls?: Record<string, number>; winners?: string[] };
export type CommunityParty = {
  id: string;
  title: string;
  gameType: PartyGameType;
  status: PartyStatus;
  ownerId: string;
  capacity: number;
  participantCount: number;
  turnUserId: string | null;
  version: number;
  state: TriviaState | DiceState;
  participants: Array<{ userId: string; joinedAt: string }>;
  isParticipant: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type PartyAction = {
  actionId: string;
  expectedVersion: number;
  type: "start" | "answer" | "roll";
  choice?: number;
};

export type CommunityEvent = {
  type: string;
  scope: "self" | "guild_public" | "participants" | "staff";
  subjectUserId: string | null;
  aggregateId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CommunityProfile = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    accentColor: string | null;
    joinedAt: string | null;
  };
  stats: {
    xp: number;
    level: number;
    messages: number;
    voiceMinutes: number;
    rank: number | null;
    memberCount: number;
  };
  gacha: {
    coins: number;
    collectionSize: number;
    pulls: number;
    bestRarity: string | null;
  };
  activity: Array<{
    date: string;
    messages: number;
    voiceMinutes: number;
    xpEarned: number;
  }>;
};

export type CommunityServer = {
  guild: {
    id: string;
    name: string;
    iconUrl: string | null;
    memberCount: number;
    onlineCount: number;
  };
  totals: {
    messages: number;
    voiceMinutes: number;
    joins: number;
    leaves: number;
  };
  trackingStartedAt: string | null;
  daily: Array<{
    date: string;
    messages: number;
    voiceMinutes: number;
    joins: number;
    leaves: number;
  }>;
  leaderboard: Array<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    xp: number;
    level: number;
    messages: number;
    voiceMinutes: number;
  }>;
};

export type CommunityWrapped = {
  year: number;
  dataFrom: string | null;
  dataTo: string | null;
  trackingStartedAt: string | null;
  timezone: string;
  generatedAt: string;
  finalized: boolean;
  schemaVersion: number;
  requestId: string;
  user: CommunityUser;
  stats: {
    messages: number;
    voiceSeconds: number;
    voiceMinutes: number;
    xpEarned: number;
    activeDays: number;
    favoriteDay: string | null;
    monthly: Array<{
      month: number;
      messages: number;
      voiceSeconds: number;
      voiceMinutes: number;
      xpEarned: number;
    }>;
    rank: number | null;
  };
  lifetime: {
    messages: number;
    voiceMinutes: number;
    xp: number;
    level: number;
    updatedAt: string | null;
  };
  highlights: string[];
};

export type CommunityMemberSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  accentColor: string | null;
  status: "online" | "idle" | "dnd" | "offline";
  activity: string | null;
  level: number;
  xp: number;
  rank: number | null;
  messages: number;
  voiceMinutes: number;
  joinedAt: string | null;
};

export type CommunityMemberProfile = {
  user: Omit<CommunityMemberSummary, "activity">;
  badges: string[];
};
