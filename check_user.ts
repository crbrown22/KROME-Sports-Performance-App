import db from './src/lib/db';

const users = db.prepare("SELECT id, email FROM users").all();
console.log(users);
