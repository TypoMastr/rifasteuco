import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool() {
    if (pool) {
        return pool;
    }

    const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
        throw new Error('Database environment variables are not set');
    }
    
    console.log("Creating new database connection pool.");
    pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        port: Number(DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 10000,
    });
    
    return pool;
}

export const db = getPool();
