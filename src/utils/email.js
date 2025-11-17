// Email utility for sending verification emails using Supabase
const supabase = require('./supabase');

async function sendVerificationEmail(email, token, name) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  try {
    // Check if we have service role key (required for admin operations)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Falling back to console logging.');
      console.log('\n========================================');
      console.log('📧 EMAIL VERIFICATION');
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Subject: Verify your Employee SOS Account`);
      console.log(`\nHello ${name || 'User'},`);
      console.log(`\nPlease verify your email address by clicking the link below:`);
      console.log(`\n${verificationUrl}`);
      console.log(`\nThis link will expire in 24 hours.`);
      console.log('========================================\n');
      return;
    }

    // Use Supabase Auth Admin API to send verification email
    // Method 1: Try using inviteUserByEmail which automatically sends an email
    // This uses Supabase's built-in email service
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name || 'User',
        verification_token: token // Store our custom token in user metadata
      },
      redirectTo: verificationUrl
    });

    if (inviteError) {
      // If invite fails (e.g., user already exists in Supabase Auth), try OTP method
      console.warn('⚠️  inviteUserByEmail failed, trying OTP method:', inviteError.message);
      
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Method 2: Use OTP endpoint to send verification email
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({
            email: email,
            type: 'signup',
            data: {
              name: name || 'User',
              verification_token: token,
              verification_url: verificationUrl
            },
            options: {
              emailRedirectTo: verificationUrl
            }
          })
        });

        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          console.log(`✅ Verification email sent to ${email} via Supabase OTP`);
          return;
        } else {
          console.warn('⚠️  Supabase OTP failed:', responseData);
          throw new Error(responseData.error || 'OTP email failed');
        }
      } catch (otpError) {
        console.error('❌ Supabase OTP email failed:', otpError.message);
        // Fallback to console logging
        console.log('\n========================================');
        console.log('📧 EMAIL VERIFICATION (FALLBACK)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`Subject: Verify your Employee SOS Account`);
        console.log(`\nHello ${name || 'User'},`);
        console.log(`\nPlease verify your email address by clicking the link below:`);
        console.log(`\n${verificationUrl}`);
        console.log(`\nThis link will expire in 24 hours.`);
        console.log('========================================\n');
        return;
      }
    }

    // Success - email sent via inviteUserByEmail
    console.log(`✅ Verification email sent to ${email} via Supabase`);
    
    // Note: inviteUserByEmail creates a user in Supabase Auth
    // You may want to configure Supabase email templates to customize the email content
    // or handle the Supabase Auth user separately from your custom users table
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    // Fallback to console logging
    console.log('\n========================================');
    console.log('📧 EMAIL VERIFICATION (ERROR FALLBACK)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your Employee SOS Account`);
    console.log(`\nHello ${name || 'User'},`);
    console.log(`\nPlease verify your email address by clicking the link below:`);
    console.log(`\n${verificationUrl}`);
    console.log(`\nThis link will expire in 24 hours.`);
    console.log('========================================\n');
  }
}

async function sendSOSNotificationEmail(contactEmail, contactName, userName, location, alertId) {
  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========================================');
    console.log('🚨 SOS ALERT NOTIFICATION');
    console.log('========================================');
    console.log(`To: ${contactEmail} (${contactName})`);
    console.log(`Subject: URGENT: SOS Alert from ${userName}`);
    console.log(`\nAn employee has activated an SOS alert:`);
    console.log(`\nEmployee: ${userName}`);
    console.log(`Location: ${location || 'Unknown'}`);
    console.log(`Alert ID: ${alertId}`);
    console.log(`\nPlease respond immediately!`);
    console.log('========================================\n');
    return;
  }
  
  // In production, send actual email
}

module.exports = { sendVerificationEmail, sendSOSNotificationEmail };

