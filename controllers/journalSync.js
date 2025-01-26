const db = require('../models/userModel');

const syncJournals = (req, res) => {
  const { user_id, journals } = req.body; // Accept user_id from the request body

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!journals || !Array.isArray(journals)) {
    return res.status(400).json({ error: 'Invalid journal data' });
  }

  const insertOrUpdateQuery = `
    INSERT INTO journal_entries (journal_id, user_id, title, content, created_at, updated_at, journal_status, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journal_id) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      updated_at = excluded.updated_at,
      journal_status = excluded.journal_status,
      version = excluded.version;
  `;

  const syncPromises = journals.map((journal) => {
    const { journal_id, title, content, created_at, updated_at, journal_status, version } = journal;

    return new Promise((resolve, reject) => {
      db.run(
        insertOrUpdateQuery,
        [
          journal_id || null, // Auto-increment for new entries
          user_id,
          title,
          content,
          created_at || new Date().toISOString(),
          updated_at || new Date().toISOString(),
          journal_status || 'active', // Default journal_status if missing
          version || 1, // Default version if missing
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  Promise.all(syncPromises)
    .then(() => res.status(200).json({ message: 'Journals synced successfully' }))
    .catch((error) => {
      console.error('Error syncing journals:', error);
      res.status(500).json({ error: 'Failed to sync journals' });
    });
};

module.exports = { syncJournals };
