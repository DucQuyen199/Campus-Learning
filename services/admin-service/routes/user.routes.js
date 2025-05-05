const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, role, search, sortBy, order, limit, offset } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT u.UserID, u.Username, u.Email, u.FullName, u.Role, u.Status, 
             u.CreatedAt, u.LastLoginAt, u.Image, u.PhoneNumber
      FROM Users u
      WHERE DeletedAt IS NULL
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (status) {
      query += ` AND Status = @status`;
      queryParams.push({
        name: 'status',
        value: status,
        type: sql.VarChar(20)
      });
    }
    
    if (role) {
      query += ` AND Role = @role`;
      queryParams.push({
        name: 'role',
        value: role,
        type: sql.VarChar(20)
      });
    }
    
    if (search) {
      query += ` AND (Username LIKE @search OR Email LIKE @search OR FullName LIKE @search)`;
      queryParams.push({
        name: 'search',
        value: `%${search}%`,
        type: sql.NVarChar(255)
      });
    }
    
    // Add sorting
    query += ` ORDER BY ${sortBy || 'CreatedAt'} ${order === 'asc' ? 'ASC' : 'DESC'}`;
    
    // Add pagination
    if (limit) {
      query += ` OFFSET ${parseInt(offset) || 0} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    }
    
    const request = pool.request();
    
    // Add parameters to the request
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM Users
      WHERE DeletedAt IS NULL
      ${status ? ' AND Status = @status' : ''}
      ${role ? ' AND Role = @role' : ''}
      ${search ? ' AND (Username LIKE @search OR Email LIKE @search OR FullName LIKE @search)' : ''}
    `;
    
    const countResult = await request.query(countQuery);
    
    return res.status(200).json({
      users: result.recordset,
      totalCount: countResult.recordset[0].totalCount
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    return res.status(500).json({ message: 'Server error while getting users' });
  }
});

// Get user by ID with detailed information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Get user basic info
    const userResult = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT 
          u.UserID, u.Username, u.Email, u.FullName, u.Role, u.Status, 
          u.CreatedAt, u.LastLoginAt, u.Image, u.PhoneNumber, u.Bio,
          u.Country, u.City, u.Address, u.Birthday
        FROM Users u
        WHERE u.UserID = @userId AND u.DeletedAt IS NULL
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user profile
    const profileResult = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT * FROM UserProfiles
        WHERE UserID = @userId
      `);
    
    // Get user activity summary
    const activityResult = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM CourseEnrollments WHERE UserID = @userId) as CourseCount,
          (SELECT COUNT(*) FROM EventParticipants WHERE UserID = @userId) as EventCount,
          (SELECT COUNT(*) FROM ExamParticipants WHERE UserID = @userId) as ExamCount,
          (SELECT COUNT(*) FROM CompetitionParticipants WHERE UserID = @userId) as CompetitionCount
      `);
    
    // Get user rankings
    const rankingResult = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT * FROM UserRankings
        WHERE UserID = @userId
      `);
    
    // Get user achievements
    const achievementsResult = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT a.*, c.Title as CompetitionTitle
        FROM UserAchievements a
        LEFT JOIN Competitions c ON a.CompetitionID = c.CompetitionID
        WHERE a.UserID = @userId
        ORDER BY a.AchievedAt DESC
      `);
    
    // Return combined data
    return res.status(200).json({
      user: userResult.recordset[0],
      profile: profileResult.recordset[0] || null,
      ranking: rankingResult.recordset[0] || null,
      activitySummary: activityResult.recordset[0],
      achievements: achievementsResult.recordset
    });
  } catch (error) {
    console.error('Get User Error:', error);
    return res.status(500).json({ message: 'Server error while getting user details' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      role,
      phoneNumber,
      image,
      bio,
      country,
      city,
      address,
      birthday
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if username already exists
    const usernameCheck = await pool.request()
      .input('username', sql.VarChar(50), username)
      .query('SELECT UserID FROM Users WHERE Username = @username');
    
    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const emailCheck = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Create user
      const userResult = await new sql.Request(transaction)
        .input('username', sql.VarChar(50), username)
        .input('email', sql.VarChar(100), email)
        .input('password', sql.VarChar(255), hashedPassword)
        .input('fullName', sql.NVarChar(100), fullName)
        .input('role', sql.VarChar(20), role || 'USER')
        .input('status', sql.VarChar(20), 'active')
        .input('phoneNumber', sql.VarChar(20), phoneNumber)
        .input('image', sql.VarChar(255), image)
        .input('bio', sql.NVarChar(500), bio)
        .input('country', sql.VarChar(50), country)
        .input('city', sql.VarChar(50), city)
        .input('address', sql.NVarChar(255), address)
        .input('birthday', sql.Date, birthday ? new Date(birthday) : null)
        .input('createdAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO Users (
            Username, Email, Password, FullName, Role, Status, 
            PhoneNumber, Image, Bio, Country, City, Address, 
            Birthday, CreatedAt
          )
          OUTPUT INSERTED.UserID
          VALUES (
            @username, @email, @password, @fullName, @role, @status, 
            @phoneNumber, @image, @bio, @country, @city, @address, 
            @birthday, @createdAt
          )
        `);
      
      const userId = userResult.recordset[0].UserID;
      
      // Create default user profile
      await new sql.Request(transaction)
        .input('userId', sql.BigInt, userId)
        .input('createdAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO UserProfiles (
            UserID, ExperiencePoints, Level, CreatedAt
          )
          VALUES (
            @userId, 0, 1, @createdAt
          )
        `);
      
      // Create default user ranking
      await new sql.Request(transaction)
        .input('userId', sql.BigInt, userId)
        .input('createdAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO UserRankings (
            UserID, RankPoints, Rank, CreatedAt
          )
          VALUES (
            @userId, 0, 'Beginner', @createdAt
          )
        `);
      
      await transaction.commit();
      
      return res.status(201).json({
        message: 'User created successfully',
        userId: userId
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create User Error:', error);
    return res.status(500).json({ message: 'Server error while creating user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      fullName,
      role,
      status,
      phoneNumber,
      image,
      bio,
      country,
      city,
      address,
      birthday
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input('userId', sql.BigInt, id)
      .query('SELECT UserID FROM Users WHERE UserID = @userId AND DeletedAt IS NULL');
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username is being changed and already exists
    if (username) {
      const usernameCheck = await pool.request()
        .input('username', sql.VarChar(50), username)
        .input('userId', sql.BigInt, id)
        .query('SELECT UserID FROM Users WHERE Username = @username AND UserID != @userId');
      
      if (usernameCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Check if email is being changed and already exists
    if (email) {
      const emailCheck = await pool.request()
        .input('email', sql.VarChar(100), email)
        .input('userId', sql.BigInt, id)
        .query('SELECT UserID FROM Users WHERE Email = @email AND UserID != @userId');
      
      if (emailCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Update user
    await pool.request()
      .input('userId', sql.BigInt, id)
      .input('username', sql.VarChar(50), username)
      .input('email', sql.VarChar(100), email)
      .input('fullName', sql.NVarChar(100), fullName)
      .input('role', sql.VarChar(20), role)
      .input('status', sql.VarChar(20), status)
      .input('phoneNumber', sql.VarChar(20), phoneNumber)
      .input('image', sql.VarChar(255), image)
      .input('bio', sql.NVarChar(500), bio)
      .input('country', sql.VarChar(50), country)
      .input('city', sql.VarChar(50), city)
      .input('address', sql.NVarChar(255), address)
      .input('birthday', sql.Date, birthday ? new Date(birthday) : null)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET
          Username = ISNULL(@username, Username),
          Email = ISNULL(@email, Email),
          FullName = ISNULL(@fullName, FullName),
          Role = ISNULL(@role, Role),
          Status = ISNULL(@status, Status),
          PhoneNumber = ISNULL(@phoneNumber, PhoneNumber),
          Image = ISNULL(@image, Image),
          Bio = ISNULL(@bio, Bio),
          Country = ISNULL(@country, Country),
          City = ISNULL(@city, City),
          Address = ISNULL(@address, Address),
          Birthday = ISNULL(@birthday, Birthday),
          UpdatedAt = @updatedAt
        WHERE UserID = @userId
      `);
    
    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update User Error:', error);
    return res.status(500).json({ message: 'Server error while updating user' });
  }
});

// Update user password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input('userId', sql.BigInt, id)
      .query('SELECT UserID FROM Users WHERE UserID = @userId AND DeletedAt IS NULL');
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update password
    await pool.request()
      .input('userId', sql.BigInt, id)
      .input('password', sql.VarChar(255), hashedPassword)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET Password = @password, UpdatedAt = @updatedAt
        WHERE UserID = @userId
      `);
    
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update Password Error:', error);
    return res.status(500).json({ message: 'Server error while updating password' });
  }
});

// Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Soft delete user
    await pool.request()
      .input('userId', sql.BigInt, id)
      .input('deletedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Users
        SET DeletedAt = @deletedAt, Status = 'deleted'
        WHERE UserID = @userId
      `);
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    return res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// Get all roles
router.get('/roles/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT * FROM Roles
        ORDER BY Name
      `);
    
    return res.status(200).json({ roles: result.recordset });
  } catch (error) {
    console.error('Get Roles Error:', error);
    return res.status(500).json({ message: 'Server error while getting roles' });
  }
});

// Create role
router.post('/roles', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const pool = await poolPromise;
    
    // Check if role name already exists
    const roleCheck = await pool.request()
      .input('name', sql.VarChar(50), name)
      .query('SELECT RoleID FROM Roles WHERE Name = @name');
    
    if (roleCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }
    
    // Create role
    const result = await pool.request()
      .input('name', sql.VarChar(50), name)
      .input('description', sql.NVarChar(255), description)
      .input('permissions', sql.NVarChar(sql.MAX), JSON.stringify(permissions || []))
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Roles (Name, Description, Permissions, CreatedAt)
        OUTPUT INSERTED.RoleID
        VALUES (@name, @description, @permissions, @createdAt)
      `);
    
    const roleId = result.recordset[0].RoleID;
    
    return res.status(201).json({
      message: 'Role created successfully',
      roleId: roleId
    });
  } catch (error) {
    console.error('Create Role Error:', error);
    return res.status(500).json({ message: 'Server error while creating role' });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const pool = await poolPromise;
    
    // Check if role exists
    const roleCheck = await pool.request()
      .input('roleId', sql.BigInt, id)
      .query('SELECT RoleID FROM Roles WHERE RoleID = @roleId');
    
    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Check if role name already exists (if changing the name)
    if (name) {
      const nameCheck = await pool.request()
        .input('name', sql.VarChar(50), name)
        .input('roleId', sql.BigInt, id)
        .query('SELECT RoleID FROM Roles WHERE Name = @name AND RoleID != @roleId');
      
      if (nameCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
    }
    
    // Update role
    await pool.request()
      .input('roleId', sql.BigInt, id)
      .input('name', sql.VarChar(50), name)
      .input('description', sql.NVarChar(255), description)
      .input('permissions', sql.NVarChar(sql.MAX), permissions ? JSON.stringify(permissions) : null)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Roles
        SET
          Name = ISNULL(@name, Name),
          Description = ISNULL(@description, Description),
          Permissions = ISNULL(@permissions, Permissions),
          UpdatedAt = @updatedAt
        WHERE RoleID = @roleId
      `);
    
    return res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update Role Error:', error);
    return res.status(500).json({ message: 'Server error while updating role' });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if role is assigned to any users
    const usersWithRole = await pool.request()
      .input('roleId', sql.BigInt, id)
      .query(`
        SELECT COUNT(*) as userCount
        FROM Users
        WHERE RoleID = @roleId AND DeletedAt IS NULL
      `);
    
    if (usersWithRole.recordset[0].userCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role as it is assigned to users. Remove this role from all users first.',
        userCount: usersWithRole.recordset[0].userCount
      });
    }
    
    // Delete role
    await pool.request()
      .input('roleId', sql.BigInt, id)
      .query('DELETE FROM Roles WHERE RoleID = @roleId');
    
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete Role Error:', error);
    return res.status(500).json({ message: 'Server error while deleting role' });
  }
});

// Get user activity
router.get('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input('userId', sql.BigInt, id)
      .query('SELECT UserID FROM Users WHERE UserID = @userId AND DeletedAt IS NULL');
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get course enrollments
    const courseEnrollments = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT ce.*, c.Title as CourseTitle, c.Category
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        WHERE ce.UserID = @userId
        ORDER BY ce.EnrolledAt DESC
      `);
    
    // Get event participations
    const eventParticipations = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT ep.*, e.Title as EventTitle, e.Category
        FROM EventParticipants ep
        JOIN Events e ON ep.EventID = e.EventID
        WHERE ep.UserID = @userId
        ORDER BY ep.RegistrationDate DESC
      `);
    
    // Get exam participations
    const examParticipations = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT ex.*, e.Title as ExamTitle, c.Title as CourseTitle
        FROM ExamParticipants ex
        JOIN Exams e ON ex.ExamID = e.ExamID
        LEFT JOIN Courses c ON e.CourseID = c.CourseID
        WHERE ex.UserID = @userId
        ORDER BY ex.StartedAt DESC
      `);
    
    // Get login history
    const loginHistory = await pool.request()
      .input('userId', sql.BigInt, id)
      .query(`
        SELECT TOP 20 * FROM UserLoginHistory
        WHERE UserID = @userId
        ORDER BY LoginAt DESC
      `);
    
    return res.status(200).json({
      courseEnrollments: courseEnrollments.recordset,
      eventParticipations: eventParticipations.recordset,
      examParticipations: examParticipations.recordset,
      loginHistory: loginHistory.recordset
    });
  } catch (error) {
    console.error('Get User Activity Error:', error);
    return res.status(500).json({ message: 'Server error while getting user activity' });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN Status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN DATEDIFF(day, CreatedAt, GETDATE()) <= 30 THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN DATEDIFF(day, LastLoginAt, GETDATE()) <= 7 THEN 1 ELSE 0 END) as recentlyActive
      FROM Users
      WHERE DeletedAt IS NULL
    `);

    // Calculate change from last month
    const lastMonthResult = await pool.request().query(`
      SELECT COUNT(*) as lastMonthTotal
      FROM Users
      WHERE 
        DeletedAt IS NULL AND
        CreatedAt >= DATEADD(month, -1, GETDATE())
    `);

    const total = result.recordset[0].total;
    const lastMonthTotal = lastMonthResult.recordset[0].lastMonthTotal;
    const change = ((total - lastMonthTotal) / lastMonthTotal) * 100;

    return res.status(200).json({
      success: true,
      data: {
        ...result.recordset[0],
        change: change.toFixed(2),
        changeType: change >= 0 ? 'increase' : 'decrease'
      }
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user stats'
    });
  }
});

// Get user activity
router.get('/activity', async (req, res) => {
  try {
    const pool = await poolPromise;
    // Get last 6 months activity
    const result = await pool.request().query(`
      SELECT 
        FORMAT(CreatedAt, 'MMM') as name,
        COUNT(*) as users,
        ISNULL((SELECT COUNT(*) 
         FROM CourseEnrollments 
         WHERE MONTH(EnrolledAt) = MONTH(u.CreatedAt)
         AND YEAR(EnrolledAt) = YEAR(u.CreatedAt)
        ), 0) as courses,
        ISNULL((SELECT COUNT(*) 
         FROM EventParticipants
         WHERE MONTH(RegistrationDate) = MONTH(u.CreatedAt)
         AND YEAR(RegistrationDate) = YEAR(u.CreatedAt)
        ), 0) as events
      FROM Users u
      WHERE 
        DeletedAt IS NULL AND
        CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY FORMAT(CreatedAt, 'MMM'), MONTH(CreatedAt), YEAR(CreatedAt)
      ORDER BY YEAR(CreatedAt), MONTH(CreatedAt)
    `);

    // Ensure we have data for all 6 months, even if empty
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const activityData = [];
    
    // Create a map of existing data
    const dataMap = {};
    result.recordset.forEach(item => {
      dataMap[item.name] = item;
    });
    
    // Fill in data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthNames[month.getMonth()];
      
      if (dataMap[monthName]) {
        activityData.push(dataMap[monthName]);
      } else {
        activityData.push({
          name: monthName,
          users: 0,
          courses: 0,
          events: 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (error) {
    console.error('Get User Activity Error:', error);
    return res.status(500).json({
      success: false, 
      message: 'Error getting user activity'
    });
  }
});

module.exports = router;