
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');

// ═══════════════════════════════════════════════════════════════
// GET /api/notifications — List notifications for the org
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const [rows] = await pool.query(
      `SELECT * FROM notification
       WHERE org_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [orgId]
    );

    res.json(rows);
  } catch (err) {
    console.error('[Notifications] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/notifications/:id/read — Mark as read
// ═══════════════════════════════════════════════════════════════
router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notification SET is_read = TRUE WHERE notification_id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('[Notifications] Mark read error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/notifications/read-all — Mark all as read
// ═══════════════════════════════════════════════════════════════
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notification SET is_read = TRUE WHERE org_id = ? AND is_read = FALSE`,
      [req.user.org_id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[Notifications] Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/notifications/:id — Delete a notification
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notification WHERE notification_id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    );
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('[Notifications] Delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
