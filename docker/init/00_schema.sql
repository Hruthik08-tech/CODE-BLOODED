-- ================================================================
--  GENYSIS  —  Database Schema Initialization (FULL SYNC)
-- ================================================================
--  This schema matches the Full Planning Schema (DataBase.sql) AND
--  is fully compatible with the existing backend route code.
--
--  Compatibility notes:
--    • org_demand     : adds `required_by` (alias for required_by_date),
--                       adds `search_radius`
--    • requests       : match_id is NULLABLE, adds `match_score`
--    • business_room  : adds `org_id_1`,`org_id_2`,`status` (backend names)
--    • room_message   : adds `content`,`created_at` (backend names)
--    • deal           : adds `agreed_price`,`quantity`,`qr_code_data`,
--                       `qr_token` (backend names)
--    • saved_match    : NEW table for matches.js route
-- ================================================================
-- ────────────────────────────────────────────────────────
--  1. organisation
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `organisation` (
    `org_id` INT PRIMARY KEY AUTO_INCREMENT,
    `org_name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `website_url` VARCHAR(300),
    `description` TEXT,
    `logo_url` VARCHAR(500),
    `address` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `latitude` DECIMAL(9, 6) NOT NULL,
    `longitude` DECIMAL(9, 6) NOT NULL,
    `is_active` BOOLEAN DEFAULT true,
    `is_suspended` BOOLEAN DEFAULT false,
    `metadata` JSON,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  2. item_category
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `item_category` (
    `category_id` INT PRIMARY KEY AUTO_INCREMENT,
    `parent_id` INT,
    `category_name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) UNIQUE NOT NULL,
    `description` VARCHAR(500),
    `icon_url` VARCHAR(300),
    `is_active` BOOLEAN DEFAULT true,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  3. org_supply
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `org_supply` (
    `supply_id` INT PRIMARY KEY AUTO_INCREMENT,
    `org_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `item_description` TEXT,
    `price_per_unit` DECIMAL(14, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `quantity` INT NOT NULL,
    `quantity_unit` VARCHAR(50) NOT NULL,
    `min_order_qty` INT DEFAULT 1,
    `search_radius` DECIMAL(8, 2) DEFAULT 50.00,
    `expiry_date` DATE,
    `location_label` VARCHAR(255),
    `image_url` VARCHAR(500),
    `supplier_name` VARCHAR(200),
    `supplier_phone` VARCHAR(20),
    `supplier_email` VARCHAR(150),
    `supplier_address` VARCHAR(500),
    `is_active` BOOLEAN DEFAULT true,
    `is_flagged` BOOLEAN DEFAULT false,
    `version` INT NOT NULL DEFAULT 1,
    `metadata` JSON,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  4. org_supply_history
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `org_supply_history` (
    `history_id` INT PRIMARY KEY AUTO_INCREMENT,
    `supply_id` INT NOT NULL,
    `version` INT NOT NULL,
    `changed_by_org` INT NOT NULL,
    `change_type` ENUM('created', 'updated', 'deleted', 'restored') NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `item_description` TEXT,
    `price_per_unit` DECIMAL(14, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `quantity` INT NOT NULL,
    `quantity_unit` VARCHAR(50) NOT NULL,
    `expiry_date` DATE,
    `category_id` INT NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    `metadata` JSON,
    `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  5. org_demand
--     COMPAT: `required_by` = alias for `required_by_date`
--             `search_radius` = added for backend demand search
--             `item_category` = text convenience field
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `org_demand` (
    `demand_id` INT PRIMARY KEY AUTO_INCREMENT,
    `org_id` INT NOT NULL,
    `category_id` INT,
    `item_name` VARCHAR(255) NOT NULL,
    `item_category` VARCHAR(255),
    `item_description` TEXT,
    `min_price_per_unit` DECIMAL(14, 2),
    `max_price_per_unit` DECIMAL(14, 2) DEFAULT 0,
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `quantity` DECIMAL(10, 2) DEFAULT 0,
    `quantity_unit` VARCHAR(50) DEFAULT 'unit',
    `min_order_qty` INT DEFAULT 1,
    `required_by_date` DATE,
    `required_by` DATE,
    `delivery_location` VARCHAR(255),
    `search_radius` DECIMAL(10, 2) DEFAULT 50.00,
    `image_url` VARCHAR(500),
    `is_active` BOOLEAN DEFAULT true,
    `is_flagged` BOOLEAN DEFAULT false,
    `version` INT NOT NULL DEFAULT 1,
    `metadata` JSON,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  6. org_demand_history
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `org_demand_history` (
    `history_id` INT PRIMARY KEY AUTO_INCREMENT,
    `demand_id` INT NOT NULL,
    `version` INT NOT NULL,
    `changed_by_org` INT NOT NULL,
    `change_type` ENUM('created', 'updated', 'deleted', 'restored') NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `item_description` TEXT,
    `min_price_per_unit` DECIMAL(14, 2),
    `max_price_per_unit` DECIMAL(14, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `quantity` INT NOT NULL,
    `quantity_unit` VARCHAR(50) NOT NULL,
    `required_by_date` DATE,
    `category_id` INT NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    `metadata` JSON,
    `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  7. match_result
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `match_result` (
    `match_id` INT PRIMARY KEY AUTO_INCREMENT,
    `supply_id` INT NOT NULL,
    `demand_id` INT NOT NULL,
    `searched_by_org` INT NOT NULL,
    `search_direction` ENUM('supply_to_demand', 'demand_to_supply') NOT NULL,
    `confidence_score` DECIMAL(5, 2) NOT NULL,
    `name_score` DECIMAL(5, 2),
    `description_score` DECIMAL(5, 2),
    `price_score` DECIMAL(5, 2),
    `category_score` DECIMAL(5, 2),
    `status` ENUM('pending', 'saved', 'dismissed') NOT NULL DEFAULT 'pending',
    `actioned_at` TIMESTAMP NULL,
    `cache_key` VARCHAR(500),
    `cache_expires_at` TIMESTAMP NULL,
    `is_cache_valid` BOOLEAN DEFAULT true,
    `ai_model_version` VARCHAR(50),
    `metadata` JSON,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  8. requests
--     COMPAT: match_id NULLABLE (backend doesn't always have one)
--             match_score added (backend sends this)
--             supply_name_snapshot / demand_name_snapshot NULLABLE
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `requests` (
    `request_id` INT PRIMARY KEY AUTO_INCREMENT,
    `match_id` INT,
    `supply_id` INT,
    `demand_id` INT,
    `requested_by` INT NOT NULL,
    `requested_to` INT NOT NULL,
    `match_score` DECIMAL(5, 2),
    `supply_name_snapshot` VARCHAR(100),
    `demand_name_snapshot` VARCHAR(100),
    `message` TEXT,
    `rejection_reason` TEXT,
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  9. request_status_history
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `request_status_history` (
    `history_id` INT PRIMARY KEY AUTO_INCREMENT,
    `request_id` INT NOT NULL,
    `changed_by_org` INT NOT NULL,
    `from_status` ENUM('pending', 'accepted', 'rejected', 'cancelled'),
    `to_status` ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL,
    `reason` TEXT,
    `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  10. business_room
--      COMPAT: org_id_1/org_id_2/status (backend names)
--              + supply_org_id/demand_org_id/room_status (planning names)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `business_room` (
    `room_id` INT PRIMARY KEY AUTO_INCREMENT,
    `request_id` INT UNIQUE NOT NULL,
    `supply_org_id` INT,
    `demand_org_id` INT,
    `org_id_1` INT,
    `org_id_2` INT,
    `supply_id` INT,
    `demand_id` INT,
    `supply_name_snapshot` VARCHAR(100),
    `demand_name_snapshot` VARCHAR(100),
    `room_status` ENUM('active', 'in_progress', 'success', 'failed') DEFAULT 'active',
    `status` VARCHAR(20) DEFAULT 'in_progress',
    `closed_by_org` INT,
    `close_note` TEXT,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  11. business_room_status_history
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `business_room_status_history` (
    `history_id` INT PRIMARY KEY AUTO_INCREMENT,
    `room_id` INT NOT NULL,
    `changed_by_org` INT NOT NULL,
    `from_status` ENUM('active', 'in_progress', 'success', 'failed'),
    `to_status` ENUM('active', 'in_progress', 'success', 'failed') NOT NULL,
    `note` TEXT,
    `changed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  12. room_message
--      COMPAT: `content` + `created_at` (backend names)
--              + `message_text` + `sent_at` (planning names)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `room_message` (
    `message_id` INT PRIMARY KEY AUTO_INCREMENT,
    `room_id` INT NOT NULL,
    `sender_org_id` INT NOT NULL,
    `message_text` TEXT,
    `content` TEXT,
    `message_type` ENUM('text', 'attachment', 'system_event') NOT NULL DEFAULT 'text',
    `event_type` VARCHAR(100),
    `is_edited` BOOLEAN DEFAULT false,
    `edited_at` TIMESTAMP NULL,
    `is_deleted` BOOLEAN DEFAULT false,
    `deleted_at` TIMESTAMP NULL,
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  13. room_attachment
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `room_attachment` (
    `attachment_id` INT PRIMARY KEY AUTO_INCREMENT,
    `message_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `uploaded_by_org` INT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_size_bytes` INT,
    `mime_type` VARCHAR(100),
    `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
);
-- ────────────────────────────────────────────────────────
--  14. deal
--      COMPAT: `agreed_price`,`quantity`,`qr_code_data`,
--              `qr_token` (backend names)
--              + planning columns retained
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `deal` (
    `deal_id` INT PRIMARY KEY AUTO_INCREMENT,
    `room_id` INT UNIQUE NOT NULL,
    `supply_org_id` INT NOT NULL,
    `demand_org_id` INT NOT NULL,
    `supply_id` INT,
    `demand_id` INT,
    `supply_name_snapshot` VARCHAR(100),
    `demand_name_snapshot` VARCHAR(100),
    `agreed_price_per_unit` DECIMAL(14, 2),
    `agreed_price` DECIMAL(14, 2),
    `agreed_quantity` INT,
    `quantity` INT,
    `quantity_unit` VARCHAR(50),
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `total_value` DECIMAL(16, 2),
    `deal_status` ENUM('active', 'completed', 'disputed', 'cancelled') NOT NULL DEFAULT 'active',
    `notes` TEXT,
    `qr_code_data` TEXT,
    `qr_token` VARCHAR(128),
    `finalized_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  15. deal_barcode
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `deal_barcode` (
    `barcode_id` INT PRIMARY KEY AUTO_INCREMENT,
    `deal_id` INT NOT NULL,
    `barcode_version` INT NOT NULL DEFAULT 1,
    `is_current` BOOLEAN NOT NULL DEFAULT true,
    `qr_payload` VARCHAR(768) NOT NULL UNIQUE,
    `hmac_signature` VARCHAR(255) NOT NULL,
    `qr_image_url` VARCHAR(500) NOT NULL,
    `is_active` BOOLEAN DEFAULT true,
    `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    `revoked_at` TIMESTAMP NULL,
    `revoked_reason` TEXT
);
-- ────────────────────────────────────────────────────────
--  16. barcode_scan_log
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `barcode_scan_log` (
    `scan_id` INT PRIMARY KEY AUTO_INCREMENT,
    `barcode_id` INT NOT NULL,
    `deal_id` INT NOT NULL,
    `scanned_by_org` INT,
    `scan_result` ENUM(
        'verified',
        'invalid_signature',
        'barcode_not_found',
        'barcode_revoked',
        'deal_mismatch'
    ) NOT NULL,
    `is_verified` BOOLEAN NOT NULL,
    `ip_address` VARCHAR(45),
    `device_info` VARCHAR(255),
    `latitude` DECIMAL(9, 6),
    `longitude` DECIMAL(9, 6),
    `scanned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  17. notification
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notification` (
    `notification_id` INT PRIMARY KEY AUTO_INCREMENT,
    `org_id` INT NOT NULL,
    `type` ENUM(
        'request_received',
        'request_accepted',
        'request_rejected',
        'request_cancelled',
        'room_status_changed',
        'deal_success',
        'deal_failed',
        'new_message',
        'barcode_generated',
        'barcode_scanned',
        'org_verified',
        'org_suspended'
    ) NOT NULL,
    `reference_id` INT,
    `reference_type` ENUM(
        'request',
        'business_room',
        'deal',
        'barcode',
        'organisation'
    ),
    `title` VARCHAR(200) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `action_url` VARCHAR(300),
    `is_read` BOOLEAN DEFAULT false,
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ────────────────────────────────────────────────────────
--  18. saved_match  (COMPAT: for matches.js route)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `saved_match` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `org_id` INT NOT NULL,
    `source_type` VARCHAR(20) NOT NULL,
    `source_id` INT NOT NULL,
    `matched_type` VARCHAR(20) NOT NULL,
    `matched_id` INT NOT NULL,
    `match_score` DECIMAL(5, 2),
    `action` ENUM('saved', 'dismissed') NOT NULL DEFAULT 'saved',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_saved_match_unique` (
        `org_id`,
        `source_type`,
        `source_id`,
        `matched_type`,
        `matched_id`
    )
);
-- ================================================================
--  INDEXES
-- ================================================================
CREATE INDEX `idx_org_location` ON `organisation` (`latitude`, `longitude`);
CREATE INDEX `idx_org_active` ON `organisation` (`is_active`);
CREATE INDEX `idx_org_deleted` ON `organisation` (`deleted_at`);
CREATE INDEX `idx_category_parent` ON `item_category` (`parent_id`);
CREATE INDEX `idx_category_active` ON `item_category` (`is_active`);
CREATE INDEX `idx_supply_org` ON `org_supply` (`org_id`);
CREATE INDEX `idx_supply_category` ON `org_supply` (`category_id`);
CREATE INDEX `idx_supply_active` ON `org_supply` (`is_active`, `deleted_at`);
CREATE INDEX `idx_supply_expiry` ON `org_supply` (`expiry_date`);
CREATE INDEX `idx_supply_price` ON `org_supply` (`price_per_unit`);
CREATE INDEX `idx_supply_hist_id` ON `org_supply_history` (`supply_id`);
CREATE INDEX `idx_supply_hist_version` ON `org_supply_history` (`supply_id`, `version`);
CREATE INDEX `idx_demand_org` ON `org_demand` (`org_id`);
CREATE INDEX `idx_demand_category` ON `org_demand` (`category_id`);
CREATE INDEX `idx_demand_active` ON `org_demand` (`is_active`, `deleted_at`);
CREATE INDEX `idx_demand_required_by` ON `org_demand` (`required_by_date`);
CREATE INDEX `idx_demand_max_price` ON `org_demand` (`max_price_per_unit`);
CREATE INDEX `idx_demand_hist_id` ON `org_demand_history` (`demand_id`);
CREATE INDEX `idx_demand_hist_version` ON `org_demand_history` (`demand_id`, `version`);
CREATE INDEX `idx_match_supply` ON `match_result` (`supply_id`);
CREATE INDEX `idx_match_demand` ON `match_result` (`demand_id`);
CREATE INDEX `idx_match_org` ON `match_result` (`searched_by_org`);
CREATE INDEX `idx_match_score` ON `match_result` (`confidence_score`);
CREATE INDEX `idx_match_status` ON `match_result` (`status`);
CREATE INDEX `idx_match_cache` ON `match_result` (`is_cache_valid`);
CREATE UNIQUE INDEX `idx_match_unique` ON `match_result` (`supply_id`, `demand_id`, `searched_by_org`);
CREATE INDEX `idx_req_by` ON `requests` (`requested_by`);
CREATE INDEX `idx_req_to` ON `requests` (`requested_to`);
CREATE INDEX `idx_req_status` ON `requests` (`status`);
CREATE INDEX `idx_req_hist_id` ON `request_status_history` (`request_id`);
CREATE INDEX `idx_req_hist_time` ON `request_status_history` (`changed_at`);
CREATE INDEX `idx_room_status` ON `business_room` (`room_status`);
CREATE INDEX `idx_room_deleted` ON `business_room` (`deleted_at`);
CREATE INDEX `idx_room_hist_id` ON `business_room_status_history` (`room_id`);
CREATE INDEX `idx_room_hist_time` ON `business_room_status_history` (`changed_at`);
CREATE INDEX `idx_msg_room` ON `room_message` (`room_id`);
CREATE INDEX `idx_msg_sender` ON `room_message` (`sender_org_id`);
CREATE INDEX `idx_msg_time` ON `room_message` (`sent_at`);
CREATE INDEX `idx_msg_deleted` ON `room_message` (`is_deleted`);
CREATE INDEX `idx_attach_room` ON `room_attachment` (`room_id`);
CREATE INDEX `idx_attach_message` ON `room_attachment` (`message_id`);
CREATE INDEX `idx_deal_supply_org` ON `deal` (`supply_org_id`);
CREATE INDEX `idx_deal_demand_org` ON `deal` (`demand_org_id`);
CREATE INDEX `idx_deal_status` ON `deal` (`deal_status`);
CREATE INDEX `idx_barcode_deal` ON `deal_barcode` (`deal_id`);
CREATE INDEX `idx_barcode_deal_current` ON `deal_barcode` (`deal_id`, `is_current`);
CREATE INDEX `idx_barcode_hmac` ON `deal_barcode` (`hmac_signature`);
CREATE INDEX `idx_barcode_active` ON `deal_barcode` (`is_active`);
CREATE INDEX `idx_scan_barcode` ON `barcode_scan_log` (`barcode_id`);
CREATE INDEX `idx_scan_deal` ON `barcode_scan_log` (`deal_id`);
CREATE INDEX `idx_scan_org` ON `barcode_scan_log` (`scanned_by_org`);
CREATE INDEX `idx_scan_result` ON `barcode_scan_log` (`scan_result`);
CREATE INDEX `idx_scan_time` ON `barcode_scan_log` (`scanned_at`);
CREATE INDEX `idx_notif_org` ON `notification` (`org_id`);
CREATE INDEX `idx_notif_read` ON `notification` (`is_read`);
CREATE INDEX `idx_notif_type` ON `notification` (`type`);
CREATE INDEX `idx_notif_org_unread` ON `notification` (`org_id`, `is_read`);
CREATE INDEX `idx_notif_time` ON `notification` (`created_at`);
CREATE INDEX `idx_saved_match_org` ON `saved_match` (`org_id`);
-- ================================================================
--  FOREIGN KEYS
-- ================================================================
ALTER TABLE `item_category`
ADD FOREIGN KEY (`parent_id`) REFERENCES `item_category` (`category_id`);
ALTER TABLE `org_supply`
ADD FOREIGN KEY (`category_id`) REFERENCES `item_category` (`category_id`);
ALTER TABLE `org_supply`
ADD FOREIGN KEY (`org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `org_demand`
ADD FOREIGN KEY (`org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `org_supply_history`
ADD FOREIGN KEY (`supply_id`) REFERENCES `org_supply` (`supply_id`);
ALTER TABLE `org_supply_history`
ADD FOREIGN KEY (`changed_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `org_demand_history`
ADD FOREIGN KEY (`demand_id`) REFERENCES `org_demand` (`demand_id`);
ALTER TABLE `org_demand_history`
ADD FOREIGN KEY (`changed_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `match_result`
ADD FOREIGN KEY (`supply_id`) REFERENCES `org_supply` (`supply_id`);
ALTER TABLE `match_result`
ADD FOREIGN KEY (`demand_id`) REFERENCES `org_demand` (`demand_id`);
ALTER TABLE `match_result`
ADD FOREIGN KEY (`searched_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `requests`
ADD FOREIGN KEY (`requested_by`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `requests`
ADD FOREIGN KEY (`requested_to`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `request_status_history`
ADD FOREIGN KEY (`request_id`) REFERENCES `requests` (`request_id`);
ALTER TABLE `request_status_history`
ADD FOREIGN KEY (`changed_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `room_message`
ADD FOREIGN KEY (`room_id`) REFERENCES `business_room` (`room_id`);
ALTER TABLE `room_message`
ADD FOREIGN KEY (`sender_org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `room_attachment`
ADD FOREIGN KEY (`message_id`) REFERENCES `room_message` (`message_id`);
ALTER TABLE `room_attachment`
ADD FOREIGN KEY (`room_id`) REFERENCES `business_room` (`room_id`);
ALTER TABLE `room_attachment`
ADD FOREIGN KEY (`uploaded_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `deal`
ADD FOREIGN KEY (`room_id`) REFERENCES `business_room` (`room_id`);
ALTER TABLE `deal`
ADD FOREIGN KEY (`supply_org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `deal`
ADD FOREIGN KEY (`demand_org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `deal_barcode`
ADD FOREIGN KEY (`deal_id`) REFERENCES `deal` (`deal_id`);
ALTER TABLE `barcode_scan_log`
ADD FOREIGN KEY (`barcode_id`) REFERENCES `deal_barcode` (`barcode_id`);
ALTER TABLE `barcode_scan_log`
ADD FOREIGN KEY (`deal_id`) REFERENCES `deal` (`deal_id`);
ALTER TABLE `barcode_scan_log`
ADD FOREIGN KEY (`scanned_by_org`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `notification`
ADD FOREIGN KEY (`org_id`) REFERENCES `organisation` (`org_id`);
ALTER TABLE `saved_match`
ADD FOREIGN KEY (`org_id`) REFERENCES `organisation` (`org_id`);