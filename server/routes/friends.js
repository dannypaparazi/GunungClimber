const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// All other users, annotated with the current user's relationship to each one.
router.get('/users', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT u.id, u.username, u.full_name,
            f.id AS friendship_id, f.status, f.requester_id
     FROM users u
     LEFT JOIN friendships f
       ON (f.requester_id = u.id AND f.addressee_id = ?)
       OR (f.addressee_id = u.id AND f.requester_id = ?)
     WHERE u.id != ? AND u.role != 'admin'
     ORDER BY u.username`,
    [userId, userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const users = rows.map((row) => {
        let relationship = 'none';
        if (row.status === 'accepted') {
          relationship = 'friends';
        } else if (row.status === 'pending') {
          relationship = row.requester_id === userId ? 'pending_sent' : 'pending_received';
        }
        return {
          id: row.id,
          username: row.username,
          full_name: row.full_name,
          friendship_id: row.friendship_id,
          relationship,
        };
      });

      res.json({ users });
    }
  );
});

// Accepted friends only.
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT f.id AS friendship_id, u.id, u.username, u.full_name
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
     WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)
     ORDER BY u.username`,
    [userId, userId, userId],
    (err, friends) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ friends });
    }
  );
});

// Incoming pending requests.
router.get('/requests', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT f.id AS friendship_id, u.id, u.username, u.full_name
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.status = 'pending' AND f.addressee_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
    (err, requests) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ requests });
    }
  );
});

router.post('/request', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { addressee_id } = req.body;

  if (!addressee_id) {
    return res.status(400).json({ error: 'addressee_id required' });
  }
  if (Number(addressee_id) === userId) {
    return res.status(400).json({ error: 'Cannot friend yourself' });
  }

  db.run(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')`,
    [userId, addressee_id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Friend request already exists' });
      }
      res.json({ friendship_id: this.lastID });
    }
  );
});

router.post('/:id/accept', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.get('SELECT * FROM friendships WHERE id = ?', [id], (err, friendship) => {
    if (err || !friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    if (friendship.addressee_id !== userId) {
      return res.status(403).json({ error: 'Only the recipient can accept this request' });
    }

    db.run(
      `UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Friend request accepted' });
      }
    );
  });
});

// Reject a pending request or remove an existing friendship. Either party may call this.
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.get('SELECT * FROM friendships WHERE id = ?', [id], (err, friendship) => {
    if (err || !friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
      return res.status(403).json({ error: 'Not part of this friendship' });
    }

    db.run('DELETE FROM friendships WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Friendship removed' });
    });
  });
});

module.exports = router;
