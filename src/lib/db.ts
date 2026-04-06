import Database from 'better-sqlite3';
import path from 'path';

let db: any;
try {
  db = new Database(path.join(process.cwd(), 'database.db'));
  db.pragma('journal_mode = WAL');
  console.log("Database connected successfully in WAL mode.");
} catch (err) {
  console.error("Failed to connect to database:", err);
  // Fallback to in-memory database if file fails
  db = new Database(':memory:');
  console.log("Using in-memory database as fallback.");
}

// Initialize tables
try {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'athlete',
    status TEXT DEFAULT 'active',
    parq_completed INTEGER DEFAULT 0,
    fitness_goal TEXT,
    email_notifications INTEGER DEFAULT 1,
    push_notifications INTEGER DEFAULT 1,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    metric_name TEXT,
    metric_value REAL,
    unit TEXT,
    firestore_id TEXT UNIQUE,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    log_id TEXT UNIQUE,
    food_id TEXT,
    name TEXT,
    category TEXT,
    meal TEXT,
    date TEXT,
    servings REAL,
    serving_size TEXT,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_metrics (
    user_id INTEGER PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS body_comp_history (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    week INTEGER,
    date TEXT,
    weight REAL,
    height REAL,
    bmi REAL,
    body_fat REAL,
    lean_muscle REAL,
    fat_mass REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_parq (
    user_id INTEGER PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    workout_id TEXT,
    exercise_id TEXT,
    completed INTEGER DEFAULT 0,
    date TEXT,
    edited_data TEXT,
    workout_start_time TEXT,
    workout_end_time TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, workout_id, exercise_id, date)
  );

  CREATE TABLE IF NOT EXISTS custom_foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    portion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS program_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    program_id TEXT,
    phase TEXT,
    week INTEGER,
    day INTEGER,
    completed INTEGER DEFAULT 0,
    date TEXT,
    scheduled_time TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, program_id, phase, week, day)
  );

  CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    details TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS body_composition_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_url TEXT,
    analysis TEXT,
    feedback TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fitness_overviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    overview TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_name TEXT,
    price REAL,
    square_order_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    email TEXT,
    status TEXT DEFAULT 'New Lead',
    value REAL DEFAULT 0,
    sports TEXT,
    session_requests TEXT,
    preferred_times TEXT,
    preferred_days TEXT,
    positions TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS custom_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    data TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subscription TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    workout_id TEXT,
    program_id TEXT,
    rating INTEGER,
    comment TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS program_templates (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    price REAL DEFAULT 0,
    data TEXT,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS program_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    program_id TEXT,
    assigned_by INTEGER,
    firestore_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, program_id)
  );

  CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_progress_metric_name ON progress(metric_name);
  CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON nutrition_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date);
  CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
  CREATE INDEX IF NOT EXISTS idx_program_progress_user_id ON program_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_program_progress_date ON program_progress(date);
  CREATE INDEX IF NOT EXISTS idx_body_comp_history_user_id ON body_comp_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_body_comp_history_date ON body_comp_history(date);
`);
} catch (err) {
  console.error("Failed to initialize tables:", err);
}

// Migration: Update 'user' roles to 'athlete'
try {
  db.prepare("UPDATE users SET role = 'athlete' WHERE role = 'user'").run();
} catch (err) {
  // Ignore if column doesn't exist yet or other issues
}

// Migration: Add is_read column to messages table if it doesn't exist
try {
  db.prepare('SELECT is_read FROM messages LIMIT 1').get();
} catch (err) {
  console.log('Adding is_read column to messages table...');
  db.exec('ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0');
}

// Migration: Add is_deleted and updated_at columns to messages table if they don't exist
try {
  db.prepare('SELECT is_deleted FROM messages LIMIT 1').get();
} catch (err) {
  console.log('Adding is_deleted and updated_at columns to messages table...');
  db.exec('ALTER TABLE messages ADD COLUMN is_deleted INTEGER DEFAULT 0');
  db.exec('ALTER TABLE messages ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
}

// Migration: Add uid column if it doesn't exist
try {
  db.prepare('SELECT uid FROM users LIMIT 1').get();
} catch (err) {
  console.log('Adding uid column to users table...');
  db.exec('ALTER TABLE users ADD COLUMN uid TEXT');
}

// Migration: Add fitness_goal column if it doesn't exist
try {
  db.prepare('SELECT fitness_goal FROM users LIMIT 1').get();
} catch (err) {
  console.log('Adding fitness_goal column to users table...');
  db.exec('ALTER TABLE users ADD COLUMN fitness_goal TEXT');
}

// Migration: Add avatar_url column if it doesn't exist
try {
  db.prepare('SELECT avatar_url FROM users LIMIT 1').get();
} catch (err) {
  console.log('Adding avatar_url column to users table...');
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
}

// Migration: Add workout_start_time and workout_end_time columns to workout_logs table if they don't exist
try {
  db.prepare('SELECT workout_start_time FROM workout_logs LIMIT 1').get();
} catch (err) {
  console.log('Adding workout_start_time and workout_end_time columns to workout_logs table...');
  db.exec('ALTER TABLE workout_logs ADD COLUMN workout_start_time DATETIME');
  db.exec('ALTER TABLE workout_logs ADD COLUMN workout_end_time DATETIME');
}

// Migration: Add square_order_id column to purchases table if it doesn't exist
try {
  db.prepare('SELECT square_order_id FROM purchases LIMIT 1').get();
} catch (err) {
  console.log('Adding square_order_id column to purchases table...');
  db.exec('ALTER TABLE purchases ADD COLUMN square_order_id TEXT');
}

// Migration: Add stripe_session_id column to purchases table if it doesn't exist
try {
  db.prepare('SELECT stripe_session_id FROM purchases LIMIT 1').get();
} catch (err) {
  console.log('Adding stripe_session_id column to purchases table...');
  db.exec('ALTER TABLE purchases ADD COLUMN stripe_session_id TEXT');
}

// Migration: Add status column if it doesn't exist
try {
  db.prepare('SELECT status FROM users LIMIT 1').get();
} catch (err) {
  console.log('Adding status column to users table...');
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
}

// Migration: Add notification toggle columns if they don't exist
try {
  db.prepare('SELECT email_notifications FROM users LIMIT 1').get();
} catch (err) {
  console.log('Adding notification toggle columns to users table...');
  db.exec("ALTER TABLE users ADD COLUMN email_notifications INTEGER DEFAULT 1");
  db.exec("ALTER TABLE users ADD COLUMN push_notifications INTEGER DEFAULT 1");
}

// Migration: Add firestore_id column to purchases table if it doesn't exist
try {
  db.prepare('SELECT firestore_id FROM purchases LIMIT 1').get();
} catch (err) {
  console.log('Adding firestore_id column to purchases table...');
  db.exec('ALTER TABLE purchases ADD COLUMN firestore_id TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_firestore_id ON purchases(firestore_id)');
}

// Migration: Add program_id column to purchases table if it doesn't exist
try {
  db.prepare('SELECT program_id FROM purchases LIMIT 1').get();
} catch (err) {
  console.log('Adding program_id column to purchases table...');
  db.exec('ALTER TABLE purchases ADD COLUMN program_id TEXT');
}

// Migration: Add firestore_id column to leads table if it doesn't exist
try {
  db.prepare('SELECT firestore_id FROM leads LIMIT 1').get();
} catch (err) {
  console.log('Adding firestore_id column to leads table...');
  db.exec('ALTER TABLE leads ADD COLUMN firestore_id TEXT');
}

// Migration: Add workout_start_time and workout_end_time to workout_logs
try {
  db.prepare('SELECT workout_start_time FROM workout_logs LIMIT 1').get();
} catch (err) {
  console.log('Adding workout_start_time and workout_end_time to workout_logs...');
  try {
    db.exec('ALTER TABLE workout_logs ADD COLUMN workout_start_time TEXT');
    db.exec('ALTER TABLE workout_logs ADD COLUMN workout_end_time TEXT');
  } catch (e) {}
}

// Migration: Add firestore_id column to various tables if they don't exist
const tablesToMigrate = [
  'progress', 'nutrition_logs', 'workout_logs', 'program_progress', 
  'user_activity_logs', 'body_composition_logs', 'fitness_overviews', 
  'custom_programs', 'messages', 'workout_feedback'
];

for (const table of tablesToMigrate) {
  try {
    db.prepare(`SELECT firestore_id FROM ${table} LIMIT 1`).get();
  } catch (err) {
    console.log(`Adding firestore_id column to ${table} table...`);
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN firestore_id TEXT`);
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_firestore_id ON ${table}(firestore_id)`);
    } catch (alterErr) {
      console.error(`Failed to migrate ${table}:`, alterErr);
    }
  }
}

// Migration: Add scheduled_time column to program_progress table if it doesn't exist
try {
  db.prepare('SELECT scheduled_time FROM program_progress LIMIT 1').get();
} catch (err) {
  console.log('Adding scheduled_time column to program_progress table...');
  db.exec('ALTER TABLE program_progress ADD COLUMN scheduled_time TEXT');
}

// Migration: Add workout_id column to program_progress table if it doesn't exist
try {
  db.prepare('SELECT workout_id FROM program_progress LIMIT 1').get();
} catch (err) {
  console.log('Adding workout_id column to program_progress table...');
  db.exec('ALTER TABLE program_progress ADD COLUMN workout_id TEXT');
}

// Migration: Add username column to user_activity_logs if it doesn't exist
try {
  db.prepare('SELECT username FROM user_activity_logs LIMIT 1').get();
} catch (err) {
  console.log('Adding username column to user_activity_logs table...');
  db.exec('ALTER TABLE user_activity_logs ADD COLUMN username TEXT');
}

// Create a default admin if none exists
const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const insert = db.prepare('INSERT INTO users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run('admin', 'admin@krome.com', 'admin123', 'KROME', 'Admin', 'admin');
  console.log('Default admin created: admin / admin123');
}

export default db;
