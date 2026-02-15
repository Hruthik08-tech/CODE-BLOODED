
require('dotenv').config();
const pool = require('../connections/db');

async function initDemandTable() {
  try {
    console.log('[Script] Creating org_demand table if not exists...');
    
    // Check connection first
    await pool.query('SELECT 1');
    console.log('[Script] DB Connected');

    const createTableQuery = `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createTableQuery);
    console.log('[Script] org_demand table created/verified successfully.');
    
    process.exit(0);
  } catch (err) {
    console.error('[Script] Error creating table:', err);
    process.exit(1);
  }
}

initDemandTable();
