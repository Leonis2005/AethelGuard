# Digital Asset Ownership Platform

An open-source SaaS platform that helps small businesses organize, track, and control their important digital business assets in one private dashboard.

Many businesses have their domains, hosting, emails, social media pages, Google Business profiles, software subscriptions, passwords, and renewal dates scattered across WhatsApp, emails, old notes, agencies, developers, or ex-employees.

This platform solves that problem by giving each business a central place to manage digital ownership, access, renewals, and security status.

---

## Main Idea

The platform allows a business to create its own private profile and manage all important digital assets in one place.

Each business can track:

* Domain expiry
* Hosting expiry
* SSL certificate expiry
* Website status
* Business email accounts
* Google Business Profile access
* Facebook, Instagram, and other social media accounts
* Software subscriptions
* Renewal dates
* Important login records
* Account ownership
* Whether the business has full access or not

The main unique feature is the **Digital Ownership Check**.

This helps the business understand whether it truly owns its digital assets or if something is still controlled by an old developer, ex-employee, agency, freelancer, or unknown email address.

---

## Example Ownership Checks

The system can show problems like:

```txt
Facebook Page: Business owner is not full admin
Domain: Registered under old developer email
Google Business Profile: Owner access confirmed
Hosting: Renewal date missing
SSL Certificate: Expires in 12 days
Email Account: Unknown admin access
Software Subscription: Payment owner not confirmed
```

This gives businesses a clear view of what they own, what is risky, and what needs to be fixed.

---

## Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Vite
* React Router
* Axios or TanStack Query
* Zustand or Context API for state management

### Backend

* Node.js
* Express.js
* TypeScript
* MySQL
* JWT authentication
* Bcrypt password hashing
* Environment-based configuration

### Database

* MySQL
* Relational structure for users, businesses, assets, renewals, ownership checks, and secure login records

---

## Core Features

### 1. Business Profiles

Each company can create a private business profile.

A business profile can include:

* Business name
* Logo
* Contact email
* Phone number
* Website
* Industry
* Address
* Owner/admin users
* Staff users

Each business has its own isolated data so users can only see assets connected to their own business.

---

### 2. Digital Asset Management

Businesses can add and manage different digital assets, such as:

* Domains
* Hosting accounts
* SSL certificates
* Websites
* Business emails
* Google Business Profile
* Facebook pages
* Instagram accounts
* TikTok accounts
* LinkedIn pages
* Software subscriptions
* Payment accounts
* Important internal tools

Each asset can store:

* Asset name
* Asset type
* Provider
* Login URL
* Owner email
* Renewal date
* Expiry date
* Status
* Notes
* Access level
* Responsible person

---

### 3. Digital Ownership Check

The Digital Ownership Check is the main feature of the platform.

It checks whether the business really controls each asset.

Example ownership statuses:

* Full ownership confirmed
* Partial access only
* Missing admin access
* Controlled by old developer
* Controlled by agency
* Controlled by ex-employee
* Unknown owner
* Renewal information missing
* Payment owner unknown

Each asset receives a clear ownership status so the business knows what needs attention.

---

### 4. Renewal Tracking

The platform tracks renewal and expiry dates for important services.

Examples:

* Domain expires in 30 days
* Hosting expires in 15 days
* SSL expires in 7 days
* Subscription renews next month
* Google Workspace payment date missing

Renewals can have statuses such as:

* Active
* Expiring soon
* Expired
* Missing date
* Needs review

---

### 5. Website Status Monitoring

Businesses can track basic website health.

Website checks can include:

* Website online/offline
* HTTP status code
* SSL validity
* Response time
* Last checked date

Example:

```txt
Website: Online
Status Code: 200
SSL: Valid
Response Time: 340ms
Last Checked: 2026-06-22
```

---

### 6. Secure Login Records

The platform can store important login information securely.

Important: passwords should never be stored as plain text.

Recommended approach:

* Encrypt sensitive login records before saving them
* Use a strong encryption key from environment variables
* Never expose passwords in API responses unless specifically requested and authorized
* Log access events when a secure login is viewed
* Allow businesses to store notes without revealing sensitive fields

Login records can include:

* Service name
* Login URL
* Username or email
* Encrypted password
* Recovery email
* 2FA status
* Owner
* Notes

---

### 7. User Roles

The platform should support role-based access.

Example roles:

#### Owner

* Full access to business profile
* Manage users
* View and edit all assets
* View secure login records
* Manage billing and settings

#### Admin

* Manage most assets
* Add and edit renewals
* View ownership checks
* Manage website status

#### Staff

* View assigned assets
* Add notes
* Cannot view secure passwords unless allowed

---

## Suggested Database Tables

### users

Stores platform users.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### businesses

Stores business profiles.

```sql
CREATE TABLE businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  website VARCHAR(255),
  contact_email VARCHAR(190),
  phone VARCHAR(50),
  industry VARCHAR(120),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### business_users

Connects users to businesses.

```sql
CREATE TABLE business_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### assets

Stores digital assets.

```sql
CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  type ENUM(
    'domain',
    'hosting',
    'ssl',
    'website',
    'email',
    'google_business',
    'facebook',
    'instagram',
    'software',
    'subscription',
    'other'
  ) NOT NULL,
  provider VARCHAR(160),
  login_url VARCHAR(255),
  owner_email VARCHAR(190),
  access_level VARCHAR(120),
  status ENUM('active', 'needs_review', 'expired', 'unknown') DEFAULT 'active',
  renewal_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```

### ownership_checks

Stores digital ownership results.

```sql
CREATE TABLE ownership_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  ownership_status ENUM(
    'confirmed',
    'partial_access',
    'missing_admin',
    'old_developer',
    'agency_controlled',
    'ex_employee',
    'unknown',
    'needs_review'
  ) DEFAULT 'needs_review',
  issue_description TEXT,
  recommended_action TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

### secure_logins

Stores encrypted login records.

```sql
CREATE TABLE secure_logins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  asset_id INT,
  service_name VARCHAR(160) NOT NULL,
  login_url VARCHAR(255),
  username VARCHAR(190),
  encrypted_password TEXT,
  recovery_email VARCHAR(190),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

---

## Project Structure

```txt
digital-asset-platform/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── database/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── schema.sql
│
├── .env.example
├── README.md
└── LICENSE
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

Do not commit the real `.env` file to GitHub.

Use `.env.example` as the public template.

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=digital_asset_platform

JWT_SECRET=replace_with_a_long_random_secret
ENCRYPTION_KEY=replace_with_32_character_key

FRONTEND_URL=http://localhost:5173
```

---

## Backend Setup

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The backend should run on:

```txt
http://localhost:5000
```

---

## Frontend Setup

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

The frontend should run on:

```txt
http://localhost:5173
```

---

## MySQL Setup

Create the database:

```sql
CREATE DATABASE digital_asset_platform;
```

Import the schema:

```bash
mysql -u root -p digital_asset_platform < database/schema.sql
```

Or import `schema.sql` manually using phpMyAdmin.

---

## Main Pages

### Public Pages

* Landing page
* Login
* Register
* Forgot password

### Dashboard Pages

* Dashboard overview
* Business profile
* Digital assets
* Add/edit asset
* Ownership check
* Renewals
* Website status
* Secure logins
* Users and roles
* Settings

---

## Dashboard Overview

The dashboard should show a simple summary of the business digital health.

Example cards:

```txt
Total Assets: 24
Expiring Soon: 3
Ownership Issues: 5
Missing Renewal Dates: 4
Websites Online: 2 / 2
Secure Logins Stored: 12
```

The dashboard should also show warnings such as:

```txt
SSL certificate expires in 12 days
Domain ownership is not confirmed
Facebook page admin access is missing
Hosting renewal date is missing
```

---

## API Routes

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Businesses

```txt
GET    /api/businesses
POST   /api/businesses
GET    /api/businesses/:id
PUT    /api/businesses/:id
DELETE /api/businesses/:id
```

### Assets

```txt
GET    /api/assets
POST   /api/assets
GET    /api/assets/:id
PUT    /api/assets/:id
DELETE /api/assets/:id
```

### Ownership Checks

```txt
GET  /api/ownership-checks
POST /api/ownership-checks
PUT  /api/ownership-checks/:id
```

### Renewals

```txt
GET /api/renewals
GET /api/renewals/expiring-soon
```

### Website Status

```txt
POST /api/website-status/check
GET  /api/website-status/:assetId
```

### Secure Logins

```txt
GET    /api/secure-logins
POST   /api/secure-logins
GET    /api/secure-logins/:id
PUT    /api/secure-logins/:id
DELETE /api/secure-logins/:id
```

---

## Security Requirements

This project handles sensitive business information, so security is important.

Required security rules:

* Never commit `.env` files
* Never store passwords in plain text
* Hash user passwords using bcrypt
* Encrypt stored login passwords
* Use JWT or secure sessions for authentication
* Add role-based access control
* Prevent users from accessing another business profile
* Validate all API inputs
* Use rate limiting on login routes
* Use CORS only for trusted frontend URLs
* Use HTTPS in production
* Hide sensitive data from frontend responses
* Add audit logs for viewing secure login records

---

## Recommended NPM Packages

### Backend

```bash
npm install express mysql2 dotenv cors bcrypt jsonwebtoken zod helmet express-rate-limit
npm install -D typescript ts-node-dev @types/node @types/express @types/bcrypt @types/jsonwebtoken
```

### Frontend

```bash
npm install react-router-dom axios lucide-react
npm install -D tailwindcss postcss autoprefixer
```

---

## Frontend Design Direction

The UI should be clean, professional, and simple.

Design style:

* SaaS dashboard layout
* Sidebar navigation
* Mobile responsive
* Clean cards
* Clear warning states
* Not too much white space
* Soft background
* Professional colors
* Simple tables
* Clear status badges

Suggested dashboard sections:

* Overview cards
* Expiring soon list
* Ownership problems list
* Digital assets table
* Recent activity
* Quick add asset button

---

## Status Badge Examples

```txt
Confirmed
Needs Review
Missing Access
Expiring Soon
Expired
Unknown Owner
Full Admin
Partial Access
```

---

## Open-Source Goal

This project is intended to be open-source so other developers and businesses can use, improve, and self-host it.

The goal is not only to track assets, but also to help businesses understand digital ownership.

A business should know:

* Who owns the domain
* Who controls hosting
* Who has admin access
* Who pays for subscriptions
* When renewals happen
* Which accounts are risky
* Which assets need action

---

## Future Features

Possible future improvements:

* Email reminders before expiry
* Automatic SSL expiry scanner
* Domain WHOIS lookup
* Website uptime monitoring
* Google Business API integration
* Social media ownership checklist
* Secure password vault improvements
* Audit logs
* File attachments
* Client portal
* Multi-business support
* Export reports as PDF
* CSV export
* Notification system
* Dark mode

---

## License

This project can be released under the MIT License.

```txt
MIT License
```

---

## Summary

This platform helps businesses organize and protect their digital assets.

Instead of having important access scattered across WhatsApp, emails, agencies, old developers, or random notes, the business gets one private dashboard where everything is visible, tracked, and reviewed.

The most important feature is the Digital Ownership Check, which helps businesses find out if they truly own and control their digital presence.
