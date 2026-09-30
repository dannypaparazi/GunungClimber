const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  const { title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng, is_public } = req.body;
  const userId = req.user.id;

  if (!title || !mountain_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, mountain name, start date, and end date required' });
  }

  db.run(
    `INSERT INTO itineraries (user_id, title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng, is_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, mountain_name, start_date, end_date, difficulty || 'moderate', description ?? null, public_transport_method ?? null, meeting_point ?? null, meeting_lat ?? null, meeting_lng ?? null, is_public ? 1 : 0],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.get('SELECT * FROM itineraries WHERE id = ?', [this.lastID], (err, itinerary) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ itinerary });
      });
    }
  );
});

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all('SELECT * FROM itineraries WHERE user_id = ? ORDER BY start_date DESC', [userId], (err, itineraries) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ itineraries });
  });
});

// Pins visible on the shared map: the current user's own itineraries plus
// other users' itineraries marked public. Must be registered before /:id.
router.get('/map/pins', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT i.id, i.title, i.mountain_name, i.start_date, i.end_date, i.difficulty,
            i.meeting_point, i.meeting_lat, i.meeting_lng, i.is_public,
            i.user_id, u.username AS owner_username, u.full_name AS owner_full_name
     FROM itineraries i
     JOIN users u ON u.id = i.user_id
     WHERE i.meeting_lat IS NOT NULL AND i.meeting_lng IS NOT NULL
       AND (i.user_id = ? OR i.is_public = 1)
     ORDER BY i.start_date DESC`,
    [userId],
    (err, pins) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      const withOwnership = pins.map((pin) => ({ ...pin, is_own: pin.user_id === userId }));
      res.json({ pins: withOwnership });
    }
  );
});

// Invites addressed to the current user, across all itineraries.
router.get('/invites/mine', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT inv.id AS invite_id, inv.status, i.id AS itinerary_id, i.title, i.mountain_name,
            i.start_date, i.end_date, u.username AS owner_username, u.full_name AS owner_full_name
     FROM itinerary_invites inv
     JOIN itineraries i ON i.id = inv.itinerary_id
     JOIN users u ON u.id = i.user_id
     WHERE inv.invitee_id = ?
     ORDER BY i.start_date DESC`,
    [userId],
    (err, invites) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ invites });
    }
  );
});

// Invitee updates their own RSVP status.
router.put('/invites/:inviteId', authenticateToken, (req, res) => {
  const { inviteId } = req.params;
  const userId = req.user.id;
  const { status } = req.body;

  if (!['not_interested', 'interested', 'going'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get('SELECT id FROM itinerary_invites WHERE id = ? AND invitee_id = ?', [inviteId, userId], (err, invite) => {
    if (err || !invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    db.run(
      `UPDATE itinerary_invites SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, inviteId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'RSVP updated' });
      }
    );
  });
});

// Owner removes an invite (uninvite).
router.delete('/invites/:inviteId', authenticateToken, (req, res) => {
  const { inviteId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT inv.id, i.user_id AS owner_id
     FROM itinerary_invites inv
     JOIN itineraries i ON i.id = inv.itinerary_id
     WHERE inv.id = ?`,
    [inviteId],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: 'Invite not found' });
      }
      if (row.owner_id !== userId) {
        return res.status(403).json({ error: 'Only the hike owner can remove invites' });
      }

      db.run('DELETE FROM itinerary_invites WHERE id = ?', [inviteId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Invite removed' });
      });
    }
  );
});

// Invites for a single itinerary (owner only).
router.get('/:id/invites', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], (err, itinerary) => {
    if (err || !itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    db.all(
      `SELECT inv.id, inv.status, inv.invitee_id, u.username, u.full_name
       FROM itinerary_invites inv
       JOIN users u ON u.id = inv.invitee_id
       WHERE inv.itinerary_id = ?
       ORDER BY u.username`,
      [id],
      (err, invites) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ invites });
      }
    );
  });
});

// Owner invites a friend to a hike.
router.post('/:id/invites', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { friend_id } = req.body;

  if (!friend_id) {
    return res.status(400).json({ error: 'friend_id required' });
  }

  db.get('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], (err, itinerary) => {
    if (err || !itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    db.get(
      `SELECT id FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
      [userId, friend_id, friend_id, userId],
      (err, friendship) => {
        if (err || !friendship) {
          return res.status(403).json({ error: 'You can only invite friends' });
        }

        db.run(
          `INSERT INTO itinerary_invites (itinerary_id, invitee_id, status) VALUES (?, ?, 'invited')`,
          [id, friend_id],
          function (err) {
            if (err) {
              return res.status(400).json({ error: 'Already invited' });
            }
            res.json({ invite_id: this.lastID });
          }
        );
      }
    );
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], (err, itinerary) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    db.all('SELECT * FROM itinerary_details WHERE itinerary_id = ? ORDER BY day_number', [id], (err, details) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ itinerary, details });
    });
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng, is_public } = req.body;

  db.run(
    `UPDATE itineraries SET title = ?, mountain_name = ?, start_date = ?, end_date = ?, difficulty = ?, description = ?, public_transport_method = ?, meeting_point = ?, meeting_lat = ?, meeting_lng = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [title, mountain_name, start_date, end_date, difficulty, description ?? null, public_transport_method ?? null, meeting_point ?? null, meeting_lat ?? null, meeting_lng ?? null, is_public ? 1 : 0, id, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Itinerary updated' });
    }
  );
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Itinerary deleted' });
  });
});

// Itinerary Details endpoints
router.post('/:id/details', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { day_number, description, location, activities, accommodation } = req.body;

  db.get('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], (err, itinerary) => {
    if (err || !itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    db.run(
      `INSERT INTO itinerary_details (itinerary_id, day_number, description, location, activities, accommodation)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, day_number, description ?? null, location ?? null, activities ?? null, accommodation ?? null],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ detail_id: this.lastID });
      }
    );
  });
});

router.get('/:id/details', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, userId], (err, itinerary) => {
    if (err || !itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    db.all('SELECT * FROM itinerary_details WHERE itinerary_id = ? ORDER BY day_number', [id], (err, details) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ details });
    });
  });
});

module.exports = router;
