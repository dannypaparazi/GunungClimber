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
      meeting_lat REAL,
      meeting_lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migration: add meeting_lat/meeting_lng to existing installs that predate this feature
  const existingColumns = db.prepare('PRAGMA table_info(itineraries)').all().map((c) => c.name);
  if (!existingColumns.includes('meeting_lat')) {
    db.exec('ALTER TABLE itineraries ADD COLUMN meeting_lat REAL');
    console.log('✓ Added meeting_lat column');
  }
  if (!existingColumns.includes('meeting_lng')) {
    db.exec('ALTER TABLE itineraries ADD COLUMN meeting_lng REAL');
    console.log('✓ Added meeting_lng column');
  }
  if (!existingColumns.includes('is_public')) {
    db.exec('ALTER TABLE itineraries ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0');
    console.log('✓ Added is_public column');
  }

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

  // Friendships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      addressee_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requester_id) REFERENCES users(id),
      FOREIGN KEY(addressee_id) REFERENCES users(id),
      UNIQUE(requester_id, addressee_id)
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
