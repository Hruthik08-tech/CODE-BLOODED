
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');
const { redisClient } = require('../connections/redis');

const CACHE_TTL_SECONDS = 900; // 15 minutes (freshness over speed)
const WORKER_URL = process.env.MATCHING_WORKER_URL || 'http://matching-worker:8000';

// ═══════════════════════════════════════════════════════════════
// Cache Invalidation Helper — clears ALL supply search caches
// Called when demands change so supply searches reflect new data
// ═══════════════════════════════════════════════════════════════
async function invalidateAllSupplyCaches() {
  try {
    let cursor = '0';
    const keysToDelete = [];
    do {
      const result = await redisClient.scan(cursor, { MATCH: 'search:supply:*', COUNT: 100 });
      cursor = result.cursor?.toString?.() || result[0]?.toString?.() || '0';
      const keys = result.keys || result[1] || [];
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
      console.log(`[Cache] Invalidated ${keysToDelete.length} supply search caches`);
    }
  } catch (err) {
    console.error('[Cache] Cross-invalidation error:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/demand — Create a new demand
// ═══════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const {
      item_name,
      item_category,
      category_id,
      item_description,
      max_price_per_unit,
      currency,
      quantity,
      quantity_unit,
      required_by,
      delivery_location,
      search_radius
    } = req.body;

    // Check if organisation exists
    const [orgCheck] = await pool.query('SELECT 1 FROM organisation WHERE org_id = ?', [orgId]);
    if (orgCheck.length === 0) {
      return res.status(401).json({ error: 'Organisation not found. Please log in again.' });
    }

    if (!item_name) {
      return res.status(400).json({ error: 'item_name is required.' });
    }

    // Resolve category_id: use direct ID if provided, else look up by name
    let resolvedCategoryId = category_id || null;
    if (!resolvedCategoryId && item_category) {
      const [catRows] = await pool.query(
        `SELECT category_id FROM item_category WHERE category_name = ? LIMIT 1`,
        [item_category]
      );
      if (catRows.length > 0) {
        resolvedCategoryId = catRows[0].category_id;
      } else {
        // Auto-create category if not found
        try {
            const slug = item_category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cat-' + Date.now();
            const [newCat] = await pool.query(
                `INSERT INTO item_category (category_name, slug) VALUES (?, ?)`,
                [item_category, slug]
            );
            resolvedCategoryId = newCat.insertId;
        } catch (catErr) {
            console.warn('[Demand] Category auto-creation failed:', catErr.message);
        }
      }
    }
    // Default to category 1 if nothing resolves
    if (!resolvedCategoryId) {
       try {
          await pool.query(`INSERT IGNORE INTO item_category (category_id, category_name, slug) VALUES (1, 'Uncategorized', 'uncategorized')`);
       } catch (ign) {}
       resolvedCategoryId = 1;
    }

    const [result] = await pool.query(
      `INSERT INTO org_demand
         (org_id, category_id, item_name, item_description,
          max_price_per_unit, currency, quantity, quantity_unit,
          required_by, delivery_location, search_radius,
          is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [
        orgId,
        resolvedCategoryId,
        item_name,
        item_description || null,
        max_price_per_unit || 0,
        currency || 'USD',
        quantity || 0,
        quantity_unit || 'unit',
        required_by || null,
        delivery_location || null,
        search_radius || 50,
      ]
    );

    // Cross-invalidate: new demand means existing supply search caches are stale
    invalidateAllSupplyCaches().catch(() => {});

    res.status(201).json({
      message: 'Demand created successfully.',
      demand_id: result.insertId,
    });
  } catch (err) {
    console.error('[Demand] Create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/demand/:id/rate — Rate a demand (1-5 stars)
// MUST be defined BEFORE PUT /:id to avoid Express route conflict
// ═══════════════════════════════════════════════════════════════
router.put('/:id/rate', async (req, res) => {
  try {
    const demandId = req.params.id;
    const { rating } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: 'rating is required (1-5).' });
    }

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5.' });
    }

    // Round to nearest 0.5
    const roundedRating = Math.round(numRating * 2) / 2;

    await pool.query(
      `UPDATE org_demand SET rating = ?, updated_at = NOW() WHERE demand_id = ? AND deleted_at IS NULL`,
      [roundedRating, demandId]
    );

    res.json({ message: 'Demand rated successfully.', demand_id: parseInt(demandId), rating: roundedRating });
  } catch (err) {
    console.error('[Demand] Rate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/demand/:id — Update a demand listing (FR-09)
// ═══════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const demandId = req.params.id;
    const orgId = req.user.org_id;

    // Verify ownership
    const [existing] = await pool.query(
      'SELECT demand_id FROM org_demand WHERE demand_id = ? AND org_id = ? AND deleted_at IS NULL',
      [demandId, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Demand not found or not owned by you.' });
    }

    const {
      item_name, item_category, category_id, item_description,
      max_price_per_unit, currency, quantity, quantity_unit,
      required_by, delivery_location, search_radius
    } = req.body;

    // Resolve category_id if name provided
    let resolvedCategoryId = category_id || null;
    if (!resolvedCategoryId && item_category) {
      const [catRows] = await pool.query(
        'SELECT category_id FROM item_category WHERE category_name = ? LIMIT 1',
        [item_category]
      );
      if (catRows.length > 0) resolvedCategoryId = catRows[0].category_id;
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    if (item_name !== undefined) { updates.push('item_name = ?'); values.push(item_name); }
    if (resolvedCategoryId !== null) { updates.push('category_id = ?'); values.push(resolvedCategoryId); }
    if (item_description !== undefined) { updates.push('item_description = ?'); values.push(item_description); }
    if (max_price_per_unit !== undefined) { updates.push('max_price_per_unit = ?'); values.push(max_price_per_unit); }
    if (currency !== undefined) { updates.push('currency = ?'); values.push(currency); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (quantity_unit !== undefined) { updates.push('quantity_unit = ?'); values.push(quantity_unit); }
    if (required_by !== undefined) { updates.push('required_by = ?'); values.push(required_by || null); }
    if (delivery_location !== undefined) { updates.push('delivery_location = ?'); values.push(delivery_location); }
    if (search_radius !== undefined) { updates.push('search_radius = ?'); values.push(search_radius); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    updates.push('updated_at = NOW()');
    values.push(demandId, orgId);

    await pool.query(
      `UPDATE org_demand SET ${updates.join(', ')} WHERE demand_id = ? AND org_id = ?`,
      values
    );

    // Cross-invalidate: demand changed → supply caches are stale too
    try {
      await redisClient.del(`search:demand:${demandId}`);
      invalidateAllSupplyCaches().catch(() => {});
    } catch (cacheErr) {
      console.error('[Demand] Cache invalidation on update error:', cacheErr.message);
    }

    res.json({ message: 'Demand updated successfully.', demand_id: parseInt(demandId) });
  } catch (err) {
    console.error('[Demand] Update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/demand — List demands for the logged-in org
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [rows] = await pool.query(
      `SELECT d.demand_id, d.item_name, c.category_name AS item_category,
              d.item_description, d.max_price_per_unit, d.currency,
              d.quantity, d.quantity_unit, d.required_by, d.delivery_location,
              d.search_radius, d.is_active, d.rating, d.created_at
       FROM org_demand d
       LEFT JOIN item_category c ON c.category_id = d.category_id
       WHERE d.org_id = ? AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Demand] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/demand/:id — Get a single demand
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    // Prevent match for special keywords
    if (req.params.id === 'search' || req.params.id === 'cache') return;

    const [rows] = await pool.query(
      `SELECT d.*, c.category_name AS item_category,
              o.org_name, o.latitude AS org_lat, o.longitude AS org_lng,
              o.email AS org_email, o.phone_number AS org_phone, o.address AS org_address
       FROM org_demand d
       JOIN organisation o ON o.org_id = d.org_id
       LEFT JOIN item_category c ON c.category_id = d.category_id
       WHERE d.demand_id = ? AND d.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Demand not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Demand] Get error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/demand/:id — Soft-delete a demand
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE org_demand SET deleted_at = NOW(), is_active = FALSE WHERE demand_id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    );

    // Cross-invalidate: deleted demand → supply caches are stale
    try {
      await redisClient.del(`search:demand:${req.params.id}`);
      invalidateAllSupplyCaches().catch(() => {});
    } catch (cacheErr) {
      console.error('[Demand] Cache invalidation on delete error:', cacheErr.message);
    }

    res.json({ message: 'Demand deleted.' });
  } catch (err) {
    console.error('[Demand] Delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/demand/:id/search — Search for matching supplies
// ═══════════════════════════════════════════════════════════════
router.get('/:id/search', async (req, res) => {
  try {
    const demandId = req.params.id;
    const forceRefresh = req.query.force === 'true';
    const radiusOverride = req.query.radius ? parseFloat(req.query.radius) : null;
    const cacheKey = `search:demand:${demandId}`;

    // ── STEP 1: Check cache ──
    if (!forceRefresh) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const ttl = await redisClient.ttl(cacheKey);
          return res.json({
            ...parsed,
            cached: true,
            cache_expires_in_seconds: ttl,
          });
        }
      } catch (cacheErr) {
        console.error('[Demand Search] Cache read error:', cacheErr.message);
      }
    }

    // ── STEP 2: Query Database — fetch demand + its org ──
    const [demandRows] = await pool.query(
      `SELECT d.*, c.category_name AS item_category,
              o.org_name, o.latitude AS org_lat, o.longitude AS org_lng,
              o.email AS org_email, o.phone_number AS org_phone,
              o.address AS org_address, o.org_id
       FROM org_demand d
       JOIN organisation o ON o.org_id = d.org_id
       LEFT JOIN item_category c ON c.category_id = d.category_id
       WHERE d.demand_id = ? AND d.is_active = TRUE AND d.deleted_at IS NULL`,
      [demandId]
    );

    if (demandRows.length === 0) {
      return res.status(404).json({ error: 'Demand not found or inactive.' });
    }

    const demand = demandRows[0];
    const searchRadius = radiusOverride || demand.search_radius || 50;

    // ── STEP 3: Query Database — fetch all candidate supplies (other orgs) ──
    console.log(`[Demand Search] fetching candidates for demand ${demand.demand_id} (org ${demand.org_id}) with radius ${searchRadius}km`);
    
    const [supplyRows] = await pool.query(
      `SELECT s.*, c.category_name AS item_category,
              o.org_id AS supply_org_id, o.org_name AS supply_org_name,
              o.latitude, o.longitude,
              o.email AS supply_org_email, o.phone_number AS supply_org_phone,
              o.address AS supply_org_address
       FROM org_supply s
       JOIN organisation o ON o.org_id = s.org_id
       LEFT JOIN item_category c ON c.category_id = s.category_id
       WHERE s.is_active = TRUE
         AND s.deleted_at IS NULL
         AND s.org_id != ?`,
      [demand.org_id]
    );

    // ── STEP 4: Send to Matching Worker for scoring ──
    const workerPayload = {
      demand: {
        demand_id: demand.demand_id,
        org_id: demand.org_id,
        item_name: demand.item_name,
        item_category: demand.item_category,
        category_id: demand.category_id,
        item_description: demand.item_description,
        max_price_per_unit: demand.max_price_per_unit,
        currency: demand.currency,
        quantity: demand.quantity,
        quantity_unit: demand.quantity_unit,
      },
      demand_org: {
        org_id: demand.org_id,
        org_name: demand.org_name,
        email: demand.org_email,
        phone_number: demand.org_phone,
        address: demand.org_address,
        latitude: demand.org_lat,
        longitude: demand.org_lng,
      },
      search_radius: searchRadius,
      candidates: supplyRows.map(s => ({
        supply: {
          supply_id: s.supply_id,
          org_id: s.supply_org_id,
          item_name: s.item_name,
          item_category: s.item_category,
          category_id: s.category_id,
          item_description: s.item_description,
          price_per_unit: s.price_per_unit,
          currency: s.currency,
          quantity: s.quantity,
          quantity_unit: s.quantity_unit,
          search_radius: s.search_radius
        },
        org: {
          org_id: s.supply_org_id,
          org_name: s.supply_org_name,
          email: s.supply_org_email,
          phone_number: s.supply_org_phone,
          address: s.supply_org_address,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      })),
    };

    const workerRes = await fetch(`${WORKER_URL}/match/demand-to-supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerPayload),
    });

    if (!workerRes.ok) {
      const errBody = await workerRes.text();
      console.error('[Demand Search] Worker error:', errBody);
      return res.status(502).json({ error: 'Matching worker failed.', detail: errBody });
    }

    const workerData = await workerRes.json();

    // ── STEP 5: Compose response + store in cache ──
    const responseData = {
      demand_id: parseInt(demandId),
      demand_org_name: demand.org_name,
      demand_org_lat: demand.org_lat,
      demand_org_lng: demand.org_lng,
      demand_item_name: demand.item_name,
      demand_item_category: demand.item_category,
      demand_max_price: demand.max_price_per_unit,
      demand_currency: demand.currency,
      demand_quantity: demand.quantity,
      demand_quantity_unit: demand.quantity_unit,
      total_results: workerData.total_results,
      search_radius_km: searchRadius,
      cached: false,
      cache_expires_in_seconds: null,
      results: workerData.results,
      searched_at: new Date().toISOString(),
    };

    try {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(responseData));
    } catch (cacheErr) {
      console.error('[Demand Search] Cache write error:', cacheErr.message);
    }

    // ── STEP 6: Return to frontend ──
    res.json(responseData);
  } catch (err) {
    console.error('[Demand Search] Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/demand/:id/cache — Invalidate cached search
// ═══════════════════════════════════════════════════════════════
router.delete('/:id/cache', async (req, res) => {
  try {
    const cacheKey = `search:demand:${req.params.id}`;
    await redisClient.del(cacheKey);
    res.json({ message: 'Cache invalidated.' });
  } catch (err) {
    console.error('[Demand] Cache invalidation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
