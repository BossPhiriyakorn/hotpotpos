import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hotpot_kiosk_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL Database');
});
pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});
// Test query on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database test failed:', err);
    }
    else {
        console.log('✅ Database test successful:', res.rows[0].now);
    }
});
export default pool;
//# sourceMappingURL=database.js.map