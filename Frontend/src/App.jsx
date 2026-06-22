import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STORAGE_KEY = 'titancontrol-token';

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(STORAGE_KEY)));
  const [message, setMessage] = useState('');
  const [registerForm, setRegisterForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    website: '',
    industry: '',
    country: '',
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const loadAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json();
        setUser(data.user);
        await loadDashboard(token);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        setToken('');
        setUser(null);
        setDashboard(null);
        setMessage(error.message || 'Please log in again');
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, [token]);

  const loadDashboard = async (authToken) => {
    const response = await fetch(`${API_BASE}/api/auth/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      throw new Error('Unable to load dashboard');
    }

    const data = await response.json();
    setDashboard(data);
  };

  const saveAuth = (authToken, profile) => {
    localStorage.setItem(STORAGE_KEY, authToken);
    setToken(authToken);
    setUser(profile);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      saveAuth(data.token, data.user);
      await loadDashboard(data.token);
      navigate('/dashboard');
      setMessage('Account created successfully');
    } catch (error) {
      setMessage(error.message || 'Registration failed');
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      saveAuth(data.token, data.user);
      await loadDashboard(data.token);
      navigate('/dashboard');
      setMessage('Welcome back');
    } catch (error) {
      setMessage(error.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken('');
    setUser(null);
    setDashboard(null);
    setMessage('You have been logged out');
    navigate('/');
  };

  const renderLanding = () => {
    const featureCards = [
      {
        icon: '🌐',
        title: 'Domain & Hosting',
        text: 'Track expiration dates, renewal owners, and access status for every critical web asset.',
      },
      {
        icon: '🔐',
        title: 'Secure Access',
        text: 'Keep logins, ownership details, and account responsibility in one safe place.',
      },
      {
        icon: '📧',
        title: 'Email & Social',
        text: 'Monitor business emails, Google Business profiles, and social accounts before problems appear.',
      },
      {
        icon: '🧭',
        title: 'Ownership Check',
        text: 'Know exactly who controls each account and whether your business has full access.',
      },
      {
        icon: '📈',
        title: 'Renewal Alerts',
        text: 'Get reminders for SSL, subscriptions, and annual renewals before they expire.',
      },
      {
        icon: '🛡️',
        title: 'Audit Ready',
        text: 'Store records, ownership notes, and responsibilities for future handovers.',
      },
    ];

    const ownershipItems = [
      { label: 'Domain', status: 'Needs renewal', note: 'Registered under old developer email' },
      { label: 'Hosting', status: 'Valid', note: 'Access available via owner account' },
      { label: 'SSL', status: 'Expires in 12 days', note: 'Auto-renew off' },
      { label: 'Google Business', status: 'Verified', note: 'Owner access confirmed' },
      { label: 'Facebook Page', status: 'Risk detected', note: 'Business owner not full admin' },
    ];

    return (
      <>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <p className="eyebrow">Digital Ownership Platform</p>
            <h1>Know exactly what your business truly owns online.</h1>
            <p className="hero-text">
              TitanControl helps businesses track domains, hosting, subscriptions, social media access, renewals, and ownership status in one secure dashboard.
            </p>
            <div className="hero-actions">
              <Link className="nav-button" to="/dashboard">Open dashboard</Link>
              <a className="ghost-button" href="#ownership">See ownership check</a>
            </div>
            <div className="hero-pill-row">
              <span>Domain control</span>
              <span>Secure logins</span>
              <span>Renewal tracking</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="pulse-ring ring-one" />
            <div className="pulse-ring ring-two" />
            <div className="visual-card main-card animate-float">
              <div className="main-card-top">
                <div>
                  <p className="visual-label">Digital ownership</p>
                  <h2>Secure visibility</h2>
                </div>
                <span className="live-dot">Live</span>
              </div>
              <div className="asset-list">
                <div>
                  <span>✅ Verified</span>
                  <strong>3</strong>
                </div>
                <div>
                  <span>⚠️ Risks</span>
                  <strong>2</strong>
                </div>
              </div>
            </div>
            <div className="visual-card small-card animate-float delay-1">
              <p>SSL status</p>
              <strong>12 days</strong>
            </div>
            <div className="visual-card small-card alt animate-float delay-2">
              <p>Domain expiry</p>
              <strong>27 days</strong>
            </div>
          </div>
        </section>

        <section className="logo-strip">
          <span>Built for modern teams</span>
          <div>
            <strong>Agencies</strong>
            <strong>Startups</strong>
            <strong>Retail</strong>
            <strong>Consultants</strong>
            <strong>Service Brands</strong>
          </div>
        </section>

        <section className="section-block" id="platform">
          <div className="section-heading">
            <p className="eyebrow">Platform</p>
            <h2>One place for every critical business asset</h2>
          </div>
          <div className="service-grid">
            {featureCards.map((card) => (
              <article key={card.title}>
                <div className="feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block ownership-panel" id="ownership">
          <div className="section-heading compact">
            <p className="eyebrow">Ownership check</p>
            <h2>See who really controls your digital presence</h2>
          </div>
          <div className="ownership-grid">
            <div className="ownership-card large">
              <div className="ownership-card-header">
                <span>Risk overview</span>
                <strong>3 alerts</strong>
              </div>
              <div className="risk-meter">
                <span />
              </div>
              <p>
                The dashboard highlights when ownership is unclear, access is limited, or important records are missing.
              </p>
            </div>
            <div className="ownership-card list-card">
              {ownershipItems.map((item) => (
                <div key={item.label} className="ownership-item">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderCreatePage = () => (
    <section className="page-shell">
      <div className="auth-box">
        <p className="eyebrow">Create business account</p>
        <h2>Start protecting your digital ownership</h2>
        <form className="auth-form" onSubmit={handleRegister}>
          <input type="text" placeholder="Business name" value={registerForm.businessName} onChange={(event) => setRegisterForm({ ...registerForm, businessName: event.target.value })} />
          <input type="text" placeholder="Owner full name" value={registerForm.ownerName} onChange={(event) => setRegisterForm({ ...registerForm, ownerName: event.target.value })} />
          <input type="email" placeholder="Business email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
          <input type="tel" placeholder="Phone" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} />
          <input type="text" placeholder="Website" value={registerForm.website} onChange={(event) => setRegisterForm({ ...registerForm, website: event.target.value })} />
          <input type="password" placeholder="Password (10+ chars)" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
          <input type="password" placeholder="Confirm password" value={registerForm.confirmPassword} onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })} />
          <button type="submit">Create account</button>
        </form>
        <p className="auth-link-text">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </section>
  );

  const renderLoginPage = () => (
    <section className="page-shell">
      <div className="auth-box">
        <p className="eyebrow">Existing business</p>
        <h2>Log in to your dashboard</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
          <button type="submit">Login</button>
        </form>
        <p className="auth-link-text">Need a business account? <Link to="/create">Create one</Link></p>
      </div>
    </section>
  );

  const renderDashboardPage = () => {
    const metrics = dashboard?.metrics || {};
    const assets = dashboard?.assets || [];

    return (
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Business dashboard</p>
            <h1>{dashboard?.business?.business_name || 'Your business'}</h1>
          </div>
          <button className="ghost-button" onClick={handleLogout}>Logout</button>
        </header>

        <div className="dashboard-grid">
          <div className="dashboard-card highlight-card">
            <p>Owner</p>
            <h2>{dashboard?.business?.owner_name || user?.fullName || 'Business owner'}</h2>
            <span>{dashboard?.business?.business_email || user?.email}</span>
          </div>
          <div className="dashboard-card">
            <p>Assets tracked</p>
            <h3>{metrics.assets || assets.length}</h3>
          </div>
          <div className="dashboard-card">
            <p>Renewals due</p>
            <h3>{metrics.renewalsDue || 0}</h3>
          </div>
          <div className="dashboard-card">
            <p>Risk alerts</p>
            <h3>{metrics.riskAlerts || 0}</h3>
          </div>
        </div>

        <div className="dashboard-panels">
          <div className="dashboard-panel large-panel">
            <div className="panel-title-row">
              <h3>Digital Ownership Check</h3>
              <span>{metrics.riskAlerts || 0} alerts</span>
            </div>
            <div className="risk-meter">
              <span />
            </div>
            <div className="ownership-list">
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <div key={asset.id}>
                    <strong>{asset.asset_name || asset.asset_type}</strong>
                    <p>{asset.note || asset.account_name || 'Tracked asset'}</p>
                  </div>
                ))
              ) : (
                <div>
                  <strong>No assets added yet</strong>
                  <p>Add your first domain, hosting, social, or subscription entry.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <h3>Business details</h3>
            <ul>
              <li><span>Website</span><strong>{dashboard?.business?.website || 'Not added yet'}</strong></li>
              <li><span>Industry</span><strong>{dashboard?.business?.industry || 'Not listed'}</strong></li>
              <li><span>Country</span><strong>{dashboard?.business?.country || 'Not listed'}</strong></li>
            </ul>
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="landing-page">
      <header className="top-nav">
        <Link className="brand" to="/">
          <span className="brand-mark">A</span>
          <span>TitanControl</span>
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/create">Create</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
        {user ? (
          <button className="nav-button" onClick={handleLogout}>Logout</button>
        ) : (
          <Link className="nav-button" to="/create">Create account</Link>
        )}
      </header>

      {message && <p className="state-text">{message}</p>}
      {loading ? (
        <p className="state-text">Loading your workspace...</p>
      ) : (
        <Routes>
          <Route path="/" element={renderLanding()} />
          <Route path="/create" element={renderCreatePage()} />
          <Route path="/login" element={renderLoginPage()} />
          <Route path="/dashboard" element={user ? renderDashboardPage() : <Navigate to="/login" replace />} />
        </Routes>
      )}

      <footer className="footer">
        <div>
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">A</span>
            <span>TitanControl</span>
          </Link>
        </div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/create">Create</Link>
          <Link to="/login">Login</Link>
        </div>
      </footer>
      <p className="footer-note">Titan Team Company · Developer Leonis</p>
    </main>
  );
}

export default App;
