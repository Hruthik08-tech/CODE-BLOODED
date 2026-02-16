const express = require('express');
const router = express.Router();
const pool = require('../connections/db');

// ═══════════════════════════════════════════════════════════════
// GET /api/organisations — List all active organisations (public info)
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT org_id, org_name, email, phone_number, website_url,
              description, logo_url, address, city, state, country,
              postal_code, latitude, longitude, is_active, created_at
       FROM organisation
       WHERE is_active = TRUE AND deleted_at IS NULL AND is_suspended = FALSE
       ORDER BY org_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Organisations] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
