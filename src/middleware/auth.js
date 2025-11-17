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
      // First, try to verify as Supabase JWT token
      let userId = null;
      let userRole = 'employee';
      
      try {
        // Verify Supabase JWT token
        const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);
        
        if (!supabaseError && user) {
          userId = user.id;
          
          // Get user from custom users table to get role (match by email from Supabase user)
          const { data: customUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();
          
          if (customUser) {
            userRole = customUser.role || 'employee';
            userId = customUser.id; // Use custom user ID
          } else {
            // If user doesn't exist in custom table, use Supabase user metadata
            userRole = user.user_metadata?.role || 'employee';
          }
        } else {
          throw new Error('Supabase token invalid');
        }
      } catch (supabaseError) {
        // Fallback to custom JWT token verification for backward compatibility
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
          userId = payload.sub;
          
          // Verify user exists in database
          const { data: user, error } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', userId)
            .single();
          
          if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
          }
          
          userRole = user.role;
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      }
      
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      req.user = { id: userId, role: userRole };
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

