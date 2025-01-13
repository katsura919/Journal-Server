// /server/utils/journalUtils.js
const db = require('../models/userModel');

// Function to insert journals into the database
const insertJournals = (journals) => {
  // Prepare the SQL statement to insert journal entries
  const stmt = db.prepare(`
    INSERT INTO journal_entries (user_id, title, content, created_at, is_synced)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Loop through the journals and insert each one
  journals.forEach(journal => {
    const { user_id, title, content, created_at, is_synced } = journal;

    stmt.run(user_id, title, content, created_at, is_synced, function(err) {
      if (err) {
        console.error("Error inserting journal:", err);
      } else {
        console.log(`Inserted journal for user ${user_id} with ID ${this.lastID}`);
      }
    });
  });

  stmt.finalize(); // Finalize the statement after all inserts
};

module.exports = { insertJournals };
