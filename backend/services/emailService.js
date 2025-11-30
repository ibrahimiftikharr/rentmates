const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'therentmates@gmail.com',
    pass: 'shhxfnvtxenwnuaw',
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: 'therentmates@gmail.com',
      to: email,
      subject: 'Your RentMates Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8C57FF;">Welcome to RentMates!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4A4A68; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
          </div>
        </div>
      `,
    };

  const info = await transporter.sendMail(mailOptions);
  // Keep logging minimal to avoid flooding the console; include recipient and status
  console.info(`Email sent to ${email}: ${info.response}`);
  return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `http://localhost:5174/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: 'therentmates@gmail.com',
      to: email,
      subject: 'Password Reset Request - RentMates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8C57FF;">Password Reset Request</h2>
          <p>You requested to reset your password for your RentMates account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #8C57FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #EA5455; margin-top: 20px;"><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Best regards,<br>The RentMates Team</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`Password reset email sent to ${email}: ${info.response}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: 'therentmates@gmail.com',
      to,
      subject,
      text,
      html: html || `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">${text}</div>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.info(`Email sent to ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendEmail
};