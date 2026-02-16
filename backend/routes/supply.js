
const express = require('express');
const router = express.Router();
const pool = require('../connections/db');
const { redisClient } = require('../connections/redis');

const CACHE_TTL_SECONDS = 900; // 15 minutes (was 1 hour — too stale for dynamic marketplace)
const WORKER_URL = process.env.MATCHING_WORKER_URL || 'http://matching-worker:8000';

// ═══════════════════════════════════════════════════════════════
// Cache Invalidation Helper — clears ALL demand search caches
// Called when supplies change so demand searches reflect new data
// ═══════════════════════════════════════════════════════════════
async function invalidateAllDemandCaches() {
  try {
    // Use SCAN to find all demand search keys safely (no KEYS in production)
    let cursor = '0';
    const keysToDelete = [];
    do {
      const result = await redisClient.scan(cursor, { MATCH: 'search:demand:*', COUNT: 100 });
      cursor = result.cursor?.toString?.() || result[0]?.toString?.() || '0';
      const keys = result.keys || result[1] || [];
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
      console.log(`[Cache] Invalidated ${keysToDelete.length} demand search caches`);
    }
  } catch (err) {
    console.error('[Cache] Cross-invalidation error:', err.message);
  }
}

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
// POST /api/supply — Create a new supply
// ═══════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const {
      item_name,
      item_category,
      category_id,
      item_description,
      price_per_unit,
      currency,
      quantity,
      quantity_unit,
      search_radius,
      expiry_date,
      supplier_name,
      supplier_contact, // mapped to supplier_phone
      supplier_email,
    } = req.body;

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
            console.warn('[Supply] Category auto-creation failed:', catErr.message);
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
      `INSERT INTO org_supply
         (org_id, category_id, item_name, item_description,
          price_per_unit, currency, quantity, quantity_unit,
          search_radius, expiry_date, supplier_name,
          supplier_phone, supplier_email,
          is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [
        orgId,
        resolvedCategoryId,
        item_name,
        item_description || null,
        price_per_unit || 0,
        currency || 'INR',
        quantity || 0,
        quantity_unit || 'unit',
        search_radius || 50,
        expiry_date || null,
        supplier_name || null,
        supplier_contact || null,
        supplier_email || null,
      ]
    );

    // Cross-invalidate: new supply means existing demand search caches are stale
    invalidateAllDemandCaches().catch(() => {});

    res.status(201).json({
      message: 'Supply created successfully.',
      supply_id: result.insertId,
    });
  } catch (err) {
    console.error('[Supply] Create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/supply/:id/rate — Rate a supply (1-5 stars)
// MUST be defined BEFORE PUT /:id to avoid Express route conflict
// ═══════════════════════════════════════════════════════════════
router.put('/:id/rate', async (req, res) => {
  try {
    const supplyId = req.params.id;
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
      `UPDATE org_supply SET rating = ?, updated_at = NOW() WHERE supply_id = ? AND deleted_at IS NULL`,
      [roundedRating, supplyId]
    );

    res.json({ message: 'Supply rated successfully.', supply_id: parseInt(supplyId), rating: roundedRating });
  } catch (err) {
    console.error('[Supply] Rate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUT /api/supply/:id — Update a supply listing (FR-05)
// ═══════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const supplyId = req.params.id;
    const orgId = req.user.org_id;

    // Verify ownership
    const [existing] = await pool.query(
      'SELECT supply_id FROM org_supply WHERE supply_id = ? AND org_id = ? AND deleted_at IS NULL',
      [supplyId, orgId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Supply not found or not owned by you.' });
    }

    const {
      item_name, item_category, category_id, item_description,
      price_per_unit, currency, quantity, quantity_unit,
      search_radius, expiry_date, supplier_name, supplier_contact, supplier_email
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
    if (price_per_unit !== undefined) { updates.push('price_per_unit = ?'); values.push(price_per_unit); }
    if (currency !== undefined) { updates.push('currency = ?'); values.push(currency); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (quantity_unit !== undefined) { updates.push('quantity_unit = ?'); values.push(quantity_unit); }
    if (search_radius !== undefined) { updates.push('search_radius = ?'); values.push(search_radius); }
    if (expiry_date !== undefined) { updates.push('expiry_date = ?'); values.push(expiry_date || null); }
    if (supplier_name !== undefined) { updates.push('supplier_name = ?'); values.push(supplier_name); }
    if (supplier_contact !== undefined) { updates.push('supplier_phone = ?'); values.push(supplier_contact); }
    if (supplier_email !== undefined) { updates.push('supplier_email = ?'); values.push(supplier_email); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    updates.push('updated_at = NOW()');
    values.push(supplyId, orgId);

    await pool.query(
      `UPDATE org_supply SET ${updates.join(', ')} WHERE supply_id = ? AND org_id = ?`,
      values
    );

    // Cross-invalidate: supply changed → demand caches are stale too
    try {
      await redisClient.del(`search:supply:${supplyId}`);
      invalidateAllDemandCaches().catch(() => {});
    } catch (cacheErr) {
      console.error('[Supply] Cache invalidation on update error:', cacheErr.message);
    }

    res.json({ message: 'Supply updated successfully.', supply_id: parseInt(supplyId) });
  } catch (err) {
    console.error('[Supply] Update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/supply — List supplies for the logged-in org
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [rows] = await pool.query(
      `SELECT s.supply_id, s.item_name, c.category_name AS item_category,
              s.item_description, s.price_per_unit, s.currency,
              s.quantity, s.quantity_unit, s.search_radius,
              s.expiry_date, s.supplier_name,
              s.supplier_phone AS supplier_contact,
              s.supplier_email, s.is_active, s.rating, s.created_at
       FROM org_supply s
       LEFT JOIN item_category c ON c.category_id = s.category_id
       WHERE s.org_id = ? AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Supply] List error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/supply/:id — Get a single supply
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'search' || req.params.id === 'cache') return;

    const [rows] = await pool.query(
      `SELECT s.*, c.category_name AS item_category,
              o.org_name, o.latitude AS org_lat, o.longitude AS org_lng,
              o.email AS org_email, o.phone_number AS org_phone, o.address AS org_address
       FROM org_supply s
       JOIN organisation o ON o.org_id = s.org_id
       LEFT JOIN item_category c ON c.category_id = s.category_id
       WHERE s.supply_id = ? AND s.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Supply not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Supply] Get error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/supply/:id — Soft-delete a supply
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE org_supply SET deleted_at = NOW(), is_active = FALSE WHERE supply_id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    );

    // Cross-invalidate: deleted supply → demand caches are stale
    try {
      await redisClient.del(`search:supply:${req.params.id}`);
      invalidateAllDemandCaches().catch(() => {});
    } catch (cacheErr) {
      console.error('[Supply] Cache invalidation on delete error:', cacheErr.message);
    }

    res.json({ message: 'Supply deleted.' });
  } catch (err) {
    console.error('[Supply] Delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/supply/:id/search — Search for matching demands
// ═══════════════════════════════════════════════════════════════
router.get('/:id/search', async (req, res) => {
  try {
    const supplyId = req.params.id;
    const forceRefresh = req.query.force === 'true';
    const radiusOverride = req.query.radius ? parseFloat(req.query.radius) : null;
    const cacheKey = `search:supply:${supplyId}`;

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
        console.error('[Supply Search] Cache read error:', cacheErr.message);
      }
    }

    // ── STEP 2: Query Database — fetch supply + its org ──
    const [supplyRows] = await pool.query(
      `SELECT s.*, c.category_name AS item_category,
              o.org_name, o.latitude AS org_lat, o.longitude AS org_lng,
              o.email AS org_email, o.phone_number AS org_phone,
              o.address AS org_address, o.org_id
       FROM org_supply s
       JOIN organisation o ON o.org_id = s.org_id
       LEFT JOIN item_category c ON c.category_id = s.category_id
       WHERE s.supply_id = ? AND s.is_active = TRUE AND s.deleted_at IS NULL`,
      [supplyId]
    );

    if (supplyRows.length === 0) {
      return res.status(404).json({ error: 'Supply not found or inactive.' });
    }

    const supply = supplyRows[0];
    const searchRadius = radiusOverride || supply.search_radius || 50;

    // ── STEP 3: Query Database — fetch all candidate demands (other orgs) ──
    console.log(`[Supply Search] fetching candidates for supply ${supply.supply_id} (org ${supply.org_id}) with radius ${searchRadius}km`);
    const [demandRows] = await pool.query(
      `SELECT d.*, c.category_name AS item_category,
              o.org_id AS demand_org_id, o.org_name AS demand_org_name,
              o.latitude, o.longitude,
              o.email AS demand_org_email, o.phone_number AS demand_org_phone,
              o.address AS demand_org_address
       FROM org_demand d
       JOIN organisation o ON o.org_id = d.org_id
       LEFT JOIN item_category c ON c.category_id = d.category_id
       WHERE d.is_active = TRUE
         AND d.deleted_at IS NULL
         AND d.org_id != ?`,
      [supply.org_id]
    );

    // ── STEP 4: Send to Matching Worker for scoring ──
    const workerPayload = {
      supply: {
        supply_id: supply.supply_id,
        org_id: supply.org_id,
        item_name: supply.item_name,
        item_category: supply.item_category,
        category_id: supply.category_id,
        item_description: supply.item_description,
        price_per_unit: supply.price_per_unit,
        currency: supply.currency,
        quantity: supply.quantity,
        quantity_unit: supply.quantity_unit,
        search_radius: searchRadius,
      },
      supply_org: {
        org_id: supply.org_id,
        org_name: supply.org_name,
        email: supply.org_email,
        phone_number: supply.org_phone,
        address: supply.org_address,
        latitude: supply.org_lat,
        longitude: supply.org_lng,
      },
      search_radius: searchRadius,
      candidates: demandRows.map(d => ({
        demand: {
          demand_id: d.demand_id,
          org_id: d.demand_org_id,
          item_name: d.item_name,
          item_category: d.item_category,
          category_id: d.category_id,
          item_description: d.item_description,
          max_price_per_unit: d.max_price_per_unit,
          currency: d.currency,
          quantity: d.quantity,
          quantity_unit: d.quantity_unit,
        },
        org: {
          org_id: d.demand_org_id,
          org_name: d.demand_org_name,
          email: d.demand_org_email,
          phone_number: d.demand_org_phone,
          address: d.demand_org_address,
          latitude: d.latitude,
          longitude: d.longitude,
        },
      })),
    };

    const workerRes = await fetch(`${WORKER_URL}/match/supply-to-demands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerPayload),
    });

    if (!workerRes.ok) {
      const errBody = await workerRes.text();
      console.error('[Supply Search] Worker error:', errBody);
      return res.status(502).json({ error: 'Matching worker failed.', detail: errBody });
    }

    const workerData = await workerRes.json();

    // ── STEP 5: Compose response + store in cache ──
    const responseData = {
      supply_id: parseInt(supplyId),
      supply_org_name: supply.org_name,
      supply_org_lat: supply.org_lat,
      supply_org_lng: supply.org_lng,
      supply_item_name: supply.item_name,
      supply_item_category: supply.item_category,
      supply_price: supply.price_per_unit,
      supply_currency: supply.currency,
      supply_quantity: supply.quantity,
      supply_quantity_unit: supply.quantity_unit,
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
      console.error('[Supply Search] Cache write error:', cacheErr.message);
    }

    // ── STEP 6: Return to frontend ──
    res.json(responseData);
  } catch (err) {
    console.error('[Supply Search] Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/supply/:id/cache — Invalidate cached search
// ═══════════════════════════════════════════════════════════════
router.delete('/:id/cache', async (req, res) => {
  try {
    const cacheKey = `search:supply:${req.params.id}`;
    await redisClient.del(cacheKey);
    res.json({ message: 'Cache invalidated.' });
  } catch (err) {
    console.error('[Supply] Cache invalidation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
