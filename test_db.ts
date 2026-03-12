import db from './src/lib/db.ts';
try {
  const user = db.prepare('SELECT * FROM users LIMIT 1').get();
  console.log('Database connection successful. First user:', user);
  process.exit(0);
} catch (err) {
  console.error('Database connection failed:', err);
  process.exit(1);
}
