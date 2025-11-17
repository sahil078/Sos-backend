const express = require('express');
const { adminRequired } = require('../middleware/auth');
const supabase = require('../utils/supabase');

const router = express.Router();

// Get all users (employees)
router.get('/users', adminRequired, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, employee_id, name, role, email_verified, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    return res.json(users || []);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, employee_id, name, role, email_verified, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/users/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, employeeId, role, emailVerified } = req.body || {};
    
    // Validate role if provided
    if (role !== undefined && !['employee', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "employee" or "admin"' });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (employeeId !== undefined) updateData.employee_id = employeeId;
    if (role !== undefined) updateData.role = role;
    if (emailVerified !== undefined) updateData.email_verified = emailVerified;
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, employee_id, name, role, email_verified, created_at, updated_at')
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all SOS alerts
router.get('/sos-alerts', adminRequired, async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    let query = supabase
      .from('sos_alerts')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          employee_id
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: alerts, error } = await query;
    
    if (error) {
      console.error('Get SOS alerts error:', error);
      return res.status(500).json({ error: 'Failed to fetch SOS alerts' });
    }
    
    return res.json(alerts || []);
  } catch (error) {
    console.error('Get SOS alerts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get SOS alert by ID
router.get('/sos-alerts/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: alert, error } = await supabase
      .from('sos_alerts')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          employee_id
        ),
        sos_alert_recipients (
          id,
          emergency_contacts (
            id,
            name,
            email,
            phone,
            role
          ),
          notified_at,
          notification_sent
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !alert) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }
    
    return res.json(alert);
  } catch (error) {
    console.error('Get SOS alert error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve SOS alert
router.post('/sos-alerts/:id/resolve', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: alert, error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error || !alert) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }
    
    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: alert.user_id,
        sos_alert_id: alert.id,
        title: 'SOS Alert Resolved',
        message: 'Your SOS alert has been resolved by an administrator.',
        type: 'info'
      });
    
    return res.json(alert);
  } catch (error) {
    console.error('Resolve SOS alert error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all emergency contacts
router.get('/emergency-contacts', adminRequired, async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get emergency contacts error:', error);
      return res.status(500).json({ error: 'Failed to fetch emergency contacts' });
    }
    
    return res.json(contacts || []);
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create emergency contact
router.post('/emergency-contacts', adminRequired, async (req, res) => {
  try {
    const { name, email, phone, role } = req.body || {};
    
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }
    
    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        role,
        is_active: true
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Create emergency contact error:', error);
      return res.status(500).json({ error: 'Failed to create emergency contact' });
    }
    
    return res.status(201).json(contact);
  } catch (error) {
    console.error('Create emergency contact error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update emergency contact
router.put('/emergency-contacts/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive } = req.body || {};
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;
    
    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error || !contact) {
      return res.status(404).json({ error: 'Emergency contact not found' });
    }
    
    return res.json(contact);
  } catch (error) {
    console.error('Update emergency contact error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete emergency contact
router.delete('/emergency-contacts/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete emergency contact error:', error);
      return res.status(500).json({ error: 'Failed to delete emergency contact' });
    }
    
    return res.json({ message: 'Emergency contact deleted successfully' });
  } catch (error) {
    console.error('Delete emergency contact error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics
router.get('/stats', adminRequired, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get active SOS alerts
    const { count: activeSOS } = await supabase
      .from('sos_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // Get total SOS alerts
    const { count: totalSOS } = await supabase
      .from('sos_alerts')
      .select('*', { count: 'exact', head: true });
    
    // Get emergency contacts count
    const { count: emergencyContacts } = await supabase
      .from('emergency_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Get recent SOS alerts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentSOS } = await supabase
      .from('sos_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    
    return res.json({
      totalUsers: totalUsers || 0,
      activeSOS: activeSOS || 0,
      totalSOS: totalSOS || 0,
      emergencyContacts: emergencyContacts || 0,
      recentSOS: recentSOS || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

