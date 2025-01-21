require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');


const db = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/api/journals', journalRoutes);

app.get('/syncToClient', (req, res) => {
  const { last_sync_timestamp } = req.query;

  // Default to a very old timestamp if none is provided
  const timestamp = last_sync_timestamp || '1970-01-01 00:00:00';

  const query = `
    SELECT * FROM journal_entries 
    WHERE updated_at > ?;
  `;

  db.all(query, [timestamp], (err, rows) => {
    if (err) {
      console.error('Error pulling data:', err);
      return res.status(500).json({ error: 'Error syncing data from server to client.' });
    }
    res.json({ entries: rows });
  });
});

// 2. API to sync from client to server
app.post('/syncToServer', (req, res) => {
  const { entries } = req.body;

  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No entries to sync.' });
  }

  const insertOrUpdateQuery = `
    INSERT INTO journal_entries (journal_id, user_id, title, content, created_at, updated_at, deleted_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journal_id)
    DO UPDATE SET 
      title = excluded.title,
      content = excluded.content,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version;
  `;

  // Using a transaction to ensure consistency
  db.serialize(() => {
    const stmt = db.prepare(insertOrUpdateQuery);

    // Insert or update each entry
    entries.forEach(entry => {
      stmt.run(
        entry.journal_id,
        entry.user_id,
        entry.title,
        entry.content,
        entry.created_at,
        entry.updated_at,
        entry.deleted_at || null,
        entry.version || 1
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error syncing data to server:', err);
        return res.status(500).json({ error: 'Error syncing data to server.' });
      }
      res.json({ message: 'Data synced to server successfully.' });
    });
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
