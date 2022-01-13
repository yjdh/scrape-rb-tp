import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_NAME:string|undefined = process.env.DB_NAME;
const DB_USERNAME:string|undefined = process.env.DB_USERNAME;
const DB_HOST:string|undefined = process.env.DB_HOST;
const DB_PASSWORD:string|undefined = process.env.DB_PASSWORD;
const POOL_SIZE:number = 10;

if (!DB_NAME || !DB_USERNAME || !DB_HOST || !DB_PASSWORD) {
  throw new Error('Please set up your database credentials in .env file');
}

const pool = mysql.createPool({
  connectionLimit: POOL_SIZE,
  database: DB_NAME,
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
  },
});

export default pool;
