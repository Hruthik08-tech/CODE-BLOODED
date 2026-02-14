const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Hruthik@08',
    database: process.env.DB_NAME || 'genesys'
})

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySql server");         
});

module.exports = connection;

