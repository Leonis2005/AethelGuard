const rateLimit = require('express-rate-limit');

function createRateLimiter({ windowMs = 60 * 1000, max = 60, message = 'Too many requests.' } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

function logAudit(action, details = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    action,
    ...details,
  };

  console.info('[audit]', JSON.stringify(payload));
}

module.exports = {
  createRateLimiter,
  logAudit,
};
