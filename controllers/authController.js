const jwt = require('jsonwebtoken');
const db = require('../models/userModel');

// Register user
const registerUser = (req, res) => {
  const { username, email, password, firstname, lastname } = req.body;

  // Save user with plain text password (no bcrypt)
  db.run(
    'INSERT INTO users (username, email, password, firstname, lastname) VALUES (?, ?, ?, ?, ?)',
    [username, email, password, firstname, lastname],
    function (err) {
      if (err) {
        console.error('Error during registration:', err); // Log the error for better debugging
        return res.status(500).json({ error: 'Error registering user' });
      }
      res.status(200).json({ message: 'User registered successfully' });
    }
  );
};




// Login user
const loginUser = (req, res) => {
  const { username, password } = req.body;

  // Query the database for user details
  db.get(
    'SELECT user_id, username, firstname, lastname, email, password FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Received password:', password);
      console.log('Stored password in DB:', user.password);

      // Validate password
      if (password == user.password) {
        // Generate JWT token
        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Login successful');

        // Return user details and token
        return res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            user_id: user.user_id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
          },
        });
      } else {
        console.log('Password mismatch');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  );
};


module.exports = { registerUser, loginUser };
