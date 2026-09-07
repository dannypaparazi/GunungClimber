const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './db/gunungclimber.db';

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  console.log('Connected to SQLite database');

  // Users table
  db.exec(`
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
  db.exec(`
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

  // Itinerary Details table
  db.exec(`
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

  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const existingUser = stmt.get(adminUsername);

  if (!existingUser) {
    const insertStmt = db.prepare(
      `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`
    );
    insertStmt.run(adminUsername, 'admin@gunungclimber.local', hashedPassword, 'Admin User', 'admin');
    console.log('✓ Admin user created');
  }

  db.close();
  console.log('✓ Database initialized successfully');
  process.exit(0);
} catch (err) {
  console.error('Error initializing database:', err);
  process.exit(1);
}
