const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panaderia_desesperanza',
    port: process.env.DB_PORT || 3306,
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    
    pool.getConnection()
        .then(connection => {
            console.log('Conexión al Pool de MySQL establecida exitosamente.');
            connection.release();
        })
        .catch(err => {
            console.error('No se pudo conectar al MySQL:', err.message);
        });

} catch (error) {
    console.error('Error al crear el Pool de conexiones MySQL:', error);
    process.exit(1);
}

module.exports = pool;