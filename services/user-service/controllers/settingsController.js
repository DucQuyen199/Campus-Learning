const { sql, pool } = require('../config/db');
const { sendEmailWithAttachment } = require('../utils/emailService');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    await pool.connect();
    
    // Ensure userId exists and is in the correct format
    const userId = req.user.userId || req.user.id || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong yêu cầu'
      });
    }

    // First check if user profile exists to avoid constraint errors
    const checkQuery = `
      SELECT 1 FROM UserProfiles WHERE UserID = @UserID
    `;
    
    const checkRequest = pool.request();
    checkRequest.input('UserID', sql.BigInt, userId);
    const checkResult = await checkRequest.query(checkQuery);
    
    // If profile doesn't exist, create it with default values
    if (checkResult.recordset.length === 0) {
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          courseUpdates: true,
          examReminders: true,
          messages: true
        },
        privacy: {
          profileVisibility: 'public',
          searchEngineIndex: true,
          activityVisibility: 'public',
          showOnlineStatus: true,
          allowMessages: 'all',
          dataCollection: {
            analytics: true,
            personalization: true,
            thirdParty: false
          },
          contentPreferences: {
            adultContent: false,
            sensitiveContent: false
          }
        },
        preferences: {
          language: 'vi',
          theme: 'light',
          fontSize: 'medium'
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: '30'
        }
      };

      // Create default profile with proper UserID
      const insertQuery = `
        INSERT INTO UserProfiles (
          UserID, 
          NotificationPreferences, 
          PreferredLanguage,
          TimeZone
        ) VALUES (
          @UserID, 
          @NotificationPreferences, 
          @PreferredLanguage,
          @TimeZone
        )
      `;

      const insertRequest = pool.request();
      await insertRequest
        .input('UserID', sql.BigInt, userId)  // Ensure UserID is properly set
        .input('NotificationPreferences', sql.NVarChar(sql.MAX), JSON.stringify(defaultSettings))
        .input('PreferredLanguage', sql.VarChar(10), defaultSettings.preferences.language)
        .input('TimeZone', sql.VarChar(50), 'Asia/Ho_Chi_Minh')
        .query(insertQuery);

      return res.json({
        success: true,
        settings: defaultSettings,
        profileInfo: {
          username: req.user.Username,
          fullName: req.user.FullName,
          profileImage: req.user.Image,
          emailVerified: req.user.EmailVerified || false
        }
      });
    }

    // Query user profile with settings
    const query = `
      SELECT 
        p.NotificationPreferences,
        p.PreferredLanguage,
        p.TimeZone,
        u.Image as ProfileImage,
        u.Status as OnlineStatus,
        u.EmailVerified,
        u.Username,
        u.FullName
      FROM UserProfiles p
      JOIN Users u ON p.UserID = u.UserID
      WHERE p.UserID = @UserID
    `;

    const request = pool.request();
    request.input('UserID', sql.BigInt, userId);
    const result = await request.query(query);

    // Parse stored settings
    const userProfile = result.recordset[0];
    let settings;
    
    try {
      settings = JSON.parse(userProfile.NotificationPreferences || '{}');
    } catch (error) {
      // If JSON parsing fails, use default settings
      settings = {
        notifications: {
          email: true,
          push: true,
          courseUpdates: true,
          examReminders: true,
          messages: true
        },
        privacy: {
          profileVisibility: 'public',
          searchEngineIndex: true,
          activityVisibility: 'public',
          showOnlineStatus: true,
          allowMessages: 'all',
          dataCollection: {
            analytics: true,
            personalization: true,
            thirdParty: false
          },
          contentPreferences: {
            adultContent: false,
            sensitiveContent: false
          }
        },
        preferences: {
          language: userProfile.PreferredLanguage || 'vi',
          theme: 'light',
          fontSize: 'medium'
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: '30'
        }
      };
    }

    // Return settings and profile info
    return res.json({
      success: true,
      settings,
      profileInfo: {
        username: userProfile.Username,
        fullName: userProfile.FullName,
        profileImage: userProfile.ProfileImage,
        emailVerified: userProfile.EmailVerified || false,
        onlineStatus: userProfile.OnlineStatus
      }
    });

  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin cài đặt người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    await pool.connect();
    
    // Ensure userId exists and is in the correct format
    const userId = req.user.userId || req.user.id || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong yêu cầu'
      });
    }

    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu cài đặt được cung cấp'
      });
    }

    // Validate settings structure
    if (!settings.notifications || !settings.privacy || !settings.preferences || !settings.security) {
      return res.status(400).json({
        success: false,
        message: 'Cấu trúc cài đặt không hợp lệ'
      });
    }

    // Check if user profile exists
    const checkQuery = `
      SELECT 1 FROM UserProfiles WHERE UserID = @UserID
    `;
    
    const request = pool.request();
    request.input('UserID', sql.BigInt, userId);
    const checkResult = await request.query(checkQuery);
    
    let query;
    
    if (checkResult.recordset.length === 0) {
      // Profile doesn't exist, create new one
      query = `
        INSERT INTO UserProfiles (
          UserID,
          NotificationPreferences,
          PreferredLanguage,
          TimeZone,
          UpdatedAt
        ) VALUES (
          @UserID,
          @NotificationPreferences,
          @PreferredLanguage,
          @TimeZone,
          GETDATE()
        )
      `;
    } else {
      // Profile exists, update it
      query = `
        UPDATE UserProfiles
        SET 
          NotificationPreferences = @NotificationPreferences,
          PreferredLanguage = @PreferredLanguage,
          TimeZone = @TimeZone,
          UpdatedAt = GETDATE()
        WHERE UserID = @UserID
      `;
    }

    // Update user status if online status preference changed
    if (settings.privacy && settings.privacy.showOnlineStatus !== undefined) {
      const statusQuery = `
        UPDATE Users
        SET Status = @Status
        WHERE UserID = @UserID
      `;
      
      const statusRequest = pool.request();
      statusRequest.input('UserID', sql.BigInt, userId);
      statusRequest.input('Status', sql.VarChar(20), settings.privacy.showOnlineStatus ? 'ONLINE' : 'OFFLINE');
      await statusRequest.query(statusQuery);
    }
    
    // Execute the main query
    await request
      .input('UserID', sql.BigInt, userId)  // Ensure UserID is explicitly set
      .input('NotificationPreferences', sql.NVarChar(sql.MAX), JSON.stringify(settings))
      .input('PreferredLanguage', sql.VarChar(10), settings.preferences.language || 'vi')
      .input('TimeZone', sql.VarChar(50), 'Asia/Ho_Chi_Minh')
      .query(query);

    res.json({
      success: true,
      message: 'Cài đặt đã được cập nhật thành công',
      settings
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật cài đặt người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được tải lên'
      });
    }

    // Ensure userId exists and is in the correct format
    const userId = req.user.userId || req.user.id || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong yêu cầu'
      });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;
    
    await pool.connect();
    const request = pool.request();
    
    // Update user image
    const query = `
      UPDATE Users
      SET 
        Image = @Image,
        UpdatedAt = GETDATE()
      WHERE UserID = @UserID;
      
      SELECT Image FROM Users WHERE UserID = @UserID;
    `;
    
    request.input('UserID', sql.BigInt, userId);
    request.input('Image', sql.VarChar(255), imagePath);
    
    const result = await request.query(query);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      message: 'Ảnh đại diện đã được cập nhật',
      profileImage: result.recordset[0].Image
    });
    
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật ảnh đại diện',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Ensure userId exists and is in the correct format
    const userId = req.user.userId || req.user.id || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong yêu cầu'
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự'
      });
    }
    
    await pool.connect();
    const request = pool.request();
    
    // Get current user password
    const getUserQuery = `
      SELECT Password FROM Users WHERE UserID = @UserID
    `;
    
    request.input('UserID', sql.BigInt, userId);
    const userResult = await request.query(getUserQuery);
    
    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const bcrypt = require('bcrypt');
    const storedPassword = userResult.recordset[0].Password;
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, storedPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    const updateQuery = `
      UPDATE Users
      SET 
        Password = @Password,
        UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `;
    
    request.input('Password', sql.VarChar(255), hashedPassword);
    await request.query(updateQuery);
    
    res.json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công'
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi thay đổi mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password, reason } = req.body;
    
    // Ensure userId exists and is in the correct format
    const userId = req.user.userId || req.user.id || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong yêu cầu'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu là bắt buộc để xác nhận xóa tài khoản'
      });
    }
    
    await pool.connect();
    const request = pool.request();
    
    // Get current user password
    const getUserQuery = `
      SELECT Password FROM Users WHERE UserID = @UserID
    `;
    
    request.input('UserID', sql.BigInt, userId);
    const userResult = await request.query(getUserQuery);
    
    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const bcrypt = require('bcrypt');
    const storedPassword = userResult.recordset[0].Password;
    
    // Verify password
    const isMatch = await bcrypt.compare(password, storedPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }
    
    // Instead of physically deleting, mark account as deleted
    const updateQuery = `
      UPDATE Users
      SET 
        AccountStatus = 'DELETED',
        DeletedAt = GETDATE()
      WHERE UserID = @UserID
    `;
    
    await request.query(updateQuery);
    
    // Log deletion reason if provided
    if (reason) {
      const logQuery = `
        INSERT INTO AccountDeletionLogs (UserID, Reason, DeletedAt)
        VALUES (@UserID, @Reason, GETDATE())
      `;
      
      try {
        const logRequest = pool.request();
        logRequest.input('UserID', sql.BigInt, userId);
        logRequest.input('Reason', sql.NVarChar(500), reason);
        await logRequest.query(logQuery);
      } catch (logError) {
        console.error('Error logging account deletion reason:', logError);
        // Continue with account deletion even if logging fails
      }
    }
    
    res.json({
      success: true,
      message: 'Tài khoản đã được xóa thành công'
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa tài khoản',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export user data and email JSON file attachment
exports.exportUserData = async (req, res) => {
  const path = require('path');
  const fs = require('fs');

  try {
    await pool.connect();

    const userId = req.user.userId || req.user.id || req.user.UserID;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy ID người dùng' });
    }

    // 1. Thu thập dữ liệu
    const userQuery = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT * FROM Users WHERE UserID = @UserID');

    const profileQuery = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT * FROM UserProfiles WHERE UserID = @UserID');

    const paymentQuery = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT * FROM PaymentTransactions WHERE UserID = @UserID');

    const enrollQuery = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT * FROM CourseEnrollments WHERE UserID = @UserID');

    // Sanitize user data before exporting (remove sensitive fields)
    let userData = userQuery.recordset[0] || {};
    if (userData) {
      // Remove sensitive fields
      delete userData.Password;
      delete userData.LastLoginIP;
      delete userData.PasskeyCredentials;
    }

    const dataExport = {
      generatedAt: new Date().toISOString(),
      user: userData,
      profile: profileQuery.recordset[0] || {},
      payments: paymentQuery.recordset || [],
      enrollments: enrollQuery.recordset || []
    };

    // 2. Ghi file tạm
    const exportDir = path.join(__dirname, '../temp/exports');
    
    // Make sure export directory exists
    try {
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Error creating export directory:', dirError);
      return res.status(500).json({ success: false, message: 'Không thể tạo thư mục xuất dữ liệu' });
    }

    const fileName = `userdata-${userId}-${Date.now()}.json`;
    const filePath = path.join(exportDir, fileName);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(dataExport, null, 2), 'utf8');
    } catch (fileError) {
      console.error('Error writing export file:', fileError);
      return res.status(500).json({ success: false, message: 'Không thể ghi file dữ liệu xuất' });
    }

    // 3. Gửi email với file đính kèm
    // Lấy tất cả email đã xác thực
    const emailsQuery = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query(`
        SELECT Email FROM UserEmails WHERE UserID = @UserID AND IsVerified = 1
        UNION ALL
        SELECT Email FROM Users WHERE UserID = @UserID AND EmailVerified = 1
      `);

    const emailList = emailsQuery.recordset.map(r => r.Email).filter(Boolean);
    // Nếu không có email nào được xác thực, fallback về email chính (dù chưa verified)
    if (emailList.length === 0 && dataExport.user.Email) {
      emailList.push(dataExport.user.Email);
    }
    
    if (emailList.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy email để gửi dữ liệu' });
    }
    
    const toAddresses = emailList.join(',');
    const fullName = dataExport.user.FullName || dataExport.user.Username || 'User';

    try {
      await sendEmailWithAttachment({
        to: toAddresses,
        subject: 'Bản sao dữ liệu cá nhân của bạn',
        text: `Xin chào ${fullName},\n\nĐính kèm là bản sao dữ liệu cá nhân bạn đã yêu cầu từ Campust.\n\nTrân trọng,\nĐội ngũ Campust`,
        attachments: [
          {
            filename: fileName,
            content: Buffer.from(JSON.stringify(dataExport, null, 2), 'utf8'),
            contentType: 'application/json',
          }
        ]
      });

      // Email sent – remove temp file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.warn('Cannot remove temporary export file:', cleanupErr.message);
      }
    } catch (mailErr) {
      console.error('Send export email error:', mailErr);
      // Trả file trực tiếp nếu gửi email thất bại
      return res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Không thể gửi email hoặc tải xuống dữ liệu. Vui lòng thử lại sau.' 
          });
        }
      });
    }

    return res.json({ success: true, message: 'Dữ liệu đang được gửi tới email của bạn.' });
  } catch (error) {
    console.error('Export user data error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi xuất dữ liệu', error: error.message });
  }
}; 