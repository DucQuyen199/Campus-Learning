/*-----------------------------------------------------------------
* File: eventController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool, sql } = require('../config/db');

exports.getAllEvents = async (req, res) => {
  try {
    console.log('Received request for events with query:', req.query);
    
    const { category, difficulty, status } = req.query;
    let query = `
      SELECT EventID, Title, Description, Category, 
             CONVERT(VARCHAR, EventDate, 23) as EventDate,
             CONVERT(VARCHAR, EventTime, 108) as EventTime,
             Location, ImageUrl, MaxAttendees, CurrentAttendees,
             Price, Organizer, Difficulty, Status
      FROM Events 
      WHERE DeletedAt IS NULL
    `;

    const params = [];
    if (category && category !== 'all') {
      query += ` AND Category = @category`;
      params.push({ name: 'category', value: category });
    }
    if (difficulty && difficulty !== 'all') {
      query += ` AND Difficulty = @difficulty`;
      params.push({ name: 'difficulty', value: difficulty });
    }
    if (status && status !== 'all') {
      query += ` AND Status = @status`;
      params.push({ name: 'status', value: status });
    }

    query += ` ORDER BY EventDate ASC`;
    console.log('Executing SQL query:', query);
    console.log('With parameters:', params);

    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, sql.VarChar, param.value);
    });

    const result = await request.query(query);
    console.log('Query result:', result.recordset);

    const formattedEvents = result.recordset.map(event => ({
      ...event,
      Price: parseFloat(event.Price) || 0,
      MaxAttendees: parseInt(event.MaxAttendees) || 0,
      CurrentAttendees: parseInt(event.CurrentAttendees) || 0
    }));

    console.log('Sending formatted events:', formattedEvents);
    res.json(formattedEvents);
  } catch (error) {
    console.error('Error in getAllEvents:', error);
    res.status(500).json({
      message: 'Lỗi khi tải danh sách sự kiện',
      error: error.message,
      data: []
    });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const query = `
      SELECT * FROM Events 
      WHERE DeletedAt IS NULL 
      AND Status = 'upcoming'
      AND EventDate >= GETDATE()
      ORDER BY EventDate ASC
    `;
    
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({
      message: 'Lỗi khi tải sự kiện sắp diễn ra',
      error: error.message
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the base event details
    const eventResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @id AND DeletedAt IS NULL
      `);

    if (!eventResult.recordset[0]) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }

    const event = eventResult.recordset[0];

    // Get event schedule
    const scheduleResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM EventSchedule
        WHERE EventID = @id
        ORDER BY StartTime ASC
      `);
    
    // Get event prizes
    const prizesResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM EventPrizes
        WHERE EventID = @id
        ORDER BY Rank ASC
      `);
    
    // Get programming languages
    const languagesResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT Language FROM EventProgrammingLanguages
        WHERE EventID = @id
      `);
    
    // Get technologies
    const technologiesResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT Technology FROM EventTechnologies
        WHERE EventID = @id
      `);

    // Combine all data
    const completeEvent = {
      ...event,
      schedule: scheduleResult.recordset,
      prizes: prizesResult.recordset,
      languages: languagesResult.recordset,
      technologies: technologiesResult.recordset
    };

    res.json(completeEvent);
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({
      message: 'Lỗi khi tải thông tin sự kiện',
      error: error.message
    });
  }
};

exports.registerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Log request data
    console.log('Event registration request:', {
      eventId: id,
      userId: userId,
      body: req.body
    });

    // Extract additional data from request
    const { teamName = '' } = req.body;

    // Kiểm tra sự kiện tồn tại
    const eventResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @id 
        AND DeletedAt IS NULL
        AND Status = 'upcoming'
      `);

    const event = eventResult.recordset[0];
    if (!event) {
      return res.status(404).json({ message: 'Sự kiện không tồn tại hoặc đã kết thúc' });
    }

    // Kiểm tra số lượng người tham gia
    if (event.CurrentAttendees >= event.MaxAttendees) {
      return res.status(400).json({ message: 'Sự kiện đã đủ số lượng người tham gia' });
    }

    // Kiểm tra người dùng đã đăng ký chưa
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT * FROM EventParticipants 
        WHERE EventID = @eventId AND UserID = @userId
      `);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Bạn đã đăng ký sự kiện này' });
    }

    // Thêm người tham gia với thông tin bổ sung (chỉ dùng những trường thực sự có trong schema)
    await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .input('teamName', sql.NVarChar(100), teamName)
      .query(`
        INSERT INTO EventParticipants (EventID, UserID, TeamName, Status, PaymentStatus, AttendanceStatus)
        VALUES (@eventId, @userId, @teamName, 'registered', 'pending', 'pending')
      `);

    // Cập nhật số lượng người tham gia
    await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        UPDATE Events 
        SET CurrentAttendees = CurrentAttendees + 1
        WHERE EventID = @id
      `);

    res.json({ 
      success: true,
      message: 'Đăng ký sự kiện thành công',
      eventId: id,
      userId: userId
    });
  } catch (error) {
    console.error('Error registering event:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký sự kiện',
      error: error.message
    });
  }
};

exports.getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT u.UserID, u.Username, u.FullName, u.Email,
               ep.RegistrationDate, ep.Status, ep.PaymentStatus, ep.AttendanceStatus
        FROM EventParticipants ep
        JOIN Users u ON ep.UserID = u.UserID
        WHERE ep.EventID = @id
        ORDER BY ep.RegistrationDate DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting event participants:', error);
    res.status(500).json({
      message: 'Lỗi khi tải danh sách người tham gia',
      error: error.message
    });
  }
};

exports.getEventSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM EventSchedule
        WHERE EventID = @id
        ORDER BY StartTime ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting event schedule:', error);
    res.status(500).json({
      message: 'Lỗi khi tải lịch trình sự kiện',
      error: error.message
    });
  }
};

exports.getEventPrizes = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM EventPrizes
        WHERE EventID = @id
        ORDER BY Rank ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting event prizes:', error);
    res.status(500).json({
      message: 'Lỗi khi tải thông tin giải thưởng',
      error: error.message
    });
  }
};

exports.getEventTechnologies = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT Technology 
        FROM EventTechnologies
        WHERE EventID = @id
      `);

    res.json(result.recordset.map(record => record.Technology));
  } catch (error) {
    console.error('Error getting event technologies:', error);
    res.status(500).json({
      message: 'Lỗi khi tải danh sách công nghệ',
      error: error.message
    });
  }
};

exports.getProgrammingLanguages = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT Language 
        FROM EventProgrammingLanguages
        WHERE EventID = @id
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting programming languages:', error);
    res.status(500).json({
      message: 'Lỗi khi tải danh sách ngôn ngữ lập trình',
      error: error.message
    });
  }
};

exports.getEventAchievements = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT a.AchievementID, a.Position, a.Points, a.BadgeType, a.AwardedAt,
               u.UserID, u.Username, u.FullName, u.Image
        FROM EventAchievements a
        JOIN Users u ON a.UserID = u.UserID
        WHERE a.EventID = @id
        ORDER BY a.Position ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting event achievements:', error);
    res.status(500).json({
      message: 'Lỗi khi tải thành tích sự kiện',
      error: error.message
    });
  }
};

exports.cancelEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Kiểm tra xem người dùng đã đăng ký sự kiện này chưa
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT * FROM EventParticipants 
        WHERE EventID = @eventId AND UserID = @userId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Bạn chưa đăng ký sự kiện này' });
    }

    // Kiểm tra sự kiện tồn tại và chưa diễn ra
    const eventResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @id 
        AND DeletedAt IS NULL
        AND Status = 'upcoming'
      `);

    const event = eventResult.recordset[0];
    if (!event) {
      return res.status(400).json({ message: 'Không thể hủy đăng ký sự kiện đã bắt đầu hoặc kết thúc' });
    }

    // Xóa đăng ký
    await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        DELETE FROM EventParticipants 
        WHERE EventID = @eventId AND UserID = @userId
      `);

    // Cập nhật số lượng người tham gia
    await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        UPDATE Events 
        SET CurrentAttendees = CurrentAttendees - 1
        WHERE EventID = @id
      `);

    res.json({ message: 'Hủy đăng ký sự kiện thành công' });
  } catch (error) {
    console.error('Error canceling event registration:', error);
    res.status(500).json({
      message: 'Lỗi khi hủy đăng ký sự kiện',
      error: error.message
    });
  }
};

exports.checkEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log('Checking registration status for user:', userId, 'event:', id);

    // Kiểm tra xem người dùng đã đăng ký sự kiện này chưa
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT * FROM EventParticipants 
        WHERE EventID = @eventId AND UserID = @userId
      `);

    const isRegistered = checkResult.recordset.length > 0;
    
    // Thêm thông tin chi tiết về log để debug
    console.log('Registration check result:', {
      isRegistered,
      records: checkResult.recordset.length,
      userData: checkResult.recordset[0] || null
    });
    
    // Trả về đúng định dạng kết quả mà frontend cần
    res.json({ 
      isRegistered, 
      registrationInfo: isRegistered ? checkResult.recordset[0] : null 
    });
  } catch (error) {
    console.error('Error checking event registration:', error);
    res.status(500).json({
      message: 'Lỗi khi kiểm tra đăng ký sự kiện',
      error: error.message
    });
  }
};

// Implement other controller methods... 
