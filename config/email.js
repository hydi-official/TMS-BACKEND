const nodemailer = require('nodemailer');

// Create transporter with fallback options
const createTransporter = () => {
  // Check if all required environment variables are present
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing email environment variables: ${missingVars.join(', ')}`);
    console.warn('⚠️ Email functionality will be disabled');
    return null;
  }

  try {
    // Fixed: Changed createTransporter to createTransport
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add additional configuration for common email providers
      ...(process.env.EMAIL_HOST.includes('gmail') && {
        service: 'gmail',
        secure: true,
      }),
      // Timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Enhanced send email function
const sendEmail = async (mailOptions) => {
  // Check if email is enabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('📧 Email disabled by environment variable');
    return { messageId: 'disabled', status: 'disabled' };
  }

  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 Email transporter not available, skipping email');
    return { messageId: 'skipped', status: 'skipped' };
  }

  try {
    // Test connection first (optional, but good for debugging)
    if (process.env.NODE_ENV === 'development') {
      await transporter.verify();
      console.log('✅ Email server connection verified');
    }

    // Set default from address if not provided
    const emailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      ...mailOptions,
    };

    const info = await transporter.sendMail(emailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Log additional debug information
    if (process.env.NODE_ENV === 'development') {
      console.error('Email debug info:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });
    }
    
    // Don't throw error in production to avoid breaking the main flow
    if (process.env.NODE_ENV === 'production') {
      return { messageId: 'failed', status: 'failed', error: error.message };
    }
    
    throw error;
  }
};

// Welcome email template
const sendWelcomeEmail = async (userData) => {
  const mailOptions = {
    to: userData.email,
    subject: 'Welcome to Thesis Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Thesis Management System!</h2>
        <p>Hi ${userData.fullName},</p>
        <p>Your ${userData.role} account has been created successfully.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Account Details:</strong><br>
          User ID: ${userData.userId}<br>
          Role: ${userData.role}<br>
          Email: ${userData.email}
        </div>
        <p>You can now log in to the system using your User ID and PIN.</p>
        <p>Best regards,<br>Thesis Management System Team</p>
      </div>
    `,
    text: `Welcome to Thesis Management System!
    
Hi ${userData.fullName},

Your ${userData.role} account has been created successfully.

Account Details:
User ID: ${userData.userId}
Role: ${userData.role}
Email: ${userData.email}

You can now log in to the system using your User ID and PIN.

Best regards,
Thesis Management System Team`
  };

  return await sendEmail(mailOptions);
};

// Password reset email template
const sendPasswordResetEmail = async (user, tempPin) => {
  const mailOptions = {
    to: user.email,
    subject: 'Password Reset - Thesis Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Password Reset Request</h2>
        <p>Hi ${user.fullName},</p>
        <p>You requested a password reset for your account.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <strong>Temporary PIN: ${tempPin}</strong>
        </div>
        <p><strong>Important:</strong> Please change this temporary PIN after logging in.</p>
        <p>If you didn't request this reset, please contact support immediately.</p>
        <p>Best regards,<br>Thesis Management System Team</p>
      </div>
    `,
    text: `Password Reset Request

Hi ${user.fullName},

You requested a password reset for your account.

Temporary PIN: ${tempPin}

Important: Please change this temporary PIN after logging in.

If you didn't request this reset, please contact support immediately.

Best regards,
Thesis Management System Team`
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  createTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};