const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { Authorization: authHeader },
      timeout: 5000
    });

    req.user = response.data.user;
    next();
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({ error: err.response.data.error || 'Authentication failed' });
    }
    console.error('[Auth Verify Error]', err.message);
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
};

module.exports = { verifyToken };
