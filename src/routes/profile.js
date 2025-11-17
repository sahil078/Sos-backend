const express = require('express');
const { authRequired } = require('../middleware/auth');
const supabase = require('../utils/supabase');

const router = express.Router();

// Get user's emergency contacts
router.get('/emergency-contacts', authRequired, async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('user_emergency_contacts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_primary', { ascending: false })
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

// Create user's emergency contact
router.post('/emergency-contacts', authRequired, async (req, res) => {
  try {
    const { name, email, phone, relationship, isPrimary } = req.body || {};
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await supabase
        .from('user_emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', req.user.id);
    }
    
    const { data: contact, error } = await supabase
      .from('user_emergency_contacts')
      .insert({
        user_id: req.user.id,
        name,
        email: email || null,
        phone: phone || null,
        relationship: relationship || null,
        is_primary: isPrimary || false
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

// Update user's emergency contact
router.put('/emergency-contacts/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, relationship, isPrimary } = req.body || {};
    
    // Verify contact belongs to user
    const { data: existingContact } = await supabase
      .from('user_emergency_contacts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingContact || existingContact.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Emergency contact not found' });
    }
    
    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await supabase
        .from('user_emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', req.user.id)
        .neq('id', id);
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (isPrimary !== undefined) updateData.is_primary = isPrimary;
    
    const { data: contact, error } = await supabase
      .from('user_emergency_contacts')
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

// Delete user's emergency contact
router.delete('/emergency-contacts/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify contact belongs to user
    const { data: existingContact } = await supabase
      .from('user_emergency_contacts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (!existingContact || existingContact.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Emergency contact not found' });
    }
    
    const { error } = await supabase
      .from('user_emergency_contacts')
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

// Get user profile
router.get('/', authRequired, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, employee_id, name, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      id: user.id,
      email: user.email,
      employeeId: user.employee_id,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/', authRequired, async (req, res) => {
  try {
    const { name } = req.body || {};
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, email, employee_id, name, role, created_at, updated_at')
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      id: user.id,
      email: user.email,
      employeeId: user.employee_id,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

