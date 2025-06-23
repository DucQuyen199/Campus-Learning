const { pool, sql } = require('../config/db');
const crypto = require('crypto');

// Get list of user emails
exports.getUserEmails = async (req, res) => {
  const userId = req.user.userId;
  try {
    await pool.connect();
    const request = pool.request();
    request.input('userId', sql.BigInt, userId);
    // Lấy tất cả email phụ + email chính trong bảng Users (nếu chưa nằm trong UserEmails)
    const result = await request.query(`
      SELECT EmailID, Email, IsPrimary, IsVerified, Visibility
      FROM UserEmails
      WHERE UserID = @userId
      UNION ALL
      SELECT 
        NULL AS EmailID,
        u.Email,
        1 AS IsPrimary,
        CASE WHEN u.EmailVerified = 1 THEN 1 ELSE 0 END AS IsVerified,
        'private' AS Visibility
      FROM Users u
      WHERE u.UserID = @userId
        AND NOT EXISTS (
          SELECT 1 FROM UserEmails ue WHERE ue.UserID = @userId AND ue.Email = u.Email
        );
    `);
    return res.json({ emails: result.recordset, success: true });
  } catch (error) {
    console.error('Error fetching user emails from UserEmails:', error);
    // Fallback to primary email from Users table
    try {
      const fallbackReq = pool.request();
      fallbackReq.input('userId', sql.BigInt, userId);
      const userRes = await fallbackReq.query(`
        SELECT Email, EmailVerified FROM Users WHERE UserID = @userId;
      `);
      if (userRes.recordset.length > 0) {
        const user = userRes.recordset[0];
        const emailItem = {
          EmailID: null,
          Email: user.Email,
          IsPrimary: 1,
          IsVerified: user.EmailVerified ? 1 : 0,
          Visibility: 'private'
        };
        return res.json({ emails: [emailItem], success: true });
      }
      return res.json({ emails: [], success: true });
    } catch (fallbackError) {
      console.error('Error in fallback getUserEmails:', fallbackError);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách email', error: fallbackError.message, success: false });
    }
  }
};

// Add new email
exports.addUserEmail = async (req, res) => {
  try {
    await pool.connect();
    const userId = req.user.userId;
    const { email } = req.body;
    // Generate verification token
    const token = crypto.randomBytes(20).toString('hex');
    const request = pool.request();
    request
      .input('userId', sql.BigInt, userId)
      .input('Email', sql.VarChar(255), email)
      .input('Visibility', sql.VarChar(20), 'private')
      .input('VerificationToken', sql.VarChar(255), token);
    await request.query(`
      INSERT INTO UserEmails (UserID, Email, IsPrimary, IsVerified, Visibility, VerificationToken)
      VALUES (@userId, @Email, 0, 0, @Visibility, @VerificationToken);
    `);
    // TODO: send verification email with token
    res.status(201).json({ message: 'Email đã được thêm. Vui lòng kiểm tra email để xác thực.', success: true });
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ message: 'Lỗi khi thêm email', error: error.message, success: false });
  }
};

// Set primary email
exports.setPrimaryEmail = async (req, res) => {
  try {
    await pool.connect();
    const userId = req.user.userId;
    const { emailId } = req.params;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const req1 = new sql.Request(transaction);
    req1.input('userId', sql.BigInt, userId);
    await req1.query(
      `UPDATE UserEmails SET IsPrimary = 0 WHERE UserID = @userId;`
    );
    const req2 = new sql.Request(transaction);
    req2.input('userId', sql.BigInt, userId).input('emailId', sql.BigInt, emailId);
    await req2.query(
      `UPDATE UserEmails SET IsPrimary = 1 WHERE EmailID = @emailId AND UserID = @userId;`
    );
    await transaction.commit();
    res.json({ message: 'Đã đặt email chính thành công', success: true });
  } catch (error) {
    console.error('Error setting primary email:', error);
    res.status(500).json({ message: 'Lỗi khi đặt email chính', error: error.message, success: false });
  }
};

// Delete email
exports.deleteUserEmail = async (req, res) => {
  try {
    await pool.connect();
    const userId = req.user.userId;
    const { emailId } = req.params;
    const request = pool.request();
    request.input('userId', sql.BigInt, userId).input('emailId', sql.BigInt, emailId);
    const check = await request.query(
      `SELECT IsPrimary FROM UserEmails WHERE EmailID=@emailId AND UserID=@userId;`
    );
    if (!check.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy email', success: false });
    }
    if (check.recordset[0].IsPrimary) {
      return res.status(400).json({ message: 'Không thể xóa email chính', success: false });
    }
    await request.query(
      `DELETE FROM UserEmails WHERE EmailID=@emailId AND UserID=@userId;`
    );
    res.json({ message: 'Email đã được xóa', success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Lỗi khi xóa email', error: error.message, success: false });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    await pool.connect();
    const userId = req.user.userId;
    const { emailId } = req.params;
    const request = pool.request();
    request.input('userId', sql.BigInt, userId).input('emailId', sql.BigInt, emailId);
    const result = await request.query(
      `SELECT Email, VerificationToken FROM UserEmails WHERE EmailID=@emailId AND UserID=@userId;`
    );
    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy email', success: false });
    }
    // TODO: resend verification email
    res.json({ message: 'Đã gửi lại email xác thực', success: true });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ message: 'Lỗi khi gửi lại email xác thực', error: error.message, success: false });
  }
}; 