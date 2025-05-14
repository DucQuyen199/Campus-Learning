const express = require('express');
const router = express.Router();
const sql = require('mssql');
const authMiddleware = require('../src/middleware/auth');
const dbConfig = require('../src/config/db');

// Protect all routes with auth middleware
router.use(authMiddleware);

// Get all students with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Build query parameters
    const searchParam = `%${search}%`;
    
    // Get total count for pagination
    let countResult;
    if (search) {
      countResult = await pool.request()
        .input('search', sql.NVarChar, searchParam)
        .query(`
          SELECT COUNT(*) as total 
          FROM Users u
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          WHERE u.Role = 'STUDENT' 
          AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search OR u.Email LIKE @search)
        `);
    } else {
      countResult = await pool.request()
        .query(`
          SELECT COUNT(*) as total 
          FROM Users u
          WHERE u.Role = 'STUDENT'
        `);
    }
    
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated students data
    let studentsResult;
    if (search) {
      studentsResult = await pool.request()
        .input('search', sql.NVarChar, searchParam)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth, 
                 u.PhoneNumber, u.Address, u.AccountStatus, sd.StudentCode
          FROM Users u
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          WHERE u.Role = 'STUDENT'
          AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search OR u.Email LIKE @search)
          ORDER BY u.FullName
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
    } else {
      studentsResult = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth, 
                 u.PhoneNumber, u.Address, u.AccountStatus, sd.StudentCode
          FROM Users u
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          WHERE u.Role = 'STUDENT'
          ORDER BY u.FullName
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
    }
    
    res.json({
      success: true,
      data: studentsResult.recordset,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy dữ liệu sinh viên'
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Get student details
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        SELECT u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth, 
               u.PhoneNumber, u.Address, u.AccountStatus, u.City, u.Country,
               sd.StudentCode, sd.Gender, sd.EnrollmentDate, sd.IdentityCardNumber,
               sd.Class, sd.CurrentSemester, sd.AcademicStatus
        FROM Users u
        LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
        WHERE u.UserID = @id AND u.Role = 'STUDENT'
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sinh viên'
    });
  }
});

// Add new student
router.post('/', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      dateOfBirth,
      phoneNumber,
      address,
      studentCode,
      gender,
      enrollmentDate,
      programId
    } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !fullName || !studentCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sinh viên'
      });
    }
    
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert into Users table
      const userResult = await new sql.Request(transaction)
        .input('username', sql.VarChar(50), username)
        .input('email', sql.VarChar(100), email)
        .input('password', sql.VarChar(255), password)
        .input('fullName', sql.NVarChar(100), fullName)
        .input('dateOfBirth', sql.Date, dateOfBirth || null)
        .input('phoneNumber', sql.VarChar(15), phoneNumber || null)
        .input('address', sql.NVarChar(255), address || null)
        .input('role', sql.VarChar(20), 'STUDENT')
        .query(`
          INSERT INTO Users (Username, Email, Password, FullName, DateOfBirth, PhoneNumber, Address, Role, CreatedAt, UpdatedAt)
          VALUES (@username, @email, @password, @fullName, @dateOfBirth, @phoneNumber, @address, @role, GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS UserID;
        `);
      
      const userId = userResult.recordset[0].UserID;
      
      // Insert into StudentDetails table
      await new sql.Request(transaction)
        .input('userId', sql.BigInt, userId)
        .input('studentCode', sql.VarChar(20), studentCode)
        .input('gender', sql.VarChar(10), gender || null)
        .input('enrollmentDate', sql.Date, enrollmentDate || null)
        .query(`
          INSERT INTO StudentDetails (UserID, StudentCode, Gender, EnrollmentDate, CreatedAt, UpdatedAt)
          VALUES (@userId, @studentCode, @gender, @enrollmentDate, GETDATE(), GETDATE());
        `);
      
      // If programId is provided, associate student with program
      if (programId) {
        await new sql.Request(transaction)
          .input('userId', sql.BigInt, userId)
          .input('programId', sql.BigInt, programId)
          .input('entryYear', sql.Int, new Date().getFullYear())
          .query(`
            INSERT INTO StudentPrograms (UserID, ProgramID, EntryYear, Status, CreatedAt, UpdatedAt)
            VALUES (@userId, @programId, @entryYear, 'Active', GETDATE(), GETDATE());
          `);
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        message: 'Thêm sinh viên thành công',
        data: {
          id: userId,
          username,
          email,
          fullName,
          studentCode
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error adding student:', error);
    
    // Handle duplicate entry error
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        success: false,
        message: 'Mã sinh viên, tên đăng nhập hoặc email đã tồn tại'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sinh viên'
    });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const {
      email,
      fullName,
      dateOfBirth,
      phoneNumber,
      address,
      gender,
      status
    } = req.body;
    
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Update the user information
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .input('email', sql.VarChar(100), email)
      .input('fullName', sql.NVarChar(100), fullName)
      .input('dateOfBirth', sql.Date, dateOfBirth || null)
      .input('phoneNumber', sql.VarChar(15), phoneNumber || null)
      .input('address', sql.NVarChar(255), address || null)
      .input('status', sql.VarChar(20), status || 'ACTIVE')
      .query(`
        UPDATE Users
        SET Email = @email,
            FullName = @fullName,
            DateOfBirth = @dateOfBirth,
            PhoneNumber = @phoneNumber,
            Address = @address,
            AccountStatus = @status,
            UpdatedAt = GETDATE()
        WHERE UserID = @id AND Role = 'STUDENT';
        
        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    
    if (result.recordset[0].AffectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
    
    // If gender is provided, update student details
    if (gender) {
      await pool.request()
        .input('id', sql.BigInt, req.params.id)
        .input('gender', sql.VarChar(10), gender)
        .query(`
          UPDATE StudentDetails
          SET Gender = @gender,
              UpdatedAt = GETDATE()
          WHERE UserID = @id;
        `);
    }
    
    res.json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công',
      data: {
        id: parseInt(req.params.id),
        email,
        fullName,
        dateOfBirth,
        phoneNumber,
        address,
        gender,
        status
      }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Handle duplicate entry error
    if (error.number === 2627 || error.number === 2601) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin sinh viên'
    });
  }
});

// Delete student (soft delete by updating AccountStatus to DELETED)
router.delete('/:id', async (req, res) => {
  try {
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Set AccountStatus to DELETED and record deletion time
    const result = await pool.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        UPDATE Users
        SET AccountStatus = 'DELETED',
            DeletedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE UserID = @id AND Role = 'STUDENT';
        
        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    
    if (result.recordset[0].AffectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
    
    res.json({
      success: true,
      message: 'Xóa sinh viên thành công'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sinh viên'
    });
  }
});

module.exports = router; 