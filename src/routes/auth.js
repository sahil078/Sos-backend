const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

function issueToken(userId) {
  const payload = { sub: userId };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, employeeId } = req.body || {};
    
    if ((!email && !employeeId) || !password) {
      return res.status(400).json({ error: 'email or employeeId and password are required' });
    }
    
    // Check if user exists by email
    if (email) {
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existingByEmail) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }
    
    // Check if user exists by employee ID
    if (employeeId) {
      const { data: existingByEmp } = await supabase
        .from('users')
        .select('id')
        .eq('employee_id', employeeId)
        .single();
      
      if (existingByEmp) {
        return res.status(409).json({ error: 'Employee ID already registered' });
      }
    }
    
    const hashed = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email ? email.toLowerCase() : null,
        employee_id: employeeId || null,
        name: name || '',
        password_hash: hashed,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expiry: verificationTokenExpiry,
        role: 'employee'
      })
      .select('id, email, employee_id, name, role, created_at')
      .single();
    
    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }
    
    // Send verification email
    if (email) {
      await sendVerificationEmail(email, verificationToken, name);
    }
    
    return res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: !!email,
      user: {
        id: newUser.id,
        email: newUser.email,
        employeeId: newUser.employee_id,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, employeeId, password } = req.body || {};
    
    if ((!email && !employeeId) || !password) {
      return res.status(400).json({ error: 'email or employeeId and password are required' });
    }
    
    let user = null;
    
    // Find user by email or employee ID
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (!error && data) user = data;
    } else if (employeeId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (!error && data) user = data;
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check email verification
    if (user.email && !user.email_verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your email for the verification link.',
        requiresVerification: true
      });
    }
    
    const token = issueToken(user.id);
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        employeeId: user.employee_id, 
        name: user.name,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();
    
    if (fetchError || !user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Check if token is expired
    if (new Date(user.verification_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }
    
    // Mark as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expiry: null
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Verification update error:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }
    
    return res.json({ 
      message: 'Email verified successfully! You can now log in.',
      success: true
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_token_expiry: verificationTokenExpiry
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Resend verification error:', updateError);
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }
    
    await sendVerificationEmail(email, verificationToken, user.name);
    
    return res.json({ 
      message: 'Verification email sent. Please check your email.',
      success: true
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

