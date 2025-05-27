import nodemailer from 'nodemailer';

// Debug logging
console.log('Email configuration:', {
  user: process.env.EMAIL_USER,
  hasPassword: !!process.env.EMAIL_PASSWORD
});

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: 'greengoldforfarmers@gmail.com',
    pass: 'ymei mjeq hlwo gmnb'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Function to send OTP email
export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: 'greengoldforfarmers@gmail.com',
    to: email,
    subject: 'Your OTP for DMA3 Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering with DMA3. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Function to send order status update email
export const sendOrderStatusEmail = async (email, subject, message) => {
  const mailOptions = {
    from: 'greengoldforfarmers@gmail.com',
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>${message}</p>
        <p>You can view your order details by logging into your DMA3 account.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

// Function to send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `https://prahalya-28.github.io/dma3/frontend/forgot%20password/verify.html?token=${resetToken}`; // Using your GitHub Pages URL for the verify page
  const mailOptions = {
    from: 'greengoldforfarmers@gmail.com',
    to: email,
    subject: 'Password Reset Request for DMA3',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your DMA3 account. Please click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="display: inline-block; background-color: #28a745; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email to', email, ':', error);
    return false;
  }
};