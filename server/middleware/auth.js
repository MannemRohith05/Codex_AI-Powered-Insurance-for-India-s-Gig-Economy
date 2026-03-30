const { verifyToken } = require('../utils/jwt');

const createAuthMiddleware = (role) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware that accepts any authenticated user
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  requireWorker: createAuthMiddleware('worker'),
  requireAdmin: createAuthMiddleware('admin'),
  requirePlatform: createAuthMiddleware('platform'),
  requireAuth,
};
