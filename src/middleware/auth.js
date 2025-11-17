const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const userId = payload.sub;
      
      // Verify user exists in database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = { id: user.id, role: user.role };
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function adminRequired(req, res, next) {
  try {
    await authRequired(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { authRequired, adminRequired };

