const express = require('express');
const { authRequired } = require('../middleware/auth');
const supabase = require('../utils/supabase');

const router = express.Router();

// Get all notifications for user
router.get('/', authRequired, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    
    return res.json(notifications || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.post('/:id/read', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('*')
      .single();
    
    if (error || !notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    return res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

