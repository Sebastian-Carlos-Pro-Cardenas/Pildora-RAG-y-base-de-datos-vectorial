import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const createPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL
  });
};

export default createPool;