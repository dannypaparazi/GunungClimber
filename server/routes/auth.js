const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

router.post('/register', (req, res) => {
  const { username, email, password, full_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, full_name || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Username or email already exists' });
      }

      const token = jwt.sign(
        { id: this.lastID, username: username, role: 'user' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
      );

      res.json({ token, user: { id: this.lastID, username, role: 'user' } });
    }
  );
});

module.exports = router;
