import db from './src/lib/db';

const insert = db.prepare('INSERT INTO progress (user_id, metric_name, metric_value, unit, recorded_at) VALUES (?, ?, ?, ?, ?)');

db.transaction(() => {
  // Clear existing progress for Deadlift and Cleans
  db.prepare("DELETE FROM progress WHERE metric_name IN ('Deadlift', 'Cleans')").run();

  for (const userId of [1, 2]) {
    let date = new Date();
    date.setDate(date.getDate() - 10 * 7); // Start 10 weeks ago

    let deadlift = 225;
    let cleans = 135;

    for (let i = 0; i < 10; i++) {
      // Add some random progression
      deadlift += Math.floor(Math.random() * 15) + 5;
      cleans += Math.floor(Math.random() * 10) + 2;

      insert.run(userId, 'Deadlift', deadlift, 'lbs', date.toISOString());
      insert.run(userId, 'Cleans', cleans, 'lbs', date.toISOString());

      date.setDate(date.getDate() + 7);
    }
  }
})();

console.log('Deadlift and Cleans data seeded successfully.');
