CREATE TABLE IF NOT EXISTS `community_users` (
  `discord_id` varchar(25) NOT NULL,
  `display_name` varchar(80) NULL,
  `used_bytes` bigint unsigned NOT NULL DEFAULT 0,
  `quota_bytes` bigint unsigned NOT NULL DEFAULT 104857600,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`discord_id`),
  CONSTRAINT `community_users_quota_chk` CHECK (`used_bytes` <= `quota_bytes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `media_assets` (
  `id` char(36) NOT NULL,
  `owner_id` varchar(25) NOT NULL,
  `purpose` varchar(20) NOT NULL,
  `mime_type` varchar(64) NOT NULL,
  `width` int unsigned NOT NULL,
  `height` int unsigned NOT NULL,
  `plaintext_bytes` bigint unsigned NOT NULL,
  `encrypted_bytes` bigint unsigned NOT NULL,
  `storage_path` varchar(255) NOT NULL,
  `nonce_hex` char(24) NOT NULL,
  `auth_tag_hex` char(32) NOT NULL,
  `key_version` int unsigned NOT NULL,
  `status` varchar(12) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_storage_path_uq` (`storage_path`),
  KEY `media_owner_idx` (`owner_id`),
  KEY `media_status_idx` (`status`),
  CONSTRAINT `media_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `community_users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `custom_profiles` (
  `discord_id` varchar(25) NOT NULL,
  `avatar_media_id` char(36) NULL,
  `banner_media_id` char(36) NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`discord_id`),
  CONSTRAINT `profile_user_fk` FOREIGN KEY (`discord_id`) REFERENCES `community_users` (`discord_id`) ON DELETE CASCADE,
  CONSTRAINT `profile_avatar_fk` FOREIGN KEY (`avatar_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `profile_banner_fk` FOREIGN KEY (`banner_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `circles` (
  `id` char(36) NOT NULL,
  `owner_id` varchar(25) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(240) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `circle_owner_idx` (`owner_id`),
  CONSTRAINT `circle_owner_fk` FOREIGN KEY (`owner_id`) REFERENCES `community_users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `circle_members` (
  `circle_id` char(36) NOT NULL,
  `user_id` varchar(25) NOT NULL,
  `role` varchar(12) NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`circle_id`, `user_id`),
  KEY `circle_member_user_idx` (`user_id`),
  CONSTRAINT `circle_member_circle_fk` FOREIGN KEY (`circle_id`) REFERENCES `circles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `circle_member_user_fk` FOREIGN KEY (`user_id`) REFERENCES `community_users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `circle_posts` (
  `id` char(36) NOT NULL,
  `circle_id` char(36) NOT NULL,
  `author_id` varchar(25) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `circle_posts_feed_idx` (`circle_id`, `created_at`),
  KEY `circle_posts_author_idx` (`author_id`),
  CONSTRAINT `circle_post_circle_fk` FOREIGN KEY (`circle_id`) REFERENCES `circles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `circle_post_author_fk` FOREIGN KEY (`author_id`) REFERENCES `community_users` (`discord_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `circle_post_media` (
  `post_id` char(36) NOT NULL,
  `media_id` char(36) NOT NULL,
  PRIMARY KEY (`post_id`, `media_id`),
  UNIQUE KEY `circle_post_media_asset_uq` (`media_id`),
  CONSTRAINT `circle_post_media_post_fk` FOREIGN KEY (`post_id`) REFERENCES `circle_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `circle_post_media_asset_fk` FOREIGN KEY (`media_id`) REFERENCES `media_assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
