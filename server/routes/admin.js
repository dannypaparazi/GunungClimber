const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/create-user', authenticateToken, requireAdmin, (req, res) => {
  const { username, email, password, full_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [username, email, hashedPassword, full_name || '', 'user'],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Username or email already exists' });
      }

      db.get('SELECT id, username, email, full_name, role FROM users WHERE id = ?', [this.lastID], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ user });
      });
    }
  );
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ users });
  });
});

router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
