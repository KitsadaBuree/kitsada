import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows; // ใช้กับ SELECT
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result; // ใช้กับ INSERT/UPDATE/DELETE (คืน affectedRows, insertId)
}