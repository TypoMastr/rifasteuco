import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool() {
    if (pool) {
        return pool;
    }

    const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT } = process.env;

    const missingVars = [];
    if (!DB_HOST) missingVars.push('DB_HOST');
    if (!DB_USER) missingVars.push('DB_USER');
    if (!DB_PASSWORD) missingVars.push('DB_PASSWORD');
    if (!DB_DATABASE) missingVars.push('DB_DATABASE');

    if (missingVars.length > 0) {
        const errorMsg = `Database environment variables are not set. Missing: ${missingVars.join(', ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
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