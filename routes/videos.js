const express = require('express');
const { authRequired, adminOnly } = require('../middleware/auth');

module.exports = function(db, io) {
  const router = express.Router();

  // Get all videos
  router.get('/', (req, res) => {
    db.all('SELECT * FROM videos ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch videos' });
      res.json(rows);
    });
  });

  // Add new video (admin only)
  router.post('/', authRequired, adminOnly, (req, res) => {
    const { title, video_url, thumbnail_url } = req.body;
    if (!title || !video_url || !thumbnail_url) {
      return res.status(400).json({ error: 'title, video_url, and thumbnail_url are required' });
    }
    const now = new Date().toISOString();
    db.run('INSERT INTO videos (title, video_url, thumbnail_url, created_at) VALUES (?, ?, ?, ?)', [title, video_url, thumbnail_url, now], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add video' });
      io.emit('videosChanged');
      res.json({ id: this.lastID });
    });
  });

  // Update video (admin only)
  router.put('/:id', authRequired, adminOnly, (req, res) => {
    const id = req.params.id;
    const { title, video_url, thumbnail_url } = req.body;
    if (!title || !video_url || !thumbnail_url) {
      return res.status(400).json({ error: 'title, video_url, and thumbnail_url are required' });
    }
    db.run('UPDATE videos SET title = ?, video_url = ?, thumbnail_url = ? WHERE id = ?', [title, video_url, thumbnail_url, id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update video' });
      if (this.changes === 0) return res.status(404).json({ error: 'Video not found' });
      io.emit('videosChanged');
      res.json({ ok: true });
    });
  });

  // Delete video (admin only)
  router.delete('/:id', authRequired, adminOnly, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM videos WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to delete video' });
      if (this.changes === 0) return res.status(404).json({ error: 'Video not found' });
      io.emit('videosChanged');
      res.json({ ok: true });
    });
  });

  return router;
};
