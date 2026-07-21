export type CommunityProfile = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
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
  trackingStartedAt: string;
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
  availableFrom: string | null;
  isCompletePeriod: boolean;
  user: CommunityProfile["user"];
  stats: {
    messages: number;
    voiceMinutes: number;
    xpEarned: number;
    activeDays: number;
    favoriteDay: string | null;
    monthly?: Array<{
      month: number;
      messages: number;
      voiceMinutes: number;
      xpEarned: number;
    }>;
    rank: number | null;
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
  user: CommunityMemberSummary;
  gacha: CommunityProfile["gacha"];
  badges: string[];
  mutualCircles: string[];
};
