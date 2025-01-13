const express = require('express');
const router = express.Router();
const db = require('../models/userModel'); 

// Sync journals via API (in case WebSocket is not used)
router.post('/sync', (req, res) => {
  const journals = req.body.journals;  // Journals to sync

  const stmt = db.prepare("INSERT INTO journal_entries (user_id, title, content, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, ?)");

  db.serialize(() => {
    journals.forEach(journal => {
      stmt.run(journal.user_id, journal.title, journal.content, journal.created_at, journal.updated_at, true, function (err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to sync journal', error: err.message });
        }
      });
    });
    stmt.finalize(() => {
      res.status(200).json({ message: 'Journals synced successfully' });
    });
  });
});

module.exports = router;
