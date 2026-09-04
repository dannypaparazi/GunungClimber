const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
});

router.put('/profile', authenticateToken, (req, res) => {
  const { full_name } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [full_name, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.get('SELECT id, username, email, full_name, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ user });
      });
    }
  );
});

module.exports = router;
