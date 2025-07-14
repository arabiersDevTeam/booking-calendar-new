// src/app/api/db.js
import mysql from 'mysql2/promise';
import path from 'path';

// Log the current file path
console.log('DB config loaded from:', path.resolve(process.cwd(), 'src/app/api/db.js'));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'mithiladilshan',
  password: '123',
  database: 'bookingcalender',
  port: 4306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
