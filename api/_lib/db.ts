import mysql from 'mysql2/promise';

let connection: mysql.Connection | null = null;

export async function db() {
    if (connection) {
        // Ping the connection to check if it's still alive
        try {
            await connection.ping();
            return connection;
        } catch (error) {
            connection = null; // Connection is dead, create a new one
        }
    }

    const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT } = process.env;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
        throw new Error('Database environment variables are not set');
    }

    try {
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
            port: Number(DB_PORT) || 3306,
            // Vercel might close idle connections, so this helps.
            // You might want to adjust wait_timeout in your DB as well.
            connectTimeout: 10000,
        });
        console.log("Successfully connected to the database.");
        return connection;
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        throw error;
    }
}
