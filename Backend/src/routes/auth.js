const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../lib/db');
const { logAudit } = require('../lib/security');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

router.post('/register', async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      password,
      confirmPassword,
      phone,
      website,
      industry,
      country,
    } = req.body;

    const normalizedBusinessName = String(businessName || '').trim();
    const normalizedOwnerName = String(ownerName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const normalizedWebsite = String(website || '').trim();
    const normalizedIndustry = String(industry || '').trim();
    const normalizedCountry = String(country || '').trim();

    if (!normalizedBusinessName || !normalizedOwnerName || !normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Business name, owner name, email, password, and confirmation are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 10 || password !== confirmPassword) {
      return res.status(400).json({ message: 'Password must be at least 10 characters and match confirmation' });
    }

    const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const organizationId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const businessId = crypto.randomUUID();
    const ownerRecordId = crypto.randomUUID();
    const slug = slugify(normalizedBusinessName) || 'business';
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO organizations (id, name, slug, is_active)
       VALUES (?, ?, ?, 1)`,
      [organizationId, normalizedBusinessName, `${slug}-${organizationId.slice(0, 8)}`]
    );

    await query(
      `INSERT INTO users (id, organization_id, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'owner', 1)`,
      [userId, organizationId, normalizedEmail, passwordHash, normalizedOwnerName]
    );

    await query(
      `INSERT INTO businesses (id, organization_id, owner_user_id, business_name, business_email, owner_name, phone, website, industry, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId,
        organizationId,
        userId,
        normalizedBusinessName,
        normalizedEmail,
        normalizedOwnerName,
        normalizedPhone || null,
        normalizedWebsite || null,
        normalizedIndustry || null,
        normalizedCountry || null,
      ]
    );

    await query(
      `INSERT INTO business_owners (id, organization_id, user_id, owner_name, email, phone, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [ownerRecordId, organizationId, userId, normalizedOwnerName, normalizedEmail, normalizedPhone || null]
    );

    const assetRecords = [
      {
        id: crypto.randomUUID(),
        asset_type: 'domain',
        asset_name: 'Primary domain',
        account_name: normalizedWebsite || 'your-domain.com',
        provider: 'Registrar',
        owner_name: normalizedOwnerName,
        status: 'verified',
        note: 'Primary website domain tracked',
      },
      {
        id: crypto.randomUUID(),
        asset_type: 'hosting',
        asset_name: 'Hosting account',
        account_name: `${normalizedBusinessName} Hosting`,
        provider: 'Hosting provider',
        owner_name: normalizedOwnerName,
        status: 'active',
        note: 'Hosting credentials tracked securely',
      },
      {
        id: crypto.randomUUID(),
        asset_type: 'ssl',
        asset_name: 'SSL certificate',
        account_name: `ssl.${slug || 'business'}.com`,
        provider: 'Certificate authority',
        owner_name: normalizedOwnerName,
        status: 'warning',
        note: 'Renewal reminder set',
      },
      {
        id: crypto.randomUUID(),
        asset_type: 'email',
        asset_name: 'Business email',
        account_name: normalizedEmail,
        provider: 'Microsoft 365',
        owner_name: normalizedOwnerName,
        status: 'verified',
        note: 'Primary inbox access recorded',
      },
      {
        id: crypto.randomUUID(),
        asset_type: 'social',
        asset_name: 'Social profile',
        account_name: `${normalizedBusinessName} Social`,
        provider: 'Social channel',
        owner_name: normalizedOwnerName,
        status: 'review',
        note: 'Access review required',
      },
    ];

    for (const asset of assetRecords) {
      await query(
        `INSERT INTO business_assets (id, organization_id, business_id, asset_type, asset_name, account_name, provider, owner_name, status, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.id,
          organizationId,
          businessId,
          asset.asset_type,
          asset.asset_name,
          asset.account_name,
          asset.provider,
          asset.owner_name,
          asset.status,
          asset.note,
        ]
      );
    }

    const token = jwt.sign(
      {
        sub: userId,
        orgId: organizationId,
        role: 'owner',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit('register_success', {
      userId,
      organizationId,
      email: normalizedEmail,
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        organizationId,
        email: normalizedEmail,
        fullName: normalizedOwnerName,
        role: 'owner',
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Unable to create your account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email and password are required' });
    }

    const users = await query(
      `SELECT id, organization_id, email, password_hash, full_name, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = users[0];
    if (!user || !user.is_active) {
      logAudit('login_failed', { email, reason: 'invalid_user' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      logAudit('login_failed', { email, reason: 'invalid_password' });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        orgId: user.organization_id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit('login_success', { userId: user.id, organizationId: user.organization_id });

    res.json({
      token,
      user: {
        id: user.id,
        organizationId: user.organization_id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Unable to complete login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const users = await query(
      `SELECT id, organization_id, email, full_name, role, is_active, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.sub]
    );

    if (!users[0]) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Me error:', error.message);
    res.status(500).json({ message: 'Unable to load user profile' });
  }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user.orgId;

    const [businessProfile] = await query(
      `SELECT id, organization_id, owner_user_id, business_name, business_email, owner_name, phone, website, industry, country
       FROM businesses
       WHERE organization_id = ?
       LIMIT 1`,
      [organizationId]
    );

    const assets = await query(
      `SELECT id, asset_type, asset_name, account_name, provider, owner_name, status, note, expiry_date
       FROM business_assets
       WHERE organization_id = ?
       ORDER BY asset_type, asset_name`,
      [organizationId]
    );

    const [contactsCount] = await query(
      'SELECT COUNT(*) AS count FROM contacts WHERE organization_id = ?',
      [organizationId]
    );
    const [ticketsCount] = await query(
      'SELECT COUNT(*) AS count FROM tickets WHERE organization_id = ?',
      [organizationId]
    );
    const [dealsCount] = await query(
      'SELECT COUNT(*) AS count FROM deals WHERE organization_id = ?',
      [organizationId]
    );
    const [tasksCount] = await query(
      'SELECT COUNT(*) AS count FROM tasks WHERE organization_id = ?',
      [organizationId]
    );
    const [openTickets] = await query(
      'SELECT COUNT(*) AS count FROM tickets WHERE organization_id = ? AND status = ?',
      [organizationId, 'open']
    );

    const riskAlerts = assets.filter((asset) => ['warning', 'review', 'risk'].includes(asset.status)).length;
    const renewalsDue = assets.filter((asset) => asset.expiry_date && new Date(asset.expiry_date) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)).length;

    res.json({
      business: businessProfile || null,
      assets,
      metrics: {
        assets: assets.length,
        contacts: Number(contactsCount.count),
        tickets: Number(ticketsCount.count),
        deals: Number(dealsCount.count),
        tasks: Number(tasksCount.count),
        openTickets: Number(openTickets.count),
        renewalsDue,
        riskAlerts,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({ message: 'Unable to load dashboard' });
  }
});

router.post('/logout', authMiddleware, (_req, res) => {
  logAudit('logout_success', {});
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
