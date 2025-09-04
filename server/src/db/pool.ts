import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

// Create SQLite database connection
const db = new Database('./quiz.db');

export const pool = {
  query: (sql: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    });
  },
  
  // Add a method for single row queries
  queryOne: (sql: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({ row });
        }
      });
    });
  }
};

export default pool;


