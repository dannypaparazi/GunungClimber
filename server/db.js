const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './db/gunungclimber.db';

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Wrapper to make better-sqlite3 compatible with callback-based code
class DatabaseWrapper {
  constructor(database) {
    this.db = database;
  }

  run(sql, params, callback) {
    try {
      const stmt = this.db.prepare(sql);
      const info = stmt.run(...(Array.isArray(params) ? params : []));
      // Normalize better-sqlite3's RunResult to sqlite3's callback `this` shape
      const context = { lastID: info.lastInsertRowid, changes: info.changes };
      if (callback) callback.call(context);
      return this;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  }

  get(sql, params, callback) {
    try {
      const stmt = this.db.prepare(sql);
      const row = stmt.get(...(Array.isArray(params) ? params : []));
      if (callback) callback(null, row);
      return row;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  }

  all(sql, params, callback) {
    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...(Array.isArray(params) ? params : []));
      if (callback) callback(null, rows);
      return rows;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  }
}

module.exports = new DatabaseWrapper(db);
