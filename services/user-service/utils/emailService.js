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
// Create a transporter object with Gmail credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for SSL, false for TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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

/**
 * Send account unlock email with verification link
 * @param {string} to - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} unlockUrl - Account unlock URL
 * @param {string} ipAddress - IP address that triggered the lock
 * @param {number} lockDuration - Lock duration in minutes
 * @returns {Promise} Promise object
 */
const sendAccountUnlockEmail = async (to, fullName, unlockUrl, ipAddress, lockDuration) => {
  const subject = '🔒 Tài khoản CampusLearning của bạn đã bị khóa tạm thời';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #dc2626;">🔒 CampusLearning</h2>
      </div>
      <div>
        <p>Xin chào ${fullName},</p>
        <p><strong>Tài khoản CampusLearning của bạn đã bị khóa tạm thời</strong> do có quá nhiều lần đăng nhập thất bại từ địa chỉ IP: <code>${ipAddress}</code></p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Thông tin khóa tài khoản:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Thời gian khóa: ${lockDuration} phút</li>
            <li>Lý do: Nhiều lần đăng nhập thất bại</li>
            <li>IP Address: ${ipAddress}</li>
          </ul>
        </div>

        <p><strong>Để mở khóa tài khoản ngay lập tức, bạn cần:</strong></p>
        <ol>
          <li>Xác thực qua email bằng cách nhấp vào nút bên dưới</li>
          <li>Xác thực bằng mã 2FA (nếu đã bật)</li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${unlockUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            🔓 Mở khóa tài khoản
          </a>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Lưu ý bảo mật:</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>Liên kết này có hiệu lực trong 24 giờ</li>
            <li>Chỉ sử dụng liên kết này nếu bạn chắc chắn rằng mình đã cố gắng đăng nhập</li>
            <li>Nếu bạn không thực hiện hành động này, vui lòng đổi mật khẩu ngay lập tức</li>
          </ul>
        </div>

        <p>Hoặc bạn có thể chờ <strong>${lockDuration} phút</strong> để tài khoản tự động được mở khóa.</p>
        
        <p><strong>Nếu bạn không phải là người thực hiện các lần đăng nhập này:</strong></p>
        <ul>
          <li>Vui lòng đổi mật khẩu ngay lập tức</li>
          <li>Liên hệ với đội hỗ trợ của chúng tôi</li>
          <li>Kiểm tra các thiết bị đã đăng nhập vào tài khoản</li>
        </ul>

        <p>Trân trọng,<br/>Đội ngũ Bảo mật CampusLearning</p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #6b7280;">
        <p>Email này được gửi tự động từ hệ thống bảo mật CampusLearning. Vui lòng không trả lời email này.</p>
      </div>
    </div>
  `;
  
  try {
    console.log(`Gửi email mở khóa tài khoản cho ${to} từ IP: ${ipAddress}`);
    
    return await transporter.sendMail({
      from: `"CampusLearning Security" <security@campuslearning.com>`,
      to,
      subject,
      html,
      priority: 'high'
    });
  } catch (error) {
    console.error('Lỗi gửi email mở khóa tài khoản:', error.message);
    
    // Hiển thị URL mở khóa trong console cho việc test
    console.log(`[CHỈ CHO DEV] URL mở khóa cho ${to}: ${unlockUrl}`);
    
    return { messageId: 'dev-mode', unlockUrl };
  }
};

/**
 * Send account unlocked confirmation email
 * @param {string} to - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} ipAddress - IP address used for unlock
 * @returns {Promise} Promise object
 */
const sendAccountUnlockedEmail = async (to, fullName, ipAddress) => {
  const subject = '✅ Tài khoản CampusLearning đã được mở khóa thành công';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669;">✅ CampusLearning</h2>
      </div>
      <div>
        <p>Xin chào ${fullName},</p>
        <p><strong>Tài khoản CampusLearning của bạn đã được mở khóa thành công!</strong></p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Thông tin mở khóa:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
            <li>IP Address: ${ipAddress}</li>
            <li>Phương thức: Email + 2FA verification</li>
          </ul>
        </div>

        <p>Bạn có thể đăng nhập vào tài khoản của mình ngay bây giờ. Để tăng cường bảo mật, chúng tôi khuyến nghị:</p>
        <ul>
          <li>Sử dụng mật khẩu mạnh và duy nhất</li>
          <li>Bật xác thực 2 bước (2FA) nếu chưa có</li>
          <li>Thường xuyên kiểm tra hoạt động đăng nhập</li>
        </ul>

        <p>Nếu bạn không thực hiện việc mở khóa này, vui lòng liên hệ với đội hỗ trợ ngay lập tức.</p>

        <p>Trân trọng,<br/>Đội ngũ Bảo mật CampusLearning</p>
      </div>
    </div>
  `;
  
  try {
    console.log(`Gửi email xác nhận mở khóa cho ${to} từ IP: ${ipAddress}`);
    
    return await transporter.sendMail({
      from: `"CampusLearning Security" <security@campuslearning.com>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Lỗi gửi email xác nhận mở khóa:', error.message);
    return { messageId: 'dev-mode' };
  }
};

/**
 * Send email notification about 2FA setup
 * @param {string} to - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} ipAddress - IP address used for setup
 * @returns {Promise} Promise object
 */
const sendTwoFASetupEmail = async (to, fullName, ipAddress) => {
  const subject = '🔒 Thiết lập xác thực hai yếu tố cho tài khoản CampusLearning';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669;">🔒 CampusLearning</h2>
      </div>
      <div>
        <p>Xin chào ${fullName},</p>
        <p>Chúng tôi ghi nhận bạn đang thiết lập <strong>xác thực hai yếu tố (2FA)</strong> cho tài khoản CampusLearning của mình.</p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Thông tin thiết lập:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
            <li>IP Address: ${ipAddress}</li>
          </ul>
        </div>

        <p>Xác thực hai yếu tố sẽ giúp bảo vệ tài khoản của bạn an toàn hơn bằng cách yêu cầu một mã xác thực duy nhất từ thiết bị di động của bạn khi đăng nhập.</p>
        
        <p>Nếu bạn không thực hiện hành động này, vui lòng thay đổi mật khẩu tài khoản ngay lập tức và liên hệ với đội hỗ trợ của chúng tôi.</p>

        <p>Trân trọng,<br/>Đội ngũ Bảo mật CampusLearning</p>
      </div>
    </div>
  `;
  
  try {
    console.log(`Gửi email thông báo thiết lập 2FA cho ${to} từ IP: ${ipAddress}`);
    
    return await transporter.sendMail({
      from: `"CampusLearning Security" <security@campuslearning.com>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Lỗi gửi email thông báo thiết lập 2FA:', error.message);
    return { messageId: 'dev-mode' };
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendEmailWithAttachment,
  sendLoginOtpEmail,
  sendAccountUnlockEmail,
  sendAccountUnlockedEmail,
  sendTwoFASetupEmail
};
