
require('dotenv').config();
const pool = require('./connections/db');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE org_demand');
        console.log('org_demand schema:', rows);
    } catch (err) {
        console.error('Error describing org_demand:', err.message);
    }
    process.exit();
}

checkSchema();
