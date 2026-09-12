const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, (req, res) => {
  const { title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng } = req.body;
  const userId = req.user.id;

  if (!title || !mountain_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, mountain name, start date, and end date required' });
  }

  db.run(
    `INSERT INTO itineraries (user_id, title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, mountain_name, start_date, end_date, difficulty || 'moderate', description ?? null, public_transport_method ?? null, meeting_point ?? null, meeting_lat ?? null, meeting_lng ?? null],
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
  const { title, mountain_name, start_date, end_date, difficulty, description, public_transport_method, meeting_point, meeting_lat, meeting_lng } = req.body;

  db.run(
    `UPDATE itineraries SET title = ?, mountain_name = ?, start_date = ?, end_date = ?, difficulty = ?, description = ?, public_transport_method = ?, meeting_point = ?, meeting_lat = ?, meeting_lng = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [title, mountain_name, start_date, end_date, difficulty, description ?? null, public_transport_method ?? null, meeting_point ?? null, meeting_lat ?? null, meeting_lng ?? null, id, userId],
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
