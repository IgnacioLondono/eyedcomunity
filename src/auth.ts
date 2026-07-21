import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "@/lib/eyedbot-api";

const guildId = process.env.DISCORD_GUILD_ID?.trim();
const discordClientId = process.env.AUTH_DISCORD_ID?.trim();
const discordClientSecret = process.env.AUTH_DISCORD_SECRET?.trim();

async function verifyWithEyedBot(userId: string) {
  const path = `/api/community/membership/${encodeURIComponent(userId)}`;
  let url: string;
  let headers: HeadersInit;
  try {
    url = getEyedBotUrl(path);
    headers = { ...buildCommunitySignedHeaders({ method: "GET", path, userId }), Accept: "application/json" };
  } catch {
    return null;
  }

  const response = await fetch(
    url,
    {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  ).catch(() => null);

  if (!response) return null;
  if (response.ok) return true;
  if (response.status === 403 || response.status === 404) return false;
  console.warn(`EyedBot rechazó la verificación de membresía (${response.status})`);
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: discordClientId,
      clientSecret: discordClientSecret,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/access-denied",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    async signIn({ account, profile }) {
      const userId = profile?.id ? String(profile.id) : account?.providerAccountId;
      if (!userId) return false;

      const botMembership = await verifyWithEyedBot(userId);
      if (botMembership !== null) return botMembership;
      if (!account?.access_token || !guildId) return false;

      const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bearer ${account.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null);

      if (!response?.ok) return false;
      const guilds = (await response.json()) as Array<{ id: string }>;
      return guilds.some((guild) => guild.id === guildId);
    },
    jwt({ token, profile }) {
      if (profile?.id) token.discordId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = String(token.discordId ?? token.sub ?? "");
      return session;
    },
    authorized({ auth: session }) {
      return Boolean(session?.user?.id);
    },
  },
});
