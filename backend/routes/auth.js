const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../connections/db');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'change_me_in_production';
const JWT_EXPIRY  = process.env.JWT_EXPIRY  || '24h';
const BCRYPT_COST = 12;

// post: api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      org_name,
      email,
      password,
      phone_number,
      address,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      description,
    } = req.body;

    // validate required fields
    if (
      !org_name || !email || !password || !phone_number ||
      !address  || !city  || !state    || !country      ||
      !postal_code || latitude === undefined || longitude === undefined
    ) {
      return res.status(400).json({
        error: 'All fields are required: org_name, email, password, phone_number, address, city, state, country, postal_code, latitude, longitude.',
      });
    }

    // check for duplicate email
    const [existing] = await pool.query(
      'SELECT org_id FROM organisation WHERE email = ?',
      [email],
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An organisation with this email already exists.' });
    }

    // hash password with bcrypt (cost 12)
    const password_hash = await bcrypt.hash(password, BCRYPT_COST);

    // insert new organisation
    const [result] = await pool.query(
      `INSERT INTO organisation
         (org_name, email, password_hash, phone_number,
          address, city, state, country, postal_code,
          latitude, longitude, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        org_name, email, password_hash, phone_number,
        address, city, state, country, postal_code,
        latitude, longitude, description || null,
      ],
    );

    return res.status(201).json({
      message: 'Organisation registered successfully.',
      org_id:  result.insertId,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// post: api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // look up organisation by email
    const [rows] = await pool.query(
      'SELECT org_id, org_name, password_hash FROM organisation WHERE email = ?',
      [email],
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const org = rows[0];

    // verify password
    const isMatch = await bcrypt.compare(password, org.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // sign JWT (24‑hour expiry)
    const token = jwt.sign(
      { org_id: org.org_id, org_name: org.org_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      org_id:   org.org_id,
      org_name: org.org_name,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// get: api/auth/me  (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT org_id, org_name, email, phone_number, website_url,
              description, logo_url, address, city, state, country,
              postal_code, latitude, longitude, is_active, is_suspended,
              created_at, updated_at
       FROM organisation WHERE org_id = ?`,
      [req.user.org_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organisation not found.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[Auth] /me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
