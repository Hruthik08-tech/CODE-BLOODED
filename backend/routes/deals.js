
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');

// ═══════════════════════════════════════════════════════════════
// GET /api/deals — List all deals for the org
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const [rows] = await pool.query(
      `SELECT d.*,
              o_supply.org_name AS supply_org_name,
              o_demand.org_name AS demand_org_name
       FROM deal d
       JOIN organisation o_supply ON o_supply.org_id = d.supply_org_id
       JOIN organisation o_demand ON o_demand.org_id = d.demand_org_id
       WHERE (d.supply_org_id = ? OR d.demand_org_id = ?)
       ORDER BY d.created_at DESC`,
      [orgId, orgId]
    );

    const deals = rows.map(d => ({
      ...d,
      partner_org_name: d.supply_org_id === orgId ? d.demand_org_name : d.supply_org_name,
      partner_org_id: d.supply_org_id === orgId ? d.demand_org_id : d.supply_org_id,
      // Don't expose raw qr_code_data in the list
      qr_code_data: undefined,
      has_qr: !!d.qr_token
    }));

    res.json(deals);
  } catch (err) {
    console.error('[Deals] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deals/:id — Get deal details + QR data (FR-29)
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const dealId = req.params.id;
    const orgId = req.user.org_id;

    const [rows] = await pool.query(
      `SELECT d.*,
              o_supply.org_name AS supply_org_name,
              o_demand.org_name AS demand_org_name
       FROM deal d
       JOIN organisation o_supply ON o_supply.org_id = d.supply_org_id
       JOIN organisation o_demand ON o_demand.org_id = d.demand_org_id
       WHERE d.deal_id = ?
         AND (d.supply_org_id = ? OR d.demand_org_id = ?)`,
      [dealId, orgId, orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    const deal = rows[0];
    deal.partner_org_name = deal.supply_org_id === orgId ? deal.demand_org_name : deal.supply_org_name;
    deal.partner_org_id = deal.supply_org_id === orgId ? deal.demand_org_id : deal.supply_org_id;

    res.json(deal);
  } catch (err) {
    console.error('[Deals] Get error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/deals/verify/:token — Public: Verify a QR code (FR-30)
// ═══════════════════════════════════════════════════════════════
router.get('/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;

    const [rows] = await pool.query(
      `SELECT d.deal_id, d.supply_name_snapshot, d.demand_name_snapshot,
              d.agreed_price, d.quantity, d.currency, d.deal_status,
              d.created_at, d.qr_code_data,
              o_supply.org_name AS supply_org_name,
              o_demand.org_name AS demand_org_name
       FROM deal d
       JOIN organisation o_supply ON o_supply.org_id = d.supply_org_id
       JOIN organisation o_demand ON o_demand.org_id = d.demand_org_id
       WHERE d.qr_token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        verified: false,
        error: 'Deal not found or QR code is invalid.'
      });
    }

    const deal = rows[0];

    res.json({
      verified: true,
      deal: {
        deal_id: deal.deal_id,
        supply_name: deal.supply_name_snapshot,
        demand_name: deal.demand_name_snapshot,
        supply_org: deal.supply_org_name,
        demand_org: deal.demand_org_name,
        agreed_price: deal.agreed_price,
        quantity: deal.quantity,
        currency: deal.currency,
        status: deal.deal_status,
        created_at: deal.created_at,
        qr_data: JSON.parse(deal.qr_code_data || '{}')
      }
    });
  } catch (err) {
    console.error('[Deals] Verify error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/deals/:id — Update deal (price, quantity, status)
// ═══════════════════════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const dealId = req.params.id;
    const orgId = req.user.org_id;
    const { agreed_price, quantity, deal_status } = req.body;

    // Verify ownership
    const [existing] = await pool.query(
      `SELECT deal_id FROM deal
       WHERE deal_id = ? AND (supply_org_id = ? OR demand_org_id = ?)`,
      [dealId, orgId, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    const updates = [];
    const values = [];
    if (agreed_price !== undefined) { updates.push('agreed_price = ?'); values.push(agreed_price); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (deal_status !== undefined) { updates.push('deal_status = ?'); values.push(deal_status); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updates.push('updated_at = NOW()');
    values.push(dealId);

    await pool.query(
      `UPDATE deal SET ${updates.join(', ')} WHERE deal_id = ?`,
      values
    );

    res.json({ message: 'Deal updated successfully.' });
  } catch (err) {
    console.error('[Deals] Update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
