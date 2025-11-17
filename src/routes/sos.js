const express = require('express');
const { authRequired } = require('../middleware/auth');
const supabase = require('../utils/supabase');
const NodeGeocoder = require('node-geocoder');
const { sendSOSNotificationEmail } = require('../utils/email');

const router = express.Router();

// Initialize geocoder for reverse geocoding
const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// Helper function to notify emergency contacts
async function notifyEmergencyContacts(sosAlertId, userId, location) {
  try {
    // Get all active emergency contacts
    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('is_active', true);
    
    if (!contacts || contacts.length === 0) return;
    
    // Create recipient records
    const recipients = contacts.map(contact => ({
      sos_alert_id: sosAlertId,
      emergency_contact_id: contact.id,
      notification_sent: false
    }));
    
    await supabase
      .from('sos_alert_recipients')
      .insert(recipients);
    
    // Get user info for notifications
    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();
    
    // Send email notifications to emergency contacts
    for (const contact of contacts) {
      if (contact.email) {
        await sendSOSNotificationEmail(
          contact.email,
          contact.name,
          user?.name || 'Employee',
          location,
          sosAlertId
        );
      }
    }
    
    // Create notifications for admin users
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    
    if (adminUsers && adminUsers.length > 0) {
      const adminNotifications = adminUsers.map(admin => ({
        user_id: admin.id,
        sos_alert_id: sosAlertId,
        title: 'SOS Alert Activated',
        message: `An employee has activated an SOS alert. Location: ${location || 'Unknown'}`,
        type: 'sos'
      }));
      
      await supabase
        .from('notifications')
        .insert(adminNotifications);
    }
    
    // TODO: Send actual push notifications/SMS to emergency contacts
    // This would integrate with services like Firebase Cloud Messaging, Twilio, etc.
  } catch (error) {
    console.error('Error notifying emergency contacts:', error);
  }
}

// Start SOS alert
router.post('/start', authRequired, async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    
    // Check if there's already an active SOS
    const { data: activeAlert } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();
    
    if (activeAlert) {
      return res.status(409).json({ error: 'SOS already active' });
    }
    
    // Get user info for location address
    let address = null;
    if (latitude && longitude) {
      try {
        const geoResult = await geocoder.reverse({ lat: latitude, lon: longitude });
        if (geoResult && geoResult.length > 0) {
          address = geoResult[0].formattedAddress;
        }
      } catch (geoError) {
        console.error('Geocoding error:', geoError);
      }
    }
    
    // Create SOS alert
    const { data: sosAlert, error: sosError } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: req.user.id,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address,
        status: 'active'
      })
      .select('*')
      .single();
    
    if (sosError) {
      console.error('SOS creation error:', sosError);
      return res.status(500).json({ error: 'Failed to create SOS alert' });
    }
    
    // Notify emergency contacts
    await notifyEmergencyContacts(sosAlert.id, req.user.id, address || `${latitude}, ${longitude}`);
    
    // Create notification for the user
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        sos_alert_id: sosAlert.id,
        title: 'SOS Activated',
        message: 'Your SOS alert has been activated and emergency contacts have been notified.',
        type: 'sos'
      });
    
    return res.status(201).json({
      id: sosAlert.id,
      userId: sosAlert.user_id,
      status: sosAlert.status,
      location: sosAlert.latitude && sosAlert.longitude ? {
        latitude: parseFloat(sosAlert.latitude),
        longitude: parseFloat(sosAlert.longitude)
      } : null,
      address: sosAlert.address,
      startedAt: sosAlert.started_at
    });
  } catch (error) {
    console.error('Start SOS error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel SOS alert
router.post('/cancel', authRequired, async (req, res) => {
  try {
    const { data: activeAlert, error: fetchError } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !activeAlert) {
      return res.status(404).json({ error: 'No active SOS' });
    }
    
    const { data: updatedAlert, error: updateError } = await supabase
      .from('sos_alerts')
      .update({
        status: 'cancelled',
        resolved_at: new Date().toISOString()
      })
      .eq('id', activeAlert.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Cancel SOS error:', updateError);
      return res.status(500).json({ error: 'Failed to cancel SOS' });
    }
    
    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        sos_alert_id: updatedAlert.id,
        title: 'SOS Cancelled',
        message: 'Your SOS alert has been cancelled.',
        type: 'info'
      });
    
    return res.json({
      id: updatedAlert.id,
      userId: updatedAlert.user_id,
      status: updatedAlert.status,
      location: updatedAlert.latitude && updatedAlert.longitude ? {
        latitude: parseFloat(updatedAlert.latitude),
        longitude: parseFloat(updatedAlert.longitude)
      } : null,
      address: updatedAlert.address,
      startedAt: updatedAlert.started_at,
      resolvedAt: updatedAlert.resolved_at
    });
  } catch (error) {
    console.error('Cancel SOS error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active SOS alert
router.get('/active', authRequired, async (req, res) => {
  try {
    const { data: activeAlert, error } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();
    
    if (error || !activeAlert) {
      return res.json(null);
    }
    
    return res.json({
      id: activeAlert.id,
      userId: activeAlert.user_id,
      status: activeAlert.status,
      location: activeAlert.latitude && activeAlert.longitude ? {
        latitude: parseFloat(activeAlert.latitude),
        longitude: parseFloat(activeAlert.longitude)
      } : null,
      address: activeAlert.address,
      startedAt: activeAlert.started_at
    });
  } catch (error) {
    console.error('Get active SOS error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

