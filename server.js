require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');


const db = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');
const journalRoutes = require('./routes/journalRoutes');
const chatRoutes = require('./routes/chatRoutes');
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use("/api", chatRoutes);


// 1. API to sync from server to client
app.get('/syncToClient', (req, res) => {
  const { last_sync_timestamp, user_id } = req.query;

  // Ensure that user_id is provided in the request
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  // Default to a very old timestamp if none is provided
  const timestamp = last_sync_timestamp || '1970-01-01 00:00:00';

  const query = `
    SELECT * FROM journal_entries 
    WHERE updated_at > ? AND user_id = ?;
  `;

  db.all(query, [timestamp, user_id], (err, rows) => {
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
    INSERT INTO journal_entries (journal_id, user_id, title, content, created_at, updated_at, journal_status, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journal_id)
    DO UPDATE SET 
      title = excluded.title,
      content = excluded.content,
      updated_at = excluded.updated_at,
      journal_status = excluded.journal_status,
      version = excluded.version;
  `;

  // Using a transaction to ensure consistency
  db.serialize(() => {
    const stmt = db.prepare(insertOrUpdateQuery);

    // Insert or update each entry
    entries.forEach(entry => {
      stmt.run(
        entry.journal_id || null,  // Auto-increment for new entries
        entry.user_id,
        entry.title,
        entry.content,
        entry.created_at || new Date().toISOString(),
        entry.updated_at || new Date().toISOString(),
        entry.journal_status || 'active',  // Default to 'active' if missing
        entry.version || 1  // Default version if missing
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








// API to sync from server to client (Moods)
app.get('/syncMoodsToClient', (req, res) => {
  const { last_sync_timestamp, user_id } = req.query;

  // Ensure that user_id is provided in the request
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  // Default to a very old timestamp if none is provided
  const timestamp = last_sync_timestamp || '1970-01-01 00:00:00';

  const query = `
    SELECT * FROM moods 
    WHERE created_at > ? AND user_id = ?;
  `;

  db.all(query, [timestamp, user_id], (err, rows) => {
    if (err) {
      console.error('Error pulling data:', err);
      return res.status(500).json({ error: 'Error syncing mood data from server to client.' });
    }
    res.json({ moods: rows });
  });
});




// API to sync from client to server (Moods)
app.post('/syncMoodsToServer', (req, res) => {
  const { moods } = req.body;

  if (!moods || moods.length === 0) {
    return res.status(400).json({ error: 'No mood entries to sync.' });
  }

  const insertOrUpdateQuery = `
    INSERT INTO moods (mood_id, user_id, mood, created_at, mood_status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(mood_id)
    DO UPDATE SET 
      mood = excluded.mood,
      created_at = excluded.created_at,
      mood_status = excluded.mood_status
  `;

  // Using a transaction to ensure consistency
  db.serialize(() => {
    const stmt = db.prepare(insertOrUpdateQuery);

    // Insert or update each mood entry
    moods.forEach((mood) => {
      stmt.run(
        mood.mood_id || null, // Auto-increment for new entries
        mood.user_id,
        mood.mood,
        mood.created_at || new Date().toISOString(),
        mood.mood_status || 'active' // Default to 'active' if missing
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error syncing mood data to server:', err);
        return res.status(500).json({ error: 'Error syncing mood data to server.' });
      }
      res.json({ message: 'Mood data synced to server successfully.' });
    });
  });
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
