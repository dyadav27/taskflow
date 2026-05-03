const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskflow',
  user: process.env.DB_USER || 'taskflow_user',
  password: process.env.DB_PASSWORD || 'taskflow_pass',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDB = async () => {
  let retries = 10;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('[Auth Service] Connected to PostgreSQL');
      await initSchema(client);
      client.release();
      return;
    } catch (err) {
      retries--;
      console.log(`[Auth Service] DB connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) throw err;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

const initSchema = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('[Auth Service] Database schema initialized');
};

module.exports = { pool, connectDB };
