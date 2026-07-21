import {
  bigint,
  char,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const communityUsers = mysqlTable("community_users", {
  discordId: varchar("discord_id", { length: 25 }).primaryKey(),
  displayName: varchar("display_name", { length: 80 }),
  usedBytes: bigint("used_bytes", { mode: "number", unsigned: true }).notNull().default(0),
  quotaBytes: bigint("quota_bytes", { mode: "number", unsigned: true }).notNull().default(104_857_600),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const mediaAssets = mysqlTable("media_assets", {
  id: char("id", { length: 36 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 25 }).notNull().references(() => communityUsers.discordId, { onDelete: "cascade" }),
  purpose: varchar("purpose", { length: 20 }).notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  width: int("width", { unsigned: true }).notNull(),
  height: int("height", { unsigned: true }).notNull(),
  plaintextBytes: bigint("plaintext_bytes", { mode: "number", unsigned: true }).notNull(),
  encryptedBytes: bigint("encrypted_bytes", { mode: "number", unsigned: true }).notNull(),
  storagePath: varchar("storage_path", { length: 255 }).notNull(),
  nonceHex: char("nonce_hex", { length: 24 }).notNull(),
  authTagHex: char("auth_tag_hex", { length: 32 }).notNull(),
  keyVersion: int("key_version", { unsigned: true }).notNull(),
  status: varchar("status", { length: 12 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("media_owner_idx").on(table.ownerId),
  index("media_status_idx").on(table.status),
  uniqueIndex("media_storage_path_uq").on(table.storagePath),
]);

export const customProfiles = mysqlTable("custom_profiles", {
  discordId: varchar("discord_id", { length: 25 }).primaryKey().references(() => communityUsers.discordId, { onDelete: "cascade" }),
  avatarMediaId: char("avatar_media_id", { length: 36 }).references(() => mediaAssets.id, { onDelete: "set null" }),
  bannerMediaId: char("banner_media_id", { length: 36 }).references(() => mediaAssets.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const circles = mysqlTable("circles", {
  id: char("id", { length: 36 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 25 }).notNull().references(() => communityUsers.discordId, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 240 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("circle_owner_idx").on(table.ownerId)]);

export const circleMembers = mysqlTable("circle_members", {
  circleId: char("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 25 }).notNull().references(() => communityUsers.discordId, { onDelete: "cascade" }),
  role: varchar("role", { length: 12 }).notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.circleId, table.userId] }),
  index("circle_member_user_idx").on(table.userId),
]);

export const circlePosts = mysqlTable("circle_posts", {
  id: char("id", { length: 36 }).primaryKey(),
  circleId: char("circle_id", { length: 36 }).notNull().references(() => circles.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 25 }).notNull().references(() => communityUsers.discordId, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("circle_posts_feed_idx").on(table.circleId, table.createdAt),
  index("circle_posts_author_idx").on(table.authorId),
]);

export const circlePostMedia = mysqlTable("circle_post_media", {
  postId: char("post_id", { length: 36 }).notNull().references(() => circlePosts.id, { onDelete: "cascade" }),
  mediaId: char("media_id", { length: 36 }).notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.postId, table.mediaId] }),
  uniqueIndex("circle_post_media_asset_uq").on(table.mediaId),
]);
