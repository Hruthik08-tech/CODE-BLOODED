
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');

// ═══════════════════════════════════════════════════════════════
// POST /api/matches/save — Save or dismiss a match (FR-15)
// ═══════════════════════════════════════════════════════════════
router.post('/save', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { source_type, source_id, matched_type, matched_id, match_score, action } = req.body;

    if (!['saved', 'dismissed'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "saved" or "dismissed".' });
    }
    if (!source_type || !source_id || !matched_type || !matched_id) {
      return res.status(400).json({ error: 'source_type, source_id, matched_type, matched_id are required.' });
    }

    await pool.query(
      `INSERT INTO saved_match (org_id, source_type, source_id, matched_type, matched_id, match_score, action, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE action = VALUES(action), match_score = VALUES(match_score)`,
      [orgId, source_type, source_id, matched_type, matched_id, match_score || null, action]
    );

    res.json({ message: `Match ${action} successfully.` });
  } catch (err) {
    console.error('[Matches] Save error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/matches/saved — Get all saved matches for the org
// ═══════════════════════════════════════════════════════════════
router.get('/saved', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const [rows] = await pool.query(
      `SELECT * FROM saved_match WHERE org_id = ? AND action = 'saved' ORDER BY created_at DESC`,
      [orgId]
    );

    res.json(rows);
  } catch (err) {
    console.error('[Matches] List saved error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/matches/dismissed — Get dismissed match IDs
// ═══════════════════════════════════════════════════════════════
router.get('/dismissed', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { source_type, source_id } = req.query;

    let query = `SELECT matched_type, matched_id FROM saved_match WHERE org_id = ? AND action = 'dismissed'`;
    const params = [orgId];

    if (source_type && source_id) {
      query += ` AND source_type = ? AND source_id = ?`;
      params.push(source_type, source_id);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[Matches] List dismissed error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
