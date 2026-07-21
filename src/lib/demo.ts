export const IS_DEMO_MODE =
  process.env.NODE_ENV !== "production" &&
  (!process.env.AUTH_DISCORD_ID ||
    !process.env.AUTH_DISCORD_SECRET ||
    !process.env.DISCORD_GUILD_ID);

export const DEMO_USER_ID = "399740358101303316";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  name: "Nova",
  image: null,
};
