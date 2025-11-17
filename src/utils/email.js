// Email utility for sending verification emails
// In development, this logs to console. In production, configure with a real email service.

async function sendVerificationEmail(email, token, name) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
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
  
  // In production, integrate with email service (SendGrid, AWS SES, Nodemailer, etc.)
  // Example with Nodemailer:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    // Configure your email service
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your Employee SOS Account',
    html: `...`
  });
  */
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

