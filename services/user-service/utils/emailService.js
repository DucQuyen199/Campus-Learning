/*-----------------------------------------------------------------
* File: emailService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const nodemailer = require('nodemailer');

/*
 * LƯU Ý VỀ GMAIL:
 * Gmail không cho phép ứng dụng đăng nhập với mật khẩu thông thường.
 * Bạn cần tạo "App Password" bằng cách:
 * 1. Truy cập https://myaccount.google.com/security
 * 2. Bật xác thực 2 bước
 * 3. Tạo App Password từ tùy chọn "App passwords"
 * 4. Sử dụng password được cấp (16 ký tự) làm mật khẩu trong cấu hình dưới đây
 */

// Create a transporter object with Gmail credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for SSL, false for TLS
  auth: {
    user: 'deobietbg68@gmail.com',
    pass: 'knyt vnqu dkpc dorl'
  }
});

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP
 * @returns {string} OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

/**
 * Send an email verification OTP
 * @param {string} to - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} otp - OTP code
 * @param {string} type - Type of email (email_verification or password_reset)
 * @returns {Promise} Promise object
 */
const sendVerificationEmail = async (to, fullName, otp, type = 'email_verification') => {
  let subject, htmlContent;
  
  if (type === 'password_reset') {
    subject = 'Đặt lại mật khẩu của bạn';
    htmlContent = `
      <p>Xin chào ${fullName},</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CampusLearning của bạn. Vui lòng sử dụng mã xác thực sau:</p>
      <div style="margin: 20px 0; text-align: center;">
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">${otp}</div>
      </div>
      <p>Mã xác thực có hiệu lực trong 15 phút.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và kiểm tra tài khoản của bạn.</p>
    `;
  } else {
    subject = 'Xác thực email của bạn';
    htmlContent = `
      <p>Xin chào ${fullName},</p>
      <p>Bạn đang yêu cầu xác thực tài khoản tại CampusLearning. Để hoàn tất quá trình xác thực, vui lòng nhập mã xác thực sau:</p>
      <div style="margin: 20px 0; text-align: center;">
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">${otp}</div>
      </div>
      <p>Mã xác thực có hiệu lực trong 15 phút.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
    `;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb;">CampusLearning</h2>
      </div>
      <div>
        ${htmlContent}
        <p>Trân trọng,<br/>Đội ngũ CampusLearning</p>
      </div>
    </div>
  `;
  
  try {
    // Hiển thị mã OTP trong console cho việc test
    console.log(`Gửi mã OTP cho ${to}: ${otp} (Loại: ${type})`);
    
    return await transporter.sendMail({
      from: `"CampusLearning" <devquyen@gmail.com>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Lỗi gửi email:', error.message);
    
    // Hiển thị mã OTP trong console cho việc test khi không gửi được email
    console.log(`[CHỈ CHO DEV] Mã OTP cho ${to}: ${otp} (Loại: ${type})`);
    
    // Vẫn trả về thành công để xác thực hoạt động
    return { messageId: 'dev-mode', otp };
  }
};

// Send general email with optional attachments (e.g., exported user data)
const sendEmailWithAttachment = async ({ to, subject, text, attachments = [], from }) => {
  try {
    return await transporter.sendMail({
      from: from || 'CampusLearning <devquyen@gmail.com>',
      to,
      subject,
      text,
      attachments
    });
  } catch (error) {
    console.error('Lỗi gửi email đính kèm:', error.message);
    throw error;
  }
};

const sendLoginOtpEmail = async (to, fullName, otp) => {
  const subject = 'Mã OTP đăng nhập vào tài khoản CampusLearning của bạn';
  const html = `
    <p>Xin chào ${fullName},</p>
    <p>Bạn đang yêu cầu đăng nhập không cần mật khẩu cho tài khoản CampusLearning. Mã OTP của bạn là:</p>
    <div style="margin: 20px 0; text-align: center;">
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">${otp}</div>
    </div>
    <p>Mã OTP có hiệu lực trong 15 phút.</p>
    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
    <p>Trân trọng,<br/>Đội ngũ CampusLearning</p>
  `;
  // Hiển thị mã OTP trong console cho việc test
  console.log(`Gửi OTP đăng nhập cho ${to}: ${otp}`);
  return await transporter.sendMail({
    from: '"CampusLearning" <devquyen@gmail.com>',
    to,
    subject,
    html
  });
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendEmailWithAttachment,
  sendLoginOtpEmail
};
