import db from './src/lib/db.js';

const user = db.prepare("SELECT id FROM users WHERE email='swolecode@gmail.com'").get();
console.log(user);
