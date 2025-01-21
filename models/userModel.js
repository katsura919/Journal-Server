const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite3');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT, 
      username TEXT UNIQUE,
      firstname TEXT,
      lastname TEXT, 
      email TEXT UNIQUE,
      password TEXT
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      title TEXT,
      content TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
      deleted_at DATETIME,        
      version INTEGER NOT NULL DEFAULT 1 
    );
  `);
  
});

module.exports = db;
