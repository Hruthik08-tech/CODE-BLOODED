
require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'genesys',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true 
};

async function initDB() {
    let connection;
    try {
        console.log('[InitDB] Connecting to database...');
        try {
            connection = await mysql.createConnection(config);
        } catch(connErr) {
            console.log('[InitDB] Failed to connect, trying 127.0.0.1...');
            config.host = '127.0.0.1';
            connection = await mysql.createConnection(config);
        }
        
        console.log('[InitDB] Connected. Initializing schema...');

        // ═══════════════════════════════════════════════════
        // 1. Core tables
        // ═══════════════════════════════════════════════════
        const schema = `
            CREATE TABLE IF NOT EXISTS organisation (
                org_id INT AUTO_INCREMENT PRIMARY KEY,
                org_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                website_url VARCHAR(255),
                description TEXT,
                logo_url VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                is_suspended BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS item_category (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100) UNIQUE NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS org_supply (
                supply_id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                category_id INT,
                item_name VARCHAR(255) NOT NULL,
                item_description TEXT,
                price_per_unit DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'USD',
                quantity DECIMAL(10, 2),
                quantity_unit VARCHAR(50),
                search_radius DECIMAL(10, 2) DEFAULT 50.00,
                expiry_date DATE,
                supplier_name VARCHAR(255),
                supplier_phone VARCHAR(50),
                supplier_email VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (org_id) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES item_category(category_id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS org_demand (
                demand_id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                category_id INT,
                item_name VARCHAR(255) NOT NULL,
                item_category VARCHAR(255),
                item_description TEXT,
                max_price_per_unit DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'USD',
                quantity DECIMAL(10, 2),
                quantity_unit VARCHAR(50),
                required_by DATE,
                delivery_location VARCHAR(255),
                search_radius DECIMAL(10, 2) DEFAULT 50.00,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (org_id) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES item_category(category_id) ON DELETE SET NULL
            );
        `;

        await connection.query(schema);
        console.log('[InitDB] Core tables created/verified.');

        // ═══════════════════════════════════════════════════
        // 2. Request Management (FR-17 to FR-21)
        // ═══════════════════════════════════════════════════
        const requestsSchema = `
            CREATE TABLE IF NOT EXISTS requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                requested_by INT NOT NULL,
                requested_to INT NOT NULL,
                supply_id INT,
                demand_id INT,
                match_score DECIMAL(5, 2),
                supply_name_snapshot VARCHAR(255),
                demand_name_snapshot VARCHAR(255),
                message TEXT,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                rejection_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (requested_by) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (requested_to) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (supply_id) REFERENCES org_supply(supply_id) ON DELETE SET NULL,
                FOREIGN KEY (demand_id) REFERENCES org_demand(demand_id) ON DELETE SET NULL
            );
        `;

        await connection.query(requestsSchema);
        console.log('[InitDB] requests table created/verified.');

        // ═══════════════════════════════════════════════════
        // 3. Business Room (FR-22 to FR-27)
        // ═══════════════════════════════════════════════════
        const roomSchema = `
            CREATE TABLE IF NOT EXISTS business_room (
                room_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                org_id_1 INT NOT NULL,
                org_id_2 INT NOT NULL,
                supply_id INT,
                demand_id INT,
                supply_name_snapshot VARCHAR(255),
                demand_name_snapshot VARCHAR(255),
                status ENUM('in_progress', 'success', 'failed') DEFAULT 'in_progress',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (request_id) REFERENCES requests(request_id) ON DELETE CASCADE,
                FOREIGN KEY (org_id_1) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (org_id_2) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (supply_id) REFERENCES org_supply(supply_id) ON DELETE SET NULL,
                FOREIGN KEY (demand_id) REFERENCES org_demand(demand_id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS room_message (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                sender_org_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES business_room(room_id) ON DELETE CASCADE,
                FOREIGN KEY (sender_org_id) REFERENCES organisation(org_id) ON DELETE CASCADE
            );
        `;

        await connection.query(roomSchema);
        console.log('[InitDB] business_room + room_message tables created/verified.');

        // ═══════════════════════════════════════════════════
        // 4. Deal + QR Code (FR-28 to FR-31)
        // ═══════════════════════════════════════════════════
        const dealSchema = `
            CREATE TABLE IF NOT EXISTS deal (
                deal_id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                supply_org_id INT NOT NULL,
                demand_org_id INT NOT NULL,
                supply_id INT,
                demand_id INT,
                supply_name_snapshot VARCHAR(255),
                demand_name_snapshot VARCHAR(255),
                agreed_price DECIMAL(10, 2),
                quantity DECIMAL(10, 2),
                currency VARCHAR(10) DEFAULT 'USD',
                deal_status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                qr_code_data TEXT,
                qr_token VARCHAR(255) UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES business_room(room_id) ON DELETE CASCADE,
                FOREIGN KEY (supply_org_id) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (demand_org_id) REFERENCES organisation(org_id) ON DELETE CASCADE,
                FOREIGN KEY (supply_id) REFERENCES org_supply(supply_id) ON DELETE SET NULL,
                FOREIGN KEY (demand_id) REFERENCES org_demand(demand_id) ON DELETE SET NULL
            );
        `;

        await connection.query(dealSchema);
        console.log('[InitDB] deal table created/verified.');

        // ═══════════════════════════════════════════════════
        // 5. Notifications
        // ═══════════════════════════════════════════════════
        const notifSchema = `
            CREATE TABLE IF NOT EXISTS notification (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                reference_type VARCHAR(50),
                reference_id INT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (org_id) REFERENCES organisation(org_id) ON DELETE CASCADE
            );
        `;

        await connection.query(notifSchema);
        console.log('[InitDB] notification table created/verified.');

        // ═══════════════════════════════════════════════════
        // 6. Saved / Dismissed Matches (FR-15)
        // ═══════════════════════════════════════════════════
        const savedMatchSchema = `
            CREATE TABLE IF NOT EXISTS saved_match (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT NOT NULL,
                source_type ENUM('supply', 'demand') NOT NULL,
                source_id INT NOT NULL,
                matched_type ENUM('supply', 'demand') NOT NULL,
                matched_id INT NOT NULL,
                match_score DECIMAL(5, 2),
                action ENUM('saved', 'dismissed') NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (org_id) REFERENCES organisation(org_id) ON DELETE CASCADE,
                UNIQUE KEY unique_match (org_id, source_type, source_id, matched_type, matched_id)
            );
        `;

        await connection.query(savedMatchSchema);
        console.log('[InitDB] saved_match table created/verified.');

        // ═══════════════════════════════════════════════════
        // 7. Seed categories
        // ═══════════════════════════════════════════════════
        const categories = [
            ['Healthcare', 'healthcare'],
            ['Energy', 'energy'],
            ['Sanitation', 'sanitation'],
            ['Shelter', 'shelter'],
            ['Food', 'food'],
            ['Education', 'education'],
            ['Logistics', 'logistics'],
            ['Infrastructure', 'infrastructure'],
            ['Waste Management', 'waste-management'],
            ['Uncategorized', 'uncategorized']
        ];

        for (const [name, slug] of categories) {
             await connection.query(
                 'INSERT IGNORE INTO item_category (category_name, slug) VALUES (?, ?)',
                 [name, slug]
             );
        }
        console.log('[InitDB] Categories seeded.');

        console.log('[InitDB] ═══════════════════════════════════════');
        console.log('[InitDB]  Database initialization complete.');
        console.log('[InitDB] ═══════════════════════════════════════');
        
    } catch (err) {
        console.error('[InitDB] Error:', err);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

initDB();
