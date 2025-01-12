const jwt = require('jsonwebtoken');
const db = require('../models/userModel');

// Register user
const registerUser = (req, res) => {
  const { username, email, password } = req.body;

  // Save user with plain text password (no bcrypt)
  db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (err) {
    if (err) {
      console.error('Error during registration:', err); // Log the error for better debugging
      return res.status(500).json({ error: 'Error registering user' });
    }
    res.status(200).json({ message: 'User registered successfully' });
  });
};



// Login user
const loginUser = (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT id, username, email, password FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Received password:', password);
    console.log('Stored password in DB:', user.password);

    if (password == user.password) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Login successful');

      // Return user details and token
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  });
};




const getAllUsers = (req, res) => {
  db.all('SELECT id, username, email FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving users' });
    }
    res.status(200).json({ users: rows });
  });
};

module.exports = { registerUser, loginUser, getAllUsers };
