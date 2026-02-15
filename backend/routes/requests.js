
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');

// ═══════════════════════════════════════════════════════════════
// POST /api/requests — Send a request (FR-17)
// ═══════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const requestedBy = req.user.org_id;
    const {
      requested_to,
      supply_id,
      demand_id,
      match_score,
      supply_name_snapshot,
      demand_name_snapshot,
      message
    } = req.body;

    if (!requested_to) {
      return res.status(400).json({ error: 'requested_to is required.' });
    }
    if (!supply_id && !demand_id) {
      return res.status(400).json({ error: 'Either supply_id or demand_id is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO requests
       (requested_by, requested_to, supply_id, demand_id, match_score,
        supply_name_snapshot, demand_name_snapshot, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        requestedBy,
        requested_to,
        supply_id || null,
        demand_id || null,
        match_score || null,
        supply_name_snapshot || null,
        demand_name_snapshot || null,
        message || null
      ]
    );

    // Create notification for the receiving org
    try {
      await pool.query(
        `INSERT INTO notification (org_id, type, title, message, reference_type, reference_id, created_at)
         VALUES (?, 'request_received', 'New Request Received',
                 ?, 'request', ?, NOW())`,
        [
          requested_to,
          `You received a new matching request for ${supply_name_snapshot || demand_name_snapshot || 'a listing'}.`,
          result.insertId
        ]
      );
    } catch (notifErr) {
      console.error('[Requests] Notification insert error:', notifErr.message);
    }

    res.status(201).json({
      message: 'Request sent successfully.',
      request_id: result.insertId
    });
  } catch (err) {
    console.error('[Requests] Create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/requests — List all requests (sent + received)
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const [rows] = await pool.query(
      `SELECT r.*,
              o_from.org_name AS from_org_name,
              o_to.org_name AS to_org_name
       FROM requests r
       JOIN organisation o_from ON o_from.org_id = r.requested_by
       JOIN organisation o_to   ON o_to.org_id   = r.requested_to
       WHERE (r.requested_by = ? OR r.requested_to = ?)
         AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC`,
      [orgId, orgId]
    );

    // Split into sent and received for convenience
    const sent = rows.filter(r => r.requested_by === orgId);
    const received = rows.filter(r => r.requested_to === orgId);

    res.json({ sent, received });
  } catch (err) {
    console.error('[Requests] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/requests/:id/accept — Accept a request (FR-19, FR-20)
// ═══════════════════════════════════════════════════════════════
router.patch('/:id/accept', async (req, res) => {
  try {
    const requestId = req.params.id;
    const orgId = req.user.org_id;

    // Verify the request is for this org and is pending
    const [rows] = await pool.query(
      `SELECT * FROM requests WHERE request_id = ? AND requested_to = ? AND status = 'pending' AND deleted_at IS NULL`,
      [requestId, orgId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed.' });
    }

    const request = rows[0];

    // Update request status
    await pool.query(
      `UPDATE requests SET status = 'accepted', updated_at = NOW() WHERE request_id = ?`,
      [requestId]
    );

    // FR-20: Auto-create Business Room
    const [roomResult] = await pool.query(
      `INSERT INTO business_room
       (request_id, org_id_1, org_id_2, supply_id, demand_id,
        supply_name_snapshot, demand_name_snapshot, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', NOW(), NOW())`,
      [
        requestId,
        request.requested_by,
        request.requested_to,
        request.supply_id,
        request.demand_id,
        request.supply_name_snapshot,
        request.demand_name_snapshot
      ]
    );

    // Notify the requester
    try {
      await pool.query(
        `INSERT INTO notification (org_id, type, title, message, reference_type, reference_id, created_at)
         VALUES (?, 'request_accepted', 'Request Accepted',
                 ?, 'request', ?, NOW())`,
        [
          request.requested_by,
          `Your request for ${request.supply_name_snapshot || request.demand_name_snapshot || 'a listing'} was accepted. A business room has been created.`,
          requestId
        ]
      );
    } catch (notifErr) {
      console.error('[Requests] Accept notification error:', notifErr.message);
    }

    res.json({
      message: 'Request accepted. Business room created.',
      room_id: roomResult.insertId
    });
  } catch (err) {
    console.error('[Requests] Accept error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/requests/:id/reject — Reject a request (FR-19, FR-21)
// ═══════════════════════════════════════════════════════════════
router.patch('/:id/reject', async (req, res) => {
  try {
    const requestId = req.params.id;
    const orgId = req.user.org_id;
    const { rejection_reason } = req.body;

    // Verify
    const [rows] = await pool.query(
      `SELECT * FROM requests WHERE request_id = ? AND requested_to = ? AND status = 'pending' AND deleted_at IS NULL`,
      [requestId, orgId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed.' });
    }

    const request = rows[0];

    await pool.query(
      `UPDATE requests SET status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE request_id = ?`,
      [rejection_reason || null, requestId]
    );

    // FR-21: Notify the requester
    try {
      await pool.query(
        `INSERT INTO notification (org_id, type, title, message, reference_type, reference_id, created_at)
         VALUES (?, 'request_rejected', 'Request Rejected',
                 ?, 'request', ?, NOW())`,
        [
          request.requested_by,
          `Your request for ${request.supply_name_snapshot || request.demand_name_snapshot || 'a listing'} was rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`,
          requestId
        ]
      );
    } catch (notifErr) {
      console.error('[Requests] Reject notification error:', notifErr.message);
    }

    res.json({ message: 'Request rejected.' });
  } catch (err) {
    console.error('[Requests] Reject error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
