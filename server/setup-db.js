const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './db/gunungclimber.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
  initializeDatabase();
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hiking Itineraries table
    db.run(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        mountain_name TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('easy', 'moderate', 'hard')) DEFAULT 'moderate',
        description TEXT,
        public_transport_method TEXT,
        meeting_point TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Itinerary Details (day-by-day plan)
    db.run(`
      CREATE TABLE IF NOT EXISTS itinerary_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        description TEXT,
        location TEXT,
        activities TEXT,
        accommodation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(itinerary_id) REFERENCES itineraries(id)
      )
    `);

    // Create default admin user
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, row) => {
      if (!row) {
        db.run(
          `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
          [adminUsername, 'admin@gunungclimber.local', hashedPassword, 'Admin User', 'admin'],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('✓ Admin user created');
            }
            db.close();
            console.log('✓ Database initialized successfully');
          }
        );
      } else {
        db.close();
        console.log('✓ Database already initialized');
      }
    });
  });
}
