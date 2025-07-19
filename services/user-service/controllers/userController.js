const { sql, pool } = require('../config/db');

exports.updateUser = async (req, res) => {
  try {
    await pool.connect();
    
    // Lấy userId từ token đã được xác thực trong middleware
    const { userId } = req.user;
    const updateData = req.body;

    // Query để cập nhật thông tin user
    const query = `
      UPDATE Users
      SET 
        PhoneNumber = @PhoneNumber,
        DateOfBirth = @DateOfBirth,
        School = @School,
        Address = @Address,
        City = @City,
        UpdatedAt = GETDATE()
      WHERE UserID = @UserID;

      SELECT 
        UserID, Username, Email, FullName, 
        PhoneNumber, DateOfBirth, School,
        Address, City, Country, Role,
        Status, AccountStatus, EmailVerified,
        CreatedAt, UpdatedAt, LastLoginAt
      FROM Users 
      WHERE UserID = @UserID;
    `;

    const request = pool.request();
    
    // Bind parameters
    request
      .input('UserID', sql.BigInt, userId)
      .input('PhoneNumber', sql.VarChar(15), updateData.PhoneNumber || null)
      .input('DateOfBirth', sql.Date, updateData.DateOfBirth ? new Date(updateData.DateOfBirth) : null)
      .input('School', sql.NVarChar(255), updateData.School || null)
      .input('Address', sql.NVarChar(255), updateData.Address || null)
      .input('City', sql.NVarChar(100), updateData.City || null);

    const result = await request.query(query);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Format dates before sending response
    const updatedUser = result.recordset[0];
    if (updatedUser.DateOfBirth) {
      updatedUser.DateOfBirth = updatedUser.DateOfBirth.toISOString().split('T')[0];
    }
    if (updatedUser.CreatedAt) {
      updatedUser.CreatedAt = updatedUser.CreatedAt.toISOString();
    }
    if (updatedUser.UpdatedAt) {
      updatedUser.UpdatedAt = updatedUser.UpdatedAt.toISOString();
    }
    if (updatedUser.LastLoginAt) {
      updatedUser.LastLoginAt = updatedUser.LastLoginAt.toISOString();
    }

    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message 
    });
  }
};

// Hàm lấy danh sách người dùng với tìm kiếm
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 1000 } = req.query;
    const offset = (page - 1) * limit;
    
    const request = new sql.Request(pool);
    
    // Optimize SQL query for chat functionality - joining with UserPresence for accurate status
    let query = `
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.Image,
        u.Status, u.AccountStatus, u.Role, 
        CASE 
          WHEN DATEDIFF(MINUTE, u.LastLoginAt, GETDATE()) < 15 THEN 'ONLINE' 
          ELSE 'OFFLINE' 
        END AS OnlineStatus,
        up.Status AS PresenceStatus,
        up.LastActiveAt AS LastActiveTime,
        COUNT(*) OVER() as TotalCount
      FROM Users u WITH (NOLOCK)
      LEFT JOIN UserPresence up WITH (NOLOCK) ON u.UserID = up.UserID
      LEFT JOIN ConversationParticipants cp WITH (NOLOCK) ON u.UserID = cp.UserID
      WHERE u.DeletedAt IS NULL AND u.AccountStatus = 'ACTIVE'
    `;
    
    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      query += `
        AND (
          u.Username LIKE @search
          OR u.Email LIKE @search
          OR u.FullName LIKE @search
        )
      `;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    // Optimize sorting for chat: Online users first, then participation in conversations, then by name
    query += `
      ORDER BY 
        CASE 
          WHEN DATEDIFF(MINUTE, u.LastLoginAt, GETDATE()) < 15 THEN 0
          WHEN up.Status = 'online' OR up.Status = 'ONLINE' THEN 0
          ELSE 1 
        END,
        CASE WHEN cp.ParticipantID IS NOT NULL THEN 0 ELSE 1 END, -- Users with conversations first
        u.LastLoginAt DESC,
        u.FullName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    console.log(`Executing SQL query for user list with limit ${limit}`);
    
    const result = await request.query(query);
    
    // For chat functionality, we don't need heavy caching as we want real-time data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Xử lý trường hợp không có recordset
    if (!result || !result.recordset) {
      return res.json({
        data: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          pageSize: parseInt(limit)
        },
        success: true
      });
    }
    
    // Tính toán thông tin phân trang
    const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Format user data for chat functionality
    const userData = result.recordset.map(user => {
      // Determine status: respect user.Status flag first
      let finalStatus = 'OFFLINE';
      if (user.Status === 'ONLINE') {
        // Only show as online if status flag is ONLINE and presence suggests online
        if (
          user.PresenceStatus === 'online' ||
          user.PresenceStatus === 'ONLINE' ||
          user.OnlineStatus === 'ONLINE' ||
          (user.LastActiveTime && new Date() - new Date(user.LastActiveTime) < 900000)
        ) {
          finalStatus = 'ONLINE';
        }
      }
      
      return {
        UserID: user.UserID,
        Username: user.Username || '',
        Email: user.Email || '',
        FullName: user.FullName || '',
        Image: user.Image || null,
        Role: user.Role || 'user',
        AccountStatus: user.AccountStatus || 'ACTIVE',
        Status: finalStatus, // Use the calculated status that reflects real-time presence
        ProfilePictureUrl: user.Image || null,
        LastActive: user.LastActiveTime || user.LastLoginAt || null,
        // Additional fields needed for chat.sql schema compatibility
        DisplayName: user.FullName || user.Username || user.Email || 'User'
      };
    });
    
    // For better compatibility with different frontend formats,
    // provide both data (object with pagination) and a flat array
    const response = {
      data: userData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      },
      success: true,
      timestamp: new Date().toISOString()
    };
    
    // If the client is specifically requesting just the array (for chat)
    if (req.query.format === 'array') {
      res.json(userData);
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    
    // Return empty array for chat compatibility
    if (req.query.format === 'array') {
      res.json([]);
    } else {
      // Structured response with pagination
      res.json({
        data: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: parseInt(req.query.page || 1),
          pageSize: parseInt(req.query.limit || 1000)
        },
        success: false,
        message: 'Đã xảy ra lỗi khi xử lý yêu cầu',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Hàm tìm kiếm người dùng
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự',
        users: []
      });
    }
    
    await pool.connect();
    const request = pool.request();
    
    // Query để tìm kiếm người dùng
    const query = `
      SELECT TOP 10
        UserID as id,
        Email as email,
        FullName as fullName,
        Username as username,
        Image as avatar,
        CASE 
          WHEN DATEDIFF(MINUTE, LastLoginAt, GETDATE()) < 20 THEN 'ONLINE' 
          ELSE 'OFFLINE' 
        END AS status
      FROM Users 
      WHERE 
        (Email LIKE @searchTerm OR
        FullName LIKE @searchTerm OR
        Username LIKE @searchTerm) AND
        DeletedAt IS NULL AND
        AccountStatus = 'ACTIVE' AND
        UserID <> @currentUserId
      ORDER BY 
        CASE WHEN FullName LIKE @exactStart THEN 1
             WHEN Username LIKE @exactStart THEN 2
             ELSE 3 
        END,
        FullName
    `;
    
    request.input('searchTerm', sql.NVarChar, `%${q}%`);
    request.input('exactStart', sql.NVarChar, `${q}%`);
    request.input('currentUserId', sql.BigInt, req.user.userId); // Don't include current user
    
    const result = await request.query(query);
    
    // Return formatted user data
    return res.json({
      users: result.recordset || [],
      success: true
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi tìm kiếm người dùng',
      users: []
    });
  }
};

// Hàm lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'ID người dùng không hợp lệ' 
      });
    }
    
    await pool.connect();
    const request = pool.request();
    
    // Query để lấy thông tin người dùng theo ID
    const query = `
      SELECT 
        UserID, Username, Email, FullName, 
        PhoneNumber, DateOfBirth, School,
        Address, City, Country, Role, Image,
        Status, AccountStatus, EmailVerified,
        CreatedAt, UpdatedAt, LastLoginAt
      FROM Users 
      WHERE UserID = @UserID AND DeletedAt IS NULL;
    `;
    
    // Bind parameters
    request.input('UserID', sql.BigInt, userId);
    
    const result = await request.query(query);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Format dates before sending response
    const userData = result.recordset[0];
    if (userData.DateOfBirth) {
      userData.DateOfBirth = userData.DateOfBirth.toISOString().split('T')[0];
    }
    if (userData.CreatedAt) {
      userData.CreatedAt = userData.CreatedAt.toISOString();
    }
    if (userData.UpdatedAt) {
      userData.UpdatedAt = userData.UpdatedAt.toISOString();
    }
    if (userData.LastLoginAt) {
      userData.LastLoginAt = userData.LastLoginAt.toISOString();
    }
    
    res.json(userData);
    
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message 
    });
  }
};

// Hàm gợi ý bạn bè
exports.suggestFriends = async (req, res) => {
  try {
    const currentUserId = req.user.userId; // Assuming userId is attached by auth middleware

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await pool.connect(); // Ensure connection pool is ready
    const request = pool.request();

    const query = `
      SELECT TOP 15
          u.UserID as id,
          u.FullName as fullName,
          u.Username as username,
          u.Image as avatar
      FROM Users u
      WHERE
          u.UserID <> @currentUserId AND
          u.DeletedAt IS NULL AND -- Check Users table for deleted users
          u.AccountStatus = 'ACTIVE' AND
          u.UserID NOT IN (
              -- Users who are already friends (ACCEPTED)
              SELECT FriendID FROM Friendships WHERE UserID = @currentUserId AND Status = 'ACCEPTED'
              UNION
              SELECT UserID FROM Friendships WHERE FriendID = @currentUserId AND Status = 'ACCEPTED'
              UNION
              -- Users who have a pending request FROM the current user
              SELECT FriendID FROM Friendships WHERE UserID = @currentUserId AND Status = 'PENDING'
              UNION
              -- Users who have sent a pending request TO the current user
              SELECT UserID FROM Friendships WHERE FriendID = @currentUserId AND Status = 'PENDING'
              -- Add UNION for blocked users if applicable (using Status = 'BLOCKED')
              -- UNION
              -- SELECT FriendID FROM Friendships WHERE UserID = @currentUserId AND Status = 'BLOCKED'
              -- UNION
              -- SELECT UserID FROM Friendships WHERE FriendID = @currentUserId AND Status = 'BLOCKED'
          )
      ORDER BY NEWID(); -- SQL Server function for random ordering
    `;

    request.input('currentUserId', sql.BigInt, currentUserId);

    const result = await request.query(query);

    return res.json({
      suggestions: result.recordset || [],
      success: true
    });

  } catch (error) {
    console.error('Error suggesting friends:', error);
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi gợi ý bạn bè',
      suggestions: []
    });
  }
};

// Hàm cập nhật thông tin hồ sơ cá nhân của người dùng
exports.updateUserProfile = async (req, res) => {
  try {
    await pool.connect();
    const transaction = new sql.Transaction(pool);
    
    // Get userId from authenticated token
    const { userId } = req.user;
    const profileData = req.body;
    
    await transaction.begin();

    try {
      // First, get the current user profile data
      const currentProfileRequest = new sql.Request(transaction);
      currentProfileRequest.input('UserID', sql.BigInt, userId);
      const currentProfileResult = await currentProfileRequest.query(`
        SELECT 
          Education, WorkExperience, Skills, 
          Interests, SocialLinks, Achievements
        FROM UserProfiles 
        WHERE UserID = @UserID
      `);
      
      // Parse existing profile data if it exists
      let currentEducation = [];
      let currentWorkExperience = [];
      let currentSkills = [];
      let currentInterests = [];
      let currentSocialLinks = {};
      let currentAchievements = [];
      
      if (currentProfileResult.recordset && currentProfileResult.recordset.length > 0) {
        const currentProfile = currentProfileResult.recordset[0];
        try {
          if (currentProfile.Education) currentEducation = JSON.parse(currentProfile.Education);
          if (currentProfile.WorkExperience) currentWorkExperience = JSON.parse(currentProfile.WorkExperience);
          if (currentProfile.Skills) currentSkills = JSON.parse(currentProfile.Skills);
          if (currentProfile.Interests) currentInterests = JSON.parse(currentProfile.Interests);
          if (currentProfile.SocialLinks) currentSocialLinks = JSON.parse(currentProfile.SocialLinks);
          if (currentProfile.Achievements) currentAchievements = JSON.parse(currentProfile.Achievements);
        } catch (parseError) {
          console.error('Lỗi khi parse dữ liệu hồ sơ hiện tại:', parseError);
        }
      }
      
      // Cập nhật thông tin cơ bản trong bảng Users (chỉ khi có trường được cung cấp)
      const shouldUpdateUser = [
        'fullName',
        'school',
        'bio',
        'image',
        'address',
        'phoneNumber',
        'dateOfBirth',
        'city',
        'country'
      ].some(key => Object.prototype.hasOwnProperty.call(profileData, key));
      
      if (shouldUpdateUser) {
        const userRequest = new sql.Request(transaction);
        userRequest
          .input('UserID', sql.BigInt, userId)
          .input('FullName', sql.NVarChar(100), profileData.fullName)
          .input('School', sql.NVarChar(255), profileData.school || null)
          .input('Bio', sql.NVarChar(500), profileData.bio || null)
          .input('Image', sql.VarChar(255), profileData.image || null)
          .input('Address', sql.NVarChar(255), profileData.address || null)
          .input('PhoneNumber', sql.VarChar(15), profileData.phoneNumber || null)
          .input('DateOfBirth', sql.Date, profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null)
          .input('City', sql.NVarChar(100), profileData.city || null)
          .input('Country', sql.NVarChar(100), profileData.country || null);

        await userRequest.query(`
          UPDATE Users
          SET 
            FullName = ISNULL(@FullName, FullName),
            School = ISNULL(@School, School),
            Bio = ISNULL(@Bio, Bio),
            Image = ISNULL(@Image, Image),
            Address = ISNULL(@Address, Address),
            PhoneNumber = ISNULL(@PhoneNumber, PhoneNumber),
            DateOfBirth = ISNULL(@DateOfBirth, DateOfBirth),
            City = ISNULL(@City, City),
            Country = ISNULL(@Country, Country),
            UpdatedAt = GETDATE()
          WHERE UserID = @UserID;
        `);
      }

      // Kiểm tra xem đã có UserProfile chưa
      const checkRequest = new sql.Request(transaction);
      checkRequest.input('UserID', sql.BigInt, userId);
      const profileCheck = await checkRequest.query(`
        SELECT ProfileID FROM UserProfiles WHERE UserID = @UserID
      `);

      // Prepare the data for update, preserving existing data when not provided
      const education = profileData.hasOwnProperty('education') ? profileData.education : currentEducation;
      const workExperience = profileData.hasOwnProperty('workExperience') ? profileData.workExperience : currentWorkExperience;
      const skills = profileData.hasOwnProperty('skills') ? profileData.skills : currentSkills;
      const interests = profileData.hasOwnProperty('interests') ? profileData.interests : currentInterests;
      const socialLinks = profileData.hasOwnProperty('socialLinks') ? profileData.socialLinks : currentSocialLinks;
      const achievements = profileData.hasOwnProperty('achievements') ? profileData.achievements : currentAchievements;

      // Cập nhật hoặc tạo mới UserProfile
      const profileRequest = new sql.Request(transaction);
      profileRequest
        .input('UserID', sql.BigInt, userId)
        .input('Education', sql.NVarChar(sql.MAX), JSON.stringify(education))
        .input('WorkExperience', sql.NVarChar(sql.MAX), JSON.stringify(workExperience))
        .input('Skills', sql.NVarChar(sql.MAX), JSON.stringify(skills))
        .input('Interests', sql.NVarChar(sql.MAX), JSON.stringify(interests))
        .input('SocialLinks', sql.NVarChar(sql.MAX), JSON.stringify(socialLinks))
        .input('Achievements', sql.NVarChar(sql.MAX), JSON.stringify(achievements))
        .input('PreferredLanguage', sql.VarChar(10), profileData.preferredLanguage || 'vi')
        .input('TimeZone', sql.VarChar(50), profileData.timeZone || 'Asia/Ho_Chi_Minh');

      if (profileCheck.recordset && profileCheck.recordset.length > 0) {
        // Update existing profile
        await profileRequest.query(`
          UPDATE UserProfiles
          SET 
            Education = @Education,
            WorkExperience = @WorkExperience,
            Skills = @Skills,
            Interests = @Interests,
            SocialLinks = @SocialLinks,
            Achievements = @Achievements,
            PreferredLanguage = @PreferredLanguage,
            TimeZone = @TimeZone,
            UpdatedAt = GETDATE()
          WHERE UserID = @UserID;
        `);
      } else {
        // Create new profile
        await profileRequest.query(`
          INSERT INTO UserProfiles (
            UserID, Education, WorkExperience, Skills, 
            Interests, SocialLinks, Achievements, 
            PreferredLanguage, TimeZone
          ) VALUES (
            @UserID, @Education, @WorkExperience, @Skills, 
            @Interests, @SocialLinks, @Achievements, 
            @PreferredLanguage, @TimeZone
          );
        `);
      }

      // Lấy thông tin đã cập nhật
      const finalRequest = new sql.Request(transaction);
      finalRequest.input('UserID', sql.BigInt, userId);
      const result = await finalRequest.query(`
        SELECT 
          u.UserID, u.Username, u.Email, u.FullName, u.School,
          u.Bio, u.Image, u.Status, u.AccountStatus, u.PhoneNumber,
          u.Address, u.City, u.Country, u.DateOfBirth,
          up.Education, up.WorkExperience, up.Skills, 
          up.Interests, up.SocialLinks, up.Achievements, 
          up.PreferredLanguage, up.TimeZone
        FROM Users u
        LEFT JOIN UserProfiles up ON u.UserID = up.UserID
        WHERE u.UserID = @UserID;
      `);

      // Commit transaction
      await transaction.commit();

      if (!result.recordset || result.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      // Format data before sending response
      const userData = result.recordset[0];
      
      // Parse JSON fields
      try {
        if (userData.Education) userData.Education = JSON.parse(userData.Education);
        if (userData.WorkExperience) userData.WorkExperience = JSON.parse(userData.WorkExperience);
        if (userData.Skills) userData.Skills = JSON.parse(userData.Skills);
        if (userData.Interests) userData.Interests = JSON.parse(userData.Interests);
        if (userData.SocialLinks) userData.SocialLinks = JSON.parse(userData.SocialLinks);
        if (userData.Achievements) userData.Achievements = JSON.parse(userData.Achievements);
      } catch (parseError) {
        console.error('Lỗi khi parse JSON:', parseError);
      }

      res.json({
        message: 'Cập nhật hồ sơ thành công',
        profile: userData,
        success: true
      });

    } catch (transactionError) {
      // Nếu có lỗi, rollback toàn bộ thay đổi
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ người dùng:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật thông tin hồ sơ',
      error: error.message,
      success: false
    });
  }
};

// Hàm lấy thông tin hồ sơ đầy đủ của người dùng
exports.getUserProfile = async (req, res) => {
  try {
    await pool.connect();
    
    // Lấy userId từ token hoặc từ tham số
    const userId = req.params.userId || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    
    const request = pool.request();
    request.input('UserID', sql.BigInt, userId);
    
    const result = await request.query(`
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.School,
        u.Bio, u.Image, u.Status, u.AccountStatus,
        u.PhoneNumber, u.Address, u.City, u.Country, u.DateOfBirth,
        u.CreatedAt,
        up.Education, up.WorkExperience, up.Skills, 
        up.Interests, up.SocialLinks, up.Achievements, 
        up.PreferredLanguage, up.TimeZone
      FROM Users u
      LEFT JOIN UserProfiles up ON u.UserID = up.UserID
      WHERE u.UserID = @UserID AND u.DeletedAt IS NULL;
    `);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin hồ sơ người dùng' });
    }
    
    const userData = result.recordset[0];
    
    // Parse JSON fields
    try {
      if (userData.Education) userData.Education = JSON.parse(userData.Education);
      if (userData.WorkExperience) userData.WorkExperience = JSON.parse(userData.WorkExperience);
      if (userData.Skills) userData.Skills = JSON.parse(userData.Skills);
      if (userData.Interests) userData.Interests = JSON.parse(userData.Interests);
      if (userData.SocialLinks) userData.SocialLinks = JSON.parse(userData.SocialLinks);
      if (userData.Achievements) userData.Achievements = JSON.parse(userData.Achievements);
    } catch (parseError) {
      console.error('Lỗi khi parse JSON:', parseError);
    }
    
    // Format dates
    if (userData.DateOfBirth) {
      userData.DateOfBirth = userData.DateOfBirth.toISOString().split('T')[0];
    }
    if (userData.CreatedAt) {
      userData.CreatedAt = userData.CreatedAt.toISOString();
    }
    
    res.json({
      profile: userData,
      success: true
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy thông tin hồ sơ người dùng:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin hồ sơ',
      error: error.message,
      success: false
    });
  }
};