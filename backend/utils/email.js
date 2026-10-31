import nodemailer from 'nodemailer';
import env from '../Config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (env.email.user && env.email.password) {
      transporter = nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.port === 465,
        auth: {
          user: env.email.user,
          pass: env.email.password,
        },
      });
    }
  }
  return transporter;
}

export async function sendVerificationEmail(email, firstName, token) {
  const verificationUrl = `${env.clientUrl}/verify-email?token=${token}`;
  
  // 🔑 LOG THIS SO YOU CAN COPY THE TOKEN FOR POSTMAN TESTING
  console.log(`\n📧 [EMAIL DISPATCH] Verification link for ${email} (${firstName}):`);
  console.log(`🔗 ${verificationUrl}\n`);

  const mailClient = getTransporter();
  if (mailClient) {
    try {
      const info = await mailClient.sendMail({
        from: `Bus Ticketing Platform <${env.email.user}>`,
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">Welcome to Bus Ticketing Platform</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering. Please confirm your email address by clicking the button below:</p>
            <p style="margin: 24px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
          </div>
        `,
      });

      console.log('-------------------------------------------------');
      console.log(`📧 [ETHEREAL] Fake email caught for ${email}`);
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('-------------------------------------------------\n');

    } catch (err) {
      console.error('⚠️ Ethereal SMTP send error:', err.message);
    }
  }
}

export async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  console.log(`\n🔑 [EMAIL DISPATCH] Password reset link for ${email} (${firstName}):`);
  console.log(`🔗 ${resetUrl}\n`);

  const mailClient = getTransporter();
  if (mailClient) {
    try {
      await mailClient.sendMail({
        from: `Bus Ticketing Platform <${env.email.user}>`,
        to: email,
        subject: 'Reset your password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">Password Reset Request</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset the password for your account. Click the button below to choose a new password:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.warn('⚠️ SMTP send error:', err.message);
    }
  }
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
};