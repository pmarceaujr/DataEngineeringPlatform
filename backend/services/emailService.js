/**
 * Email Service
 * Handles sending emails via SendGrid
 */

const sgMail = require('@sendgrid/mail');
const config = require('../config/environment');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
sgMail.setApiKey(config.sendgrid.apiKey);

/**
 * Send verification email
 */
exports.sendVerificationEmail = async (toEmail, userId) => {
  const verifyUrl = `${config.frontendUrl}/verify-email?userId=${userId}`;
  console.log("verifyUrl")
  console.log(verifyUrl)
  console.log("API Key")
  console.log(config.sendgrid.apiKey)
  
  const msg = {
    to: toEmail,
    from: config.sendgrid.fromEmail,
    subject: 'Verify Your Email - Data Engineering Platform',
    text: `Please verify your email by clicking: ${verifyUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Data Engineering Platform!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy this link: ${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `
  };
   console.log(msg)
  try {
    await sgMail.send(msg);
    console.log('✅ Verification email sent to:', toEmail);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const msg = {
    to: toEmail,
    from: config.sendgrid.fromEmail,
    subject: 'Reset Your Password - Data Engineering Platform',
    text: `Reset your password by clicking: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };
  
  
  try {
    await sgMail.send(msg);
    console.log('✅ Password reset email sent to:', toEmail);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send pipeline execution notification
 */
exports.sendPipelineNotification = async (toEmail, pipelineName, status, details) => {
  const statusColor = status === 'completed' ? '#28a745' : '#dc3545';
  const statusText = status === 'completed' ? 'Completed Successfully' : 'Failed';
  
  const msg = {
    to: toEmail,
    from: config.sendgrid.fromEmail,
    subject: `Pipeline ${statusText}: ${pipelineName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Pipeline Execution ${statusText}</h2>
        <p><strong>Pipeline:</strong> ${pipelineName}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
        <p><strong>Details:</strong></p>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
${JSON.stringify(details, null, 2)}
        </pre>
        <p>View full details in your dashboard.</p>
      </div>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log('✅ Pipeline notification sent to:', toEmail);
  } catch (error) {
    console.error('❌ Error sending pipeline notification:', error);
  }
};