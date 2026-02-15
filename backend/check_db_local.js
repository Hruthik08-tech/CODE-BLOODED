const mysql = require('mysql2/promise');

async function check() {
    const config = {
        host: '127.0.0.1',
        user: 'root',
        password: 'rootpassword',
        database: 'waste_exchange'
    };
    
    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to DB');
        const [tables] = await connection.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', tableList);
        
        for (const table of tableList) {
            const [cols] = await connection.query(`DESCRIBE ${table}`);
            console.log(`Columns in ${table}:`, cols.map(c => c.Field));
        }
        await connection.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
