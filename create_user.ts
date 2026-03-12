import db from './src/lib/db';

const insertUser = db.prepare('INSERT INTO users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)');
try {
  insertUser.run('swolecode', 'swolecode@gmail.com', 'password123', 'Swole', 'Code', 'user');
} catch (e) {
  console.log('User already exists');
}

const user = db.prepare("SELECT id FROM users WHERE email='swolecode@gmail.com'").get();
console.log('User ID:', user.id);
