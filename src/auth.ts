import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { IS_DEMO_MODE } from "@/lib/demo";

const guildId = process.env.DISCORD_GUILD_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
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
    async signIn({ account }) {
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
      return IS_DEMO_MODE || Boolean(session?.user?.id);
    },
  },
});
