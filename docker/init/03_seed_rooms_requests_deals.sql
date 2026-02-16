-- ================================================================
--  SEED DATA — ROOMS, REQUESTS, DEALS & FULL LIFECYCLE
--  For organisation CODE BLOODED (org_id = 1)
--  Auto-loaded by Docker mysql init pipeline.
-- ================================================================
-- ────────────────────────────────────────────────────────
--  MODULE A — SUPPLIES FOR CODE BLOODED (org_id = 1)
--  supply_id starts from 39 to avoid conflict with existing 1-38
-- ────────────────────────────────────────────────────────
INSERT INTO `org_supply` (
        `supply_id`,
        `org_id`,
        `category_id`,
        `item_name`,
        `item_description`,
        `price_per_unit`,
        `currency`,
        `quantity`,
        `quantity_unit`,
        `min_order_qty`,
        `expiry_date`,
        `location_label`,
        `supplier_name`,
        `supplier_phone`,
        `supplier_email`,
        `supplier_address`,
        `is_active`,
        `is_flagged`,
        `version`,
        `created_at`,
        `updated_at`
    )
VALUES (
        39,
        1,
        4,
        'Custom Software Development Services',
        'End-to-end custom software development including web apps, mobile apps, and API integrations. Agile methodology, CI/CD pipelines, and dedicated project management. Tech stack: React, Node.js, Python, and cloud deployments on AWS/GCP.',
        150000.00,
        'INR',
        50,
        'project',
        1,
        NULL,
        'CODE BLOODED HQ — MG Road, Shivaji Nagar, Bangalore',
        'CODE BLOODED',
        '+91-9800000001',
        'projects@codeblooded.dev',
        '12, MG Road, Shivaji Nagar, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    ),
    (
        40,
        1,
        18,
        'IoT Prototype Development Kit',
        'Custom IoT prototyping service including hardware selection, firmware development, cloud integration (MQTT/HTTP), and dashboard. Includes ESP32/STM32 boards, sensors, and 3D-printed enclosures.',
        45000.00,
        'INR',
        100,
        'kit',
        5,
        NULL,
        'CODE BLOODED Lab — MG Road, Bangalore',
        'CODE BLOODED R&D',
        '+91-9800000001',
        'iot@codeblooded.dev',
        '12, MG Road, Shivaji Nagar, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    ),
    (
        41,
        1,
        19,
        'Enterprise Cloud Migration Service',
        'Full-stack enterprise cloud migration consulting and execution. Assessment, planning, migration, testing, and production cutover. Supports AWS, GCP, and Azure. Includes 3 months of post-migration support.',
        250000.00,
        'INR',
        20,
        'project',
        1,
        NULL,
        'CODE BLOODED HQ — MG Road, Bangalore',
        'CODE BLOODED Cloud Team',
        '+91-9800000001',
        'cloud@codeblooded.dev',
        '12, MG Road, Shivaji Nagar, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    );
-- Supply history for CODE BLOODED supplies
INSERT INTO `org_supply_history` (
        `supply_id`,
        `version`,
        `changed_by_org`,
        `change_type`,
        `item_name`,
        `item_description`,
        `price_per_unit`,
        `currency`,
        `quantity`,
        `quantity_unit`,
        `expiry_date`,
        `category_id`,
        `is_active`,
        `changed_at`
    )
SELECT `supply_id`,
    1,
    `org_id`,
    'created',
    `item_name`,
    `item_description`,
    `price_per_unit`,
    `currency`,
    `quantity`,
    `quantity_unit`,
    `expiry_date`,
    `category_id`,
    `is_active`,
    `created_at`
FROM `org_supply`
WHERE `supply_id` BETWEEN 39 AND 41;
-- ────────────────────────────────────────────────────────
--  MODULE B — DEMANDS FOR CODE BLOODED (org_id = 1)
--  demand_id starts from 39 to avoid conflict with existing 1-38
-- ────────────────────────────────────────────────────────
INSERT INTO `org_demand` (
        `demand_id`,
        `org_id`,
        `category_id`,
        `item_name`,
        `item_description`,
        `min_price_per_unit`,
        `max_price_per_unit`,
        `currency`,
        `quantity`,
        `quantity_unit`,
        `min_order_qty`,
        `required_by_date`,
        `required_by`,
        `delivery_location`,
        `is_active`,
        `is_flagged`,
        `version`,
        `created_at`,
        `updated_at`
    )
VALUES (
        39,
        1,
        19,
        'Business Laptops for Development Team',
        'Require high-performance business laptops for our development team. Intel i5/i7 12th Gen or above, 16GB RAM preferred, 512GB SSD minimum, 15.6" FHD display. Windows 11 Pro.',
        48000.00,
        60000.00,
        'INR',
        25,
        'unit',
        5,
        '2026-03-31',
        '2026-03-31',
        'CODE BLOODED HQ — 12, MG Road, Shivaji Nagar, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    ),
    (
        40,
        1,
        18,
        'Electronic Components for IoT Projects',
        'Looking for bulk supply of Arduino Uno R3, ESP32 modules, assorted sensors (DHT22, BMP280, MQ-series gas sensors), and passive component kits for our IoT prototyping division.',
        250.00,
        500.00,
        'INR',
        500,
        'unit',
        50,
        '2026-04-15',
        '2026-04-15',
        'CODE BLOODED Lab — MG Road, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    ),
    (
        41,
        1,
        24,
        'Short-Term Office Warehouse Storage',
        'Need short-term warehouse or storage space for equipment, servers, and office supplies during our office expansion. 30-50 pallet positions for 2-3 months.',
        35.00,
        55.00,
        'INR',
        50,
        'pallet-day',
        20,
        '2026-04-01',
        '2026-04-01',
        'Preferred: Shivaji Nagar / MG Road / Indiranagar area, Bangalore',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    ),
    (
        42,
        1,
        13,
        'Packaged Snacks for Office Pantry',
        'Looking for bulk packaged snacks (roasted peanuts, trail mix, energy bars) for our office pantry. Monthly supply, hygienically packed.',
        40.00,
        70.00,
        'INR',
        500,
        'unit',
        100,
        '2026-03-15',
        '2026-03-15',
        'CODE BLOODED Office — MG Road, Bangalore - 560001',
        TRUE,
        FALSE,
        1,
        NOW(),
        NOW()
    );
-- Demand history for CODE BLOODED demands
INSERT INTO `org_demand_history` (
        `demand_id`,
        `version`,
        `changed_by_org`,
        `change_type`,
        `item_name`,
        `item_description`,
        `min_price_per_unit`,
        `max_price_per_unit`,
        `currency`,
        `quantity`,
        `quantity_unit`,
        `required_by_date`,
        `category_id`,
        `is_active`,
        `changed_at`
    )
SELECT `demand_id`,
    1,
    `org_id`,
    'created',
    `item_name`,
    `item_description`,
    `min_price_per_unit`,
    `max_price_per_unit`,
    `currency`,
    `quantity`,
    `quantity_unit`,
    `required_by_date`,
    `category_id`,
    `is_active`,
    `created_at`
FROM `org_demand`
WHERE `demand_id` BETWEEN 39 AND 42;
-- ════════════════════════════════════════════════════════════
--  MODULE C — MATCH RESULTS
--  Matches between CODE BLOODED's demands and other org supplies
-- ════════════════════════════════════════════════════════════
INSERT INTO `match_result` (
        `match_id`,
        `supply_id`,
        `demand_id`,
        `searched_by_org`,
        `search_direction`,
        `confidence_score`,
        `name_score`,
        `description_score`,
        `price_score`,
        `category_score`,
        `status`,
        `ai_model_version`,
        `created_at`
    )
VALUES -- Match 1: CODE BLOODED demand 39 (laptops) matched with NexGen supply 25 (laptops)
    (
        1,
        25,
        39,
        1,
        'demand_to_supply',
        92.50,
        88.00,
        90.00,
        95.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 2: CODE BLOODED demand 40 (electronics) matched with TechParts supply 7 (Arduino)
    (
        2,
        7,
        40,
        1,
        'demand_to_supply',
        87.30,
        82.00,
        85.00,
        90.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 3: CODE BLOODED demand 40 (electronics) matched with TechParts supply 8 (passive kit)
    (
        3,
        8,
        40,
        1,
        'demand_to_supply',
        81.00,
        75.00,
        80.00,
        88.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 4: CODE BLOODED demand 41 (warehouse) matched with CloudStore supply 37
    (
        4,
        37,
        41,
        1,
        'demand_to_supply',
        89.20,
        85.00,
        88.00,
        92.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 5: CODE BLOODED demand 42 (snacks) matched with FreshBowl supply 10 (peanuts)
    (
        5,
        10,
        42,
        1,
        'demand_to_supply',
        84.60,
        80.00,
        82.00,
        90.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 6: NexGen demand 25 (components) matched with CODE BLOODED supply 40 (IoT kit)
    (
        6,
        40,
        25,
        14,
        'demand_to_supply',
        78.50,
        72.00,
        80.00,
        75.00,
        100.00,
        'saved',
        'v2.1-flexible',
        NOW()
    ),
    -- Match 7: CODE BLOODED demand 39 (laptops) matched with NexGen supply 26 (IoT sensors) - secondary match
    (
        7,
        26,
        39,
        1,
        'demand_to_supply',
        65.00,
        55.00,
        60.00,
        70.00,
        100.00,
        'dismissed',
        'v2.1-flexible',
        NOW()
    );
-- ════════════════════════════════════════════════════════════
--  MODULE D — REQUESTS
--  Various statuses: pending, accepted, rejected, cancelled
-- ════════════════════════════════════════════════════════════
INSERT INTO `requests` (
        `request_id`,
        `match_id`,
        `supply_id`,
        `demand_id`,
        `requested_by`,
        `requested_to`,
        `match_score`,
        `supply_name_snapshot`,
        `demand_name_snapshot`,
        `message`,
        `rejection_reason`,
        `status`,
        `created_at`,
        `updated_at`
    )
VALUES -- Request 1: CODE BLOODED → NexGen for laptops (ACCEPTED - Room 1 created)
    (
        1,
        1,
        25,
        39,
        1,
        14,
        92.50,
        'Business Laptops (Intel i5, 8GB RAM, 512GB SSD)',
        'Business Laptops for Development Team',
        'Hi NexGen, we are CODE BLOODED — a software development company based in Bangalore. We need 25 business laptops for our growing development team. Your listing matches our requirements perfectly. Can we discuss bulk pricing and delivery timelines?',
        NULL,
        'accepted',
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    -- Request 2: CODE BLOODED → TechParts for Arduino boards (ACCEPTED - Room 2 created)
    (
        2,
        2,
        7,
        40,
        1,
        5,
        87.30,
        'Arduino Uno R3 Microcontroller Boards',
        'Electronic Components for IoT Projects',
        'Hello TechParts Hub, we are working on multiple IoT projects and need a steady supply of Arduino Uno R3 boards. We saw your listing and would like to negotiate bulk pricing for 200+ units. Please share your best rates.',
        NULL,
        'accepted',
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    -- Request 3: CODE BLOODED → CloudStore for warehouse (ACCEPTED - Room 3 with completed deal)
    (
        3,
        4,
        37,
        41,
        1,
        20,
        89.20,
        'Shared Dry Warehouse Space (Rack & Floor)',
        'Short-Term Office Warehouse Storage',
        'Hi CloudStore, we need short-term warehouse space for our office expansion. Your Marathahalli facility looks ideal. Can we discuss availability and rates for 30-50 pallet positions over 2-3 months?',
        NULL,
        'accepted',
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        DATE_SUB(NOW(), INTERVAL 13 DAY)
    ),
    -- Request 4: CODE BLOODED → FreshBowl for snacks (PENDING)
    (
        4,
        5,
        10,
        42,
        1,
        6,
        84.60,
        'Packaged Roasted Peanuts (500g)',
        'Packaged Snacks for Office Pantry',
        'Hello FreshBowl Foods, we are looking for monthly supply of packaged snacks for our office pantry (40+ team). Your roasted peanuts look great. Can you share bulk rates and delivery schedule?',
        NULL,
        'pending',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- Request 5: NexGen → CODE BLOODED for IoT kits (ACCEPTED - Room 4 created)
    (
        5,
        6,
        40,
        25,
        14,
        1,
        78.50,
        'IoT Prototype Development Kit',
        'Electronic Components — Microcontrollers and Sensors',
        'Hi CODE BLOODED, we noticed your IoT Prototype Development Kit listing. We are NexGen Electronics and are interested in reselling your IoT kits bundled with our sensor products. Can we set up a partnership?',
        NULL,
        'accepted',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    -- Request 6: GreenHarvest → CODE BLOODED for software (PENDING - received)
    (
        6,
        NULL,
        39,
        NULL,
        2,
        1,
        NULL,
        'Custom Software Development Services',
        NULL,
        'Hello CODE BLOODED, we are GreenHarvest Agri. We need a custom supply chain management software for tracking our farm-to-warehouse operations. Can you share a quote for this kind of project?',
        NULL,
        'pending',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    -- Request 7: MediSource → CODE BLOODED for software (ACCEPTED - Room 5 with active deal)
    (
        7,
        NULL,
        39,
        NULL,
        4,
        1,
        NULL,
        'Custom Software Development Services',
        NULL,
        'Hi CODE BLOODED, MediSource India here. We need a custom hospital inventory management system with IoT sensor integration for cold chain monitoring. Interested in discussing scope and timelines.',
        NULL,
        'accepted',
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        DATE_SUB(NOW(), INTERVAL 19 DAY)
    ),
    -- Request 8: SwiftLogix → CODE BLOODED for cloud migration (REJECTED)
    (
        8,
        NULL,
        41,
        NULL,
        3,
        1,
        NULL,
        'Enterprise Cloud Migration Service',
        NULL,
        'Hello, we are SwiftLogix. We want to migrate our logistics tracking platform to the cloud. Can you help with an AWS migration?',
        'We are currently at full capacity with ongoing projects. We recommend re-applying after April 2026 when our team bandwidth opens up.',
        'rejected',
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        DATE_SUB(NOW(), INTERVAL 14 DAY)
    ),
    -- Request 9: CODE BLOODED → TechParts for passive kits (CANCELLED)
    (
        9,
        3,
        8,
        40,
        1,
        5,
        81.00,
        'Passive Component Kit (Resistors, Capacitors, LEDs)',
        'Electronic Components for IoT Projects',
        'We are also interested in your passive component kits for our prototyping lab. However, we may consolidate this with our Arduino order.',
        NULL,
        'cancelled',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_SUB(NOW(), INTERVAL 7 DAY)
    ),
    -- Request 10: SteelForge → CODE BLOODED for software (PENDING - received)
    (
        10,
        NULL,
        39,
        NULL,
        11,
        1,
        NULL,
        'Custom Software Development Services',
        NULL,
        'Dear CODE BLOODED team, SteelForge Industries here. We need a custom ERP module for tracking steel production batches, quality checks, and dispatch. Can you share your portfolio and estimates?',
        NULL,
        'pending',
        NOW(),
        NOW()
    );
-- ════════════════════════════════════════════════════════════
--  MODULE E — REQUEST STATUS HISTORY
-- ════════════════════════════════════════════════════════════
INSERT INTO `request_status_history` (
        `request_id`,
        `changed_by_org`,
        `from_status`,
        `to_status`,
        `reason`,
        `changed_at`
    )
VALUES -- Request 1 accepted by NexGen
    (
        1,
        14,
        'pending',
        'accepted',
        NULL,
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    -- Request 2 accepted by TechParts
    (
        2,
        5,
        'pending',
        'accepted',
        NULL,
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    -- Request 3 accepted by CloudStore
    (
        3,
        20,
        'pending',
        'accepted',
        NULL,
        DATE_SUB(NOW(), INTERVAL 13 DAY)
    ),
    -- Request 5 accepted by CODE BLOODED
    (
        5,
        1,
        'pending',
        'accepted',
        NULL,
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    -- Request 7 accepted by CODE BLOODED
    (
        7,
        1,
        'pending',
        'accepted',
        NULL,
        DATE_SUB(NOW(), INTERVAL 19 DAY)
    ),
    -- Request 8 rejected by CODE BLOODED
    (
        8,
        1,
        'pending',
        'rejected',
        'At full capacity — re-apply after April 2026.',
        DATE_SUB(NOW(), INTERVAL 14 DAY)
    ),
    -- Request 9 cancelled by CODE BLOODED
    (
        9,
        1,
        'pending',
        'cancelled',
        'Consolidated with Arduino board order.',
        DATE_SUB(NOW(), INTERVAL 7 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE F — BUSINESS ROOMS
--  Created from accepted requests
-- ════════════════════════════════════════════════════════════
INSERT INTO `business_room` (
        `room_id`,
        `request_id`,
        `org_id_1`,
        `org_id_2`,
        `supply_id`,
        `demand_id`,
        `supply_name_snapshot`,
        `demand_name_snapshot`,
        `status`,
        `room_status`,
        `created_at`,
        `updated_at`
    )
VALUES -- Room 1: CODE BLOODED ↔ NexGen Electronics (laptops) — in_progress
    (
        1,
        1,
        1,
        14,
        25,
        39,
        'Business Laptops (Intel i5, 8GB RAM, 512GB SSD)',
        'Business Laptops for Development Team',
        'in_progress',
        'active',
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- Room 2: CODE BLOODED ↔ TechParts Hub (Arduino) — in_progress
    (
        2,
        2,
        1,
        5,
        7,
        40,
        'Arduino Uno R3 Microcontroller Boards',
        'Electronic Components for IoT Projects',
        'in_progress',
        'active',
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    -- Room 3: CODE BLOODED ↔ CloudStore (warehouse) — success (deal completed)
    (
        3,
        3,
        1,
        20,
        37,
        41,
        'Shared Dry Warehouse Space (Rack & Floor)',
        'Short-Term Office Warehouse Storage',
        'success',
        'success',
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    -- Room 4: NexGen ↔ CODE BLOODED (IoT kits) — in_progress
    (
        4,
        5,
        14,
        1,
        40,
        25,
        'IoT Prototype Development Kit',
        'Electronic Components — Microcontrollers and Sensors',
        'in_progress',
        'active',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- Room 5: MediSource ↔ CODE BLOODED (software) — success (deal active)
    (
        5,
        7,
        4,
        1,
        39,
        NULL,
        'Custom Software Development Services',
        NULL,
        'success',
        'success',
        DATE_SUB(NOW(), INTERVAL 19 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE G — BUSINESS ROOM STATUS HISTORY
-- ════════════════════════════════════════════════════════════
INSERT INTO `business_room_status_history` (
        `room_id`,
        `changed_by_org`,
        `from_status`,
        `to_status`,
        `note`,
        `changed_at`
    )
VALUES -- Room 3 completed
    (
        3,
        1,
        'active',
        'in_progress',
        'Started final negotiations.',
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    (
        3,
        20,
        'in_progress',
        'success',
        'Agreement reached on pricing and duration.',
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    -- Room 5 completed
    (
        5,
        1,
        'active',
        'in_progress',
        'Scope discussion started.',
        DATE_SUB(NOW(), INTERVAL 17 DAY)
    ),
    (
        5,
        4,
        'in_progress',
        'success',
        'Project scope and milestones finalised.',
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE H — ROOM MESSAGES
--  Realistic conversations in business rooms
-- ════════════════════════════════════════════════════════════
INSERT INTO `room_message` (
        `room_id`,
        `sender_org_id`,
        `content`,
        `message_text`,
        `message_type`,
        `created_at`,
        `sent_at`
    )
VALUES -- ──── Room 1: CODE BLOODED ↔ NexGen (Laptops) ────
    (
        1,
        1,
        'Hi NexGen! Thanks for accepting our request. We need 25 business laptops — Intel i5 12th Gen, 8GB RAM, 512GB SSD. What is your best bulk price?',
        'Hi NexGen! Thanks for accepting our request. We need 25 business laptops — Intel i5 12th Gen, 8GB RAM, 512GB SSD. What is your best bulk price?',
        'text',
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    (
        1,
        14,
        'Hello CODE BLOODED! For 25 units, we can offer ₹49,500 per unit (down from ₹52,000 list price). Delivery within 7-10 working days after PO confirmation.',
        'Hello CODE BLOODED! For 25 units, we can offer ₹49,500 per unit (down from ₹52,000 list price). Delivery within 7-10 working days after PO confirmation.',
        'text',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        1,
        1,
        'That sounds good! Can you do 16GB RAM instead of 8GB? We are running Docker containers and IDEs so 8GB may not be enough.',
        'That sounds good! Can you do 16GB RAM instead of 8GB? We are running Docker containers and IDEs so 8GB may not be enough.',
        'text',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    (
        1,
        14,
        'For 16GB RAM config, the price would be ₹54,000 per unit. We can also include a 3-year on-site warranty at this price point.',
        'For 16GB RAM config, the price would be ₹54,000 per unit. We can also include a 3-year on-site warranty at this price point.',
        'text',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY)
    ),
    (
        1,
        1,
        '₹54,000 with 3-year warranty works for us. Let us finalise this. Can you share the proforma invoice?',
        '₹54,000 with 3-year warranty works for us. Let us finalise this. Can you share the proforma invoice?',
        'text',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- ──── Room 2: CODE BLOODED ↔ TechParts (Arduino) ────
    (
        2,
        1,
        'Hi TechParts! We need 200 Arduino Uno R3 boards initially, with potential for 300 more next quarter. What bulk rate can you offer?',
        'Hi TechParts! We need 200 Arduino Uno R3 boards initially, with potential for 300 more next quarter. What bulk rate can you offer?',
        'text',
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    (
        2,
        5,
        'Hi CODE BLOODED! For 200 units, we can do ₹340 per board (list price ₹380). If you commit to 500 over two quarters, we can drop to ₹320.',
        'Hi CODE BLOODED! For 200 units, we can do ₹340 per board (list price ₹380). If you commit to 500 over two quarters, we can drop to ₹320.',
        'text',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_SUB(NOW(), INTERVAL 8 DAY)
    ),
    (
        2,
        1,
        'The 500-unit commitment at ₹320 works for us. Can you also bundle some jumper wires and breadboards?',
        'The 500-unit commitment at ₹320 works for us. Can you also bundle some jumper wires and breadboards?',
        'text',
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        DATE_SUB(NOW(), INTERVAL 7 DAY)
    ),
    (
        2,
        5,
        'Sure! We can add a 65-piece jumper wire set and a 830-point breadboard per 10 Arduino units at no extra cost. Shall I prepare the quote?',
        'Sure! We can add a 65-piece jumper wire set and a 830-point breadboard per 10 Arduino units at no extra cost. Shall I prepare the quote?',
        'text',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        2,
        1,
        'Perfect, please go ahead with the quote. We will process the PO by end of this week.',
        'Perfect, please go ahead with the quote. We will process the PO by end of this week.',
        'text',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    -- ──── Room 3: CODE BLOODED ↔ CloudStore (Warehouse) — COMPLETED ────
    (
        3,
        1,
        'Hi CloudStore! We need about 40 pallet positions in your Marathahalli facility for 2-3 months. Our office expansion is creating a temporary storage need.',
        'Hi CloudStore! We need about 40 pallet positions in your Marathahalli facility for 2-3 months. Our office expansion is creating a temporary storage need.',
        'text',
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        DATE_SUB(NOW(), INTERVAL 13 DAY)
    ),
    (
        3,
        20,
        'Hello CODE BLOODED! We have availability. For 40 pallets, we can offer ₹40/pallet/day (standard rate ₹45). Minimum commitment 30 days.',
        'Hello CODE BLOODED! We have availability. For 40 pallets, we can offer ₹40/pallet/day (standard rate ₹45). Minimum commitment 30 days.',
        'text',
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        DATE_SUB(NOW(), INTERVAL 12 DAY)
    ),
    (
        3,
        1,
        'That rate works for us. Can we start next Monday? We will need access 6 days a week, 8 AM to 8 PM.',
        'That rate works for us. Can we start next Monday? We will need access 6 days a week, 8 AM to 8 PM.',
        'text',
        DATE_SUB(NOW(), INTERVAL 11 DAY),
        DATE_SUB(NOW(), INTERVAL 11 DAY)
    ),
    (
        3,
        20,
        'Confirmed! Access card will be arranged. I am marking this deal as finalised. Welcome aboard!',
        'Confirmed! Access card will be arranged. I am marking this deal as finalised. Welcome aboard!',
        'text',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    -- ──── Room 4: NexGen ↔ CODE BLOODED (IoT Kits) ────
    (
        4,
        14,
        'Hi CODE BLOODED! We are interested in your IoT Prototype Development Kit for bundling with our sensor products. Can you share technical specs and pricing for 50 kits?',
        'Hi CODE BLOODED! We are interested in your IoT Prototype Development Kit for bundling with our sensor products. Can you share technical specs and pricing for 50 kits?',
        'text',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    (
        4,
        1,
        'Hello NexGen! Each kit includes ESP32 board, 5 sensors (temp, humidity, gas, motion, light), custom firmware, cloud dashboard access, and a 3D-printed enclosure. For 50 kits: ₹40,000/kit.',
        'Hello NexGen! Each kit includes ESP32 board, 5 sensors (temp, humidity, gas, motion, light), custom firmware, cloud dashboard access, and a 3D-printed enclosure. For 50 kits: ₹40,000/kit.',
        'text',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY)
    ),
    (
        4,
        14,
        'Interesting! Can you do a white-label version where we put our NexGen branding on the enclosure and dashboard? We would order 100 kits if so.',
        'Interesting! Can you do a white-label version where we put our NexGen branding on the enclosure and dashboard? We would order 100 kits if so.',
        'text',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    (
        4,
        1,
        'Absolutely! White-label is available. For 100 kits with custom branding: ₹38,000/kit. Let me prepare a detailed proposal.',
        'Absolutely! White-label is available. For 100 kits with custom branding: ₹38,000/kit. Let me prepare a detailed proposal.',
        'text',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- ──── Room 5: MediSource ↔ CODE BLOODED (Software) — COMPLETED ────
    (
        5,
        4,
        'Hi CODE BLOODED! We need a custom hospital inventory management system. Key features: real-time stock tracking, IoT cold chain monitoring, expiry alerts, and vendor management.',
        'Hi CODE BLOODED! We need a custom hospital inventory management system. Key features: real-time stock tracking, IoT cold chain monitoring, expiry alerts, and vendor management.',
        'text',
        DATE_SUB(NOW(), INTERVAL 19 DAY),
        DATE_SUB(NOW(), INTERVAL 19 DAY)
    ),
    (
        5,
        1,
        'Hello MediSource! This is right up our alley. We have experience building healthcare and IoT systems. For the scope described, we estimate 4-5 months of development. Budget range: ₹12-15 lakhs.',
        'Hello MediSource! This is right up our alley. We have experience building healthcare and IoT systems. For the scope described, we estimate 4-5 months of development. Budget range: ₹12-15 lakhs.',
        'text',
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        DATE_SUB(NOW(), INTERVAL 18 DAY)
    ),
    (
        5,
        4,
        'Budget is within our range. Can we add a mobile app for warehouse staff? Also, need integration with our existing ERP system.',
        'Budget is within our range. Can we add a mobile app for warehouse staff? Also, need integration with our existing ERP system.',
        'text',
        DATE_SUB(NOW(), INTERVAL 17 DAY),
        DATE_SUB(NOW(), INTERVAL 17 DAY)
    ),
    (
        5,
        1,
        'Mobile app is included. ERP integration will add ₹2 lakhs to the scope. Total: ₹14 lakhs, 5-month timeline, 3 milestone payments. Shall I send the formal SOW?',
        'Mobile app is included. ERP integration will add ₹2 lakhs to the scope. Total: ₹14 lakhs, 5-month timeline, 3 milestone payments. Shall I send the formal SOW?',
        'text',
        DATE_SUB(NOW(), INTERVAL 16 DAY),
        DATE_SUB(NOW(), INTERVAL 16 DAY)
    ),
    (
        5,
        4,
        'Yes, please send the SOW. We are ready to proceed. Let us finalise the deal!',
        'Yes, please send the SOW. We are ready to proceed. Let us finalise the deal!',
        'text',
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE I — DEALS
--  Created from successful business rooms
-- ════════════════════════════════════════════════════════════
INSERT INTO `deal` (
        `deal_id`,
        `room_id`,
        `supply_org_id`,
        `demand_org_id`,
        `supply_id`,
        `demand_id`,
        `supply_name_snapshot`,
        `demand_name_snapshot`,
        `agreed_price_per_unit`,
        `agreed_price`,
        `agreed_quantity`,
        `quantity`,
        `quantity_unit`,
        `currency`,
        `total_value`,
        `deal_status`,
        `notes`,
        `qr_code_data`,
        `qr_token`,
        `finalized_at`,
        `created_at`,
        `updated_at`
    )
VALUES -- Deal 1: CloudStore warehouse deal (COMPLETED)
    (
        1,
        3,
        20,
        1,
        37,
        41,
        'Shared Dry Warehouse Space (Rack & Floor)',
        'Short-Term Office Warehouse Storage',
        40.00,
        40.00,
        40,
        40,
        'pallet-day',
        'INR',
        96000.00,
        'completed',
        'Warehouse storage for 40 pallets at ₹40/pallet/day for 60 days. Access 6 days/week, 8AM-8PM. Access cards issued.',
        '{"deal_token":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2","room_id":3,"supply_org_id":20,"demand_org_id":1,"supply_name":"Shared Dry Warehouse Space (Rack & Floor)","demand_name":"Short-Term Office Warehouse Storage","timestamp":"2026-02-01T10:00:00.000Z","platform":"GENYSIS"}',
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        NOW()
    ),
    -- Deal 2: MediSource software deal (ACTIVE)
    (
        2,
        5,
        1,
        4,
        39,
        NULL,
        'Custom Software Development Services',
        NULL,
        1400000.00,
        1400000.00,
        1,
        1,
        'project',
        'INR',
        1400000.00,
        'active',
        'Hospital Inventory Management System with IoT cold chain monitoring. 5-month timeline, 3 milestone payments: 40% upfront, 30% at mid-review, 30% at delivery. Includes mobile app and ERP integration.',
        '{"deal_token":"f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1","room_id":5,"supply_org_id":1,"demand_org_id":4,"supply_name":"Custom Software Development Services","demand_name":null,"timestamp":"2026-01-26T10:00:00.000Z","platform":"GENYSIS"}',
        'f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1',
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE J — DEAL BARCODES
-- ════════════════════════════════════════════════════════════
INSERT INTO `deal_barcode` (
        `deal_id`,
        `barcode_version`,
        `is_current`,
        `qr_payload`,
        `hmac_signature`,
        `qr_image_url`,
        `is_active`,
        `issued_at`,
        `expires_at`
    )
VALUES -- Barcode for Deal 1 (completed warehouse deal)
    (
        1,
        1,
        TRUE,
        'GENYSIS-DEAL-001-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        'hmac_sha256_deal1_v1_signature_placeholder',
        '/qr/deal_1_v1.png',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_ADD(NOW(), INTERVAL 90 DAY)
    ),
    -- Barcode for Deal 2 (active software deal)
    (
        2,
        1,
        TRUE,
        'GENYSIS-DEAL-002-f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1',
        'hmac_sha256_deal2_v1_signature_placeholder',
        '/qr/deal_2_v1.png',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_ADD(NOW(), INTERVAL 180 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE K — BARCODE SCAN LOGS
-- ════════════════════════════════════════════════════════════
INSERT INTO `barcode_scan_log` (
        `barcode_id`,
        `deal_id`,
        `scanned_by_org`,
        `scan_result`,
        `is_verified`,
        `ip_address`,
        `device_info`,
        `latitude`,
        `longitude`,
        `scanned_at`
    )
VALUES -- Deal 1 scanned by CODE BLOODED (verified)
    (
        1,
        1,
        1,
        'verified',
        TRUE,
        '192.168.1.100',
        'Chrome/120.0 on Windows 11',
        12.975922,
        77.607362,
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    -- Deal 1 scanned by CloudStore (verified)
    (
        1,
        1,
        20,
        'verified',
        TRUE,
        '192.168.1.200',
        'Chrome/120.0 on macOS',
        12.956400,
        77.700900,
        DATE_SUB(NOW(), INTERVAL 3 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE L — SAVED MATCHES
-- ════════════════════════════════════════════════════════════
INSERT INTO `saved_match` (
        `org_id`,
        `source_type`,
        `source_id`,
        `matched_type`,
        `matched_id`,
        `match_score`,
        `action`,
        `created_at`
    )
VALUES -- CODE BLOODED saved matches
    (
        1,
        'demand',
        39,
        'supply',
        25,
        92.50,
        'saved',
        DATE_SUB(NOW(), INTERVAL 8 DAY)
    ),
    (
        1,
        'demand',
        40,
        'supply',
        7,
        87.30,
        'saved',
        DATE_SUB(NOW(), INTERVAL 11 DAY)
    ),
    (
        1,
        'demand',
        41,
        'supply',
        37,
        89.20,
        'saved',
        DATE_SUB(NOW(), INTERVAL 15 DAY)
    ),
    (
        1,
        'demand',
        42,
        'supply',
        10,
        84.60,
        'saved',
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    (
        1,
        'demand',
        39,
        'supply',
        26,
        65.00,
        'dismissed',
        DATE_SUB(NOW(), INTERVAL 8 DAY)
    );
-- ════════════════════════════════════════════════════════════
--  MODULE M — NOTIFICATIONS
--  Comprehensive notifications for all activities
-- ════════════════════════════════════════════════════════════
INSERT INTO `notification` (
        `org_id`,
        `type`,
        `reference_id`,
        `reference_type`,
        `title`,
        `message`,
        `is_read`,
        `read_at`,
        `created_at`
    )
VALUES -- ── Request notifications ──
    -- Request 1: CODE BLOODED sent to NexGen
    (
        14,
        'request_received',
        1,
        'request',
        'New Request Received',
        'You received a new matching request for Business Laptops (Intel i5, 8GB RAM, 512GB SSD).',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_SUB(NOW(), INTERVAL 7 DAY)
    ),
    -- Request 1 accepted
    (
        1,
        'request_accepted',
        1,
        'request',
        'Request Accepted',
        'Your request for Business Laptops (Intel i5, 8GB RAM, 512GB SSD) was accepted. A business room has been created.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    -- Request 2: CODE BLOODED sent to TechParts
    (
        5,
        'request_received',
        2,
        'request',
        'New Request Received',
        'You received a new matching request for Arduino Uno R3 Microcontroller Boards.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    -- Request 2 accepted
    (
        1,
        'request_accepted',
        2,
        'request',
        'Request Accepted',
        'Your request for Arduino Uno R3 Microcontroller Boards was accepted. A business room has been created.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    -- Request 3: CODE BLOODED sent to CloudStore
    (
        20,
        'request_received',
        3,
        'request',
        'New Request Received',
        'You received a new matching request for Shared Dry Warehouse Space (Rack & Floor).',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        DATE_SUB(NOW(), INTERVAL 14 DAY)
    ),
    -- Request 3 accepted
    (
        1,
        'request_accepted',
        3,
        'request',
        'Request Accepted',
        'Your request for Shared Dry Warehouse Space (Rack & Floor) was accepted. A business room has been created.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        DATE_SUB(NOW(), INTERVAL 13 DAY)
    ),
    -- Request 4: Pending — notification to FreshBowl
    (
        6,
        'request_received',
        4,
        'request',
        'New Request Received',
        'You received a new matching request for Packaged Roasted Peanuts (500g).',
        FALSE,
        NULL,
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    ),
    -- Request 5: NexGen sent to CODE BLOODED
    (
        1,
        'request_received',
        5,
        'request',
        'New Request Received',
        'You received a new matching request for IoT Prototype Development Kit.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    -- Request 5 accepted
    (
        14,
        'request_accepted',
        5,
        'request',
        'Request Accepted',
        'Your request for IoT Prototype Development Kit was accepted. A business room has been created.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    -- Request 6: GreenHarvest sent to CODE BLOODED (pending)
    (
        1,
        'request_received',
        6,
        'request',
        'New Request Received',
        'You received a new matching request for Custom Software Development Services from GreenHarvest Agri.',
        FALSE,
        NULL,
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    ),
    -- Request 7: MediSource sent to CODE BLOODED
    (
        1,
        'request_received',
        7,
        'request',
        'New Request Received',
        'You received a new matching request for Custom Software Development Services from MediSource India.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 19 DAY),
        DATE_SUB(NOW(), INTERVAL 20 DAY)
    ),
    -- Request 7 accepted
    (
        4,
        'request_accepted',
        7,
        'request',
        'Request Accepted',
        'Your request for Custom Software Development Services was accepted. A business room has been created.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        DATE_SUB(NOW(), INTERVAL 19 DAY)
    ),
    -- Request 8: SwiftLogix rejected
    (
        3,
        'request_rejected',
        8,
        'request',
        'Request Rejected',
        'Your request for Enterprise Cloud Migration Service was rejected. Reason: At full capacity — re-apply after April 2026.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        DATE_SUB(NOW(), INTERVAL 14 DAY)
    ),
    -- Request 10: SteelForge sent to CODE BLOODED (pending, just now)
    (
        1,
        'request_received',
        10,
        'request',
        'New Request Received',
        'You received a new matching request for Custom Software Development Services from SteelForge Industries.',
        FALSE,
        NULL,
        NOW()
    ),
    -- ── Room / message notifications ──
    (
        14,
        'new_message',
        1,
        'business_room',
        'New Message',
        'New message in your business room regarding Business Laptops.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 6 DAY)
    ),
    (
        1,
        'new_message',
        1,
        'business_room',
        'New Message',
        'New message in your business room regarding Business Laptops.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        5,
        'new_message',
        2,
        'business_room',
        'New Message',
        'New message in your business room regarding Arduino Uno R3.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_SUB(NOW(), INTERVAL 9 DAY)
    ),
    (
        1,
        'new_message',
        2,
        'business_room',
        'New Message',
        'New message in your business room regarding Arduino Uno R3.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 8 DAY)
    ),
    (
        1,
        'new_message',
        4,
        'business_room',
        'New Message',
        'New message in your business room regarding IoT Prototype Development Kit.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    -- ── Deal notifications ──
    -- Deal 1: CloudStore warehouse (completed)
    (
        1,
        'deal_success',
        1,
        'deal',
        'Deal Finalized!',
        'Deal for Shared Dry Warehouse Space has been successfully finalized. QR code is available.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        20,
        'deal_success',
        1,
        'deal',
        'Deal Finalized!',
        'Deal for Shared Dry Warehouse Space has been successfully finalized. QR code is available.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    -- Deal 2: MediSource software (active)
    (
        1,
        'deal_success',
        2,
        'deal',
        'Deal Finalized!',
        'Deal for Custom Software Development Services with MediSource India has been successfully finalized. QR code is available.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    (
        4,
        'deal_success',
        2,
        'deal',
        'Deal Finalized!',
        'Deal for Custom Software Development Services with CODE BLOODED has been successfully finalized. QR code is available.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    -- Barcode scanned notifications
    (
        1,
        'barcode_scanned',
        1,
        'deal',
        'QR Code Scanned',
        'The QR code for your warehouse storage deal with CloudStore has been scanned and verified.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 4 DAY)
    ),
    (
        20,
        'barcode_scanned',
        1,
        'deal',
        'QR Code Scanned',
        'The QR code for your warehouse storage deal with CODE BLOODED has been scanned and verified.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY)
    );