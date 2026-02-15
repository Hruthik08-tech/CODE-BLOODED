
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     'localhost', // Explicitly use localhost
  port:     3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

async function checkSupplySchema() {
    try {
        const [rows] = await pool.query('DESCRIBE org_supply');
        console.log('org_supply schema:', rows);
    } catch (err) {
        console.error('Error describing org_supply:', err.message);
    }
    process.exit();
}

checkSupplySchema();
