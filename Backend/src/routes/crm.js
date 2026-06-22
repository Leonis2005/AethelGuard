const express = require('express');
const crypto = require('crypto');
const { query } = require('../lib/db');
const { logAudit } = require('../lib/security');

const router = express.Router();
const demoOrgId = '11111111-1111-1111-1111-111111111111';
const demoUserId = '22222222-2222-2222-2222-222222222222';
const allowedPriorities = new Set(['low', 'medium', 'high', 'urgent']);
const allowedStatuses = new Set(['open', 'pending', 'resolved', 'closed']);
const allowedStages = new Set(['qualification', 'proposal', 'negotiation', 'won', 'lost']);

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildActivityPayload(entityType, entityId, action, details) {
  return {
    organization_id: demoOrgId,
    actor_user_id: demoUserId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    details,
  };
}

async function insertActivity(activity) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO activities (id, organization_id, actor_user_id, entity_type, entity_id, action, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, activity.organization_id, activity.actor_user_id, activity.entity_type, activity.entity_id, activity.action, activity.details]
  );
}

router.get('/overview', async (_req, res) => {
  try {
    const [contactsCount] = await query(
      'SELECT COUNT(*) AS count FROM contacts WHERE organization_id = ?',
      [demoOrgId]
    );
    const [ticketsCount] = await query(
      'SELECT COUNT(*) AS count FROM tickets WHERE organization_id = ?',
      [demoOrgId]
    );
    const [dealsCount] = await query(
      'SELECT COUNT(*) AS count FROM deals WHERE organization_id = ?',
      [demoOrgId]
    );
    const [tasksCount] = await query(
      'SELECT COUNT(*) AS count FROM tasks WHERE organization_id = ?',
      [demoOrgId]
    );

    const [openTickets] = await query(
      'SELECT COUNT(*) AS count FROM tickets WHERE organization_id = ? AND status = ?',
      [demoOrgId, 'open']
    );
    const [resolvedTickets] = await query(
      'SELECT COUNT(*) AS count FROM tickets WHERE organization_id = ? AND status = ?',
      [demoOrgId, 'resolved']
    );

    res.json({
      metrics: {
        contacts: Number(contactsCount.count),
        tickets: Number(ticketsCount.count),
        deals: Number(dealsCount.count),
        tasks: Number(tasksCount.count),
        openTickets: Number(openTickets.count),
        resolvedTickets: Number(resolvedTickets.count),
      },
    });
  } catch (error) {
    console.error('Overview error:', error.message);
    res.status(500).json({ message: 'Unable to load dashboard overview' });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    let sql = `
      SELECT t.*, c.first_name, c.last_name, c.email
      FROM tickets t
      LEFT JOIN contacts c ON c.id = t.contact_id
      WHERE t.organization_id = ?
    `;
    const params = [demoOrgId];

    if (status) {
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ message: 'Invalid ticket status value' });
      }
      sql += ' AND t.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tickets = await query(sql, params);
    res.json(tickets);
  } catch (error) {
    console.error('Tickets error:', error.message);
    res.status(500).json({ message: 'Unable to load tickets' });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const {
      subject,
      description,
      priority = 'medium',
      status = 'open',
      channel = 'email',
      contactId,
    } = req.body;

    const normalizedSubject = String(subject || '').trim();
    const normalizedDescription = String(description || '').trim();

    if (!normalizedSubject || !normalizedDescription) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }
    if (!allowedPriorities.has(String(priority))) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }
    if (!allowedStatuses.has(String(status))) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO tickets (id, organization_id, contact_id, assigned_to_user_id, channel, priority, status, subject, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        demoOrgId,
        contactId || null,
        demoUserId,
        String(channel || 'email').slice(0, 32),
        String(priority),
        String(status),
        normalizedSubject.slice(0, 255),
        normalizedDescription.slice(0, 2000),
      ]
    );

    await insertActivity(
      buildActivityPayload('ticket', id, 'created', `New ticket created: ${normalizedSubject}`)
    );
    logAudit('ticket_created', { organizationId: demoOrgId, targetType: 'ticket', targetId: id });

    res.status(201).json({ id, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Create ticket error:', error.message);
    res.status(500).json({ message: 'Unable to create ticket' });
  }
});

router.get('/contacts', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    let sql = 'SELECT * FROM contacts WHERE organization_id = ?';
    const params = [demoOrgId];

    if (search) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';

    const contacts = await query(sql, params);
    res.json(contacts);
  } catch (error) {
    console.error('Contacts error:', error.message);
    res.status(500).json({ message: 'Unable to load contacts' });
  }
});

router.post('/contacts', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      status = 'new',
      source = 'website',
    } = req.body;

    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'First name, last name, and a valid email are required' });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO contacts (id, organization_id, owner_user_id, first_name, last_name, email, phone, company, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        demoOrgId,
        demoUserId,
        normalizedFirstName.slice(0, 100),
        normalizedLastName.slice(0, 100),
        normalizedEmail.slice(0, 255),
        String(phone || '').trim().slice(0, 50) || null,
        String(company || '').trim().slice(0, 255) || null,
        String(status || 'new').slice(0, 50),
        String(source || 'website').slice(0, 50),
      ]
    );

    await insertActivity(
      buildActivityPayload('contact', id, 'created', `${normalizedFirstName} ${normalizedLastName} added to contacts`)
    );
    logAudit('contact_created', { organizationId: demoOrgId, targetType: 'contact', targetId: id });

    res.status(201).json({ id, message: 'Contact created successfully' });
  } catch (error) {
    console.error('Create contact error:', error.message);
    res.status(500).json({ message: 'Unable to create contact' });
  }
});

router.get('/deals', async (_req, res) => {
  try {
    const deals = await query(
      `SELECT d.*, c.first_name, c.last_name
       FROM deals d
       LEFT JOIN contacts c ON c.id = d.contact_id
       WHERE d.organization_id = ?
       ORDER BY d.close_date ASC`,
      [demoOrgId]
    );
    res.json(deals);
  } catch (error) {
    console.error('Deals error:', error.message);
    res.status(500).json({ message: 'Unable to load deals' });
  }
});

router.post('/deals', async (req, res) => {
  try {
    const {
      contactId,
      title,
      amount,
      stage = 'qualification',
      closeDate,
    } = req.body;

    const normalizedTitle = String(title || '').trim();
    const numericAmount = Number(amount);

    if (!normalizedTitle || Number.isNaN(numericAmount)) {
      return res.status(400).json({ message: 'Title and a valid amount are required' });
    }
    if (!allowedStages.has(String(stage))) {
      return res.status(400).json({ message: 'Invalid deal stage value' });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO deals (id, organization_id, contact_id, owner_user_id, title, amount, stage, close_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        demoOrgId,
        contactId || null,
        demoUserId,
        normalizedTitle.slice(0, 255),
        numericAmount,
        String(stage),
        closeDate || null,
      ]
    );

    await insertActivity(
      buildActivityPayload('deal', id, 'created', `Deal created: ${normalizedTitle}`)
    );
    logAudit('deal_created', { organizationId: demoOrgId, targetType: 'deal', targetId: id });

    res.status(201).json({ id, message: 'Deal created successfully' });
  } catch (error) {
    console.error('Create deal error:', error.message);
    res.status(500).json({ message: 'Unable to create deal' });
  }
});

router.get('/activities', async (_req, res) => {
  try {
    const activities = await query(
      `SELECT a.*, u.full_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.actor_user_id
       WHERE a.organization_id = ?
       ORDER BY a.created_at DESC
       LIMIT 20`,
      [demoOrgId]
    );
    res.json(activities);
  } catch (error) {
    console.error('Activities error:', error.message);
    res.status(500).json({ message: 'Unable to load activity feed' });
  }
});

module.exports = router;
