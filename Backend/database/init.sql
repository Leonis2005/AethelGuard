-- AethelGuard — customer service and sales platform schema
-- This script creates the base tables needed for a CRM/workspace product.

CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY organizations_slug_key (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_organization_id_email_key (organization_id, email),
  KEY users_organization_id_idx (organization_id),
  CONSTRAINT users_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS businesses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  owner_user_id CHAR(36) NULL,
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  website VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY businesses_organization_id_idx (organization_id),
  KEY businesses_owner_user_id_idx (owner_user_id),
  CONSTRAINT businesses_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT businesses_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_assets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  business_id CHAR(36) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NULL,
  provider VARCHAR(255) NULL,
  owner_name VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  note TEXT NULL,
  expiry_date DATE NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY business_assets_org_idx (organization_id),
  KEY business_assets_business_idx (business_id),
  CONSTRAINT business_assets_org_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT business_assets_business_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_owners (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY business_owners_organization_id_idx (organization_id),
  KEY business_owners_user_id_idx (user_id),
  CONSTRAINT business_owners_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT business_owners_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  owner_user_id CHAR(36) NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  company VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  source VARCHAR(50) NOT NULL DEFAULT 'website',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY contacts_organization_id_idx (organization_id),
  KEY contacts_owner_user_id_idx (owner_user_id),
  CONSTRAINT contacts_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT contacts_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NULL,
  owner_user_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stage VARCHAR(50) NOT NULL DEFAULT 'qualification',
  close_date DATE NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY deals_organization_id_idx (organization_id),
  KEY deals_contact_id_idx (contact_id),
  CONSTRAINT deals_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT deals_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT deals_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NULL,
  assigned_to_user_id CHAR(36) NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'email',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'pending', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  subject VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY tickets_organization_id_idx (organization_id),
  KEY tickets_contact_id_idx (contact_id),
  KEY tickets_assigned_to_user_id_idx (assigned_to_user_id),
  CONSTRAINT tickets_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT tickets_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT tickets_assigned_to_user_id_fkey
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  sender_type ENUM('customer', 'agent', 'system') NOT NULL DEFAULT 'agent',
  sender_user_id CHAR(36) NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ticket_messages_ticket_id_idx (ticket_id),
  KEY ticket_messages_sender_user_id_idx (sender_user_id),
  CONSTRAINT ticket_messages_ticket_id_fkey
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ticket_messages_sender_user_id_fkey
    FOREIGN KEY (sender_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  assigned_to_user_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  due_date DATE NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY tasks_organization_id_idx (organization_id),
  KEY tasks_assigned_to_user_id_idx (assigned_to_user_id),
  CONSTRAINT tasks_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT tasks_assigned_to_user_id_fkey
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id CHAR(36) NOT NULL PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  actor_user_id CHAR(36) NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY activities_organization_id_idx (organization_id),
  KEY activities_actor_user_id_idx (actor_user_id),
  CONSTRAINT activities_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT activities_actor_user_id_fkey
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO organizations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TitanControl Demo', 'titancontrol-demo');

INSERT IGNORE INTO users (id, organization_id, email, password_hash, full_name, role)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@titancontrol.local', '$2b$10$7k7vE2gYJ3M2Q9s4K0tqceYH3A0Y8WmgkS0O5vR2Q2fKq1rQpQ0aC', 'Demo Admin', 'owner');

INSERT IGNORE INTO contacts (id, organization_id, owner_user_id, first_name, last_name, email, phone, company, status, source)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Ari', 'Krasniqi', 'ari@example.com', '+355691234567', 'BluePeak Labs', 'active', 'website'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Mira', 'Hoxha', 'mira@example.com', '+355682345678', 'Northwind', 'new', 'linkedin');

INSERT IGNORE INTO deals (id, organization_id, contact_id, owner_user_id, title, amount, stage, close_date)
VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Enterprise Support Plan', 15000.00, 'proposal', '2026-07-10'),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Voice AI Integration', 8500.00, 'negotiation', '2026-06-30');

INSERT IGNORE INTO tickets (id, organization_id, contact_id, assigned_to_user_id, channel, priority, status, subject, description)
VALUES
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'email', 'high', 'open', 'Login issue on customer portal', 'Customer cannot reset MFA on the portal.'),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'chat', 'medium', 'pending', 'Need billing details for renewal', 'Customer needs updated invoice for next renewal cycle.');

INSERT IGNORE INTO tasks (id, organization_id, assigned_to_user_id, title, status, due_date)
VALUES
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Follow-up with onboarding client', 'todo', '2026-06-24'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Prepare QBR deck for enterprise account', 'in-progress', '2026-06-27');

INSERT IGNORE INTO activities (id, organization_id, actor_user_id, entity_type, entity_id, action, details)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ticket', '77777777-7777-7777-7777-777777777777', 'created', 'Issued a new support request from email.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'deal', '55555555-5555-5555-5555-555555555555', 'updated', 'Deal moved to proposal stage.');
