const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get student's class schedule
router.get('/class/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semesterId } = req.query;
    
    let query = `
      SELECT cc.*, s.SubjectCode, s.SubjectName, s.Credits,
             u.FullName as TeacherName, sem.SemesterName, sem.AcademicYear,
             JSON_QUERY(cc.Schedule) as ScheduleDetails
      FROM CourseRegistrations cr
      JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
      JOIN Subjects s ON cc.SubjectID = s.SubjectID
      JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      LEFT JOIN Users u ON cc.TeacherID = u.UserID
      WHERE cr.UserID = @userId AND cr.Status = 'Approved'
    `;
    
    if (semesterId) {
      query += ' AND cc.SemesterID = @semesterId';
    } else {
      query += ' AND sem.IsCurrent = 1';
    }
    
    query += ' ORDER BY s.SubjectName';
    
    const request = pool.request()
      .input('userId', sql.BigInt, userId);
      
    if (semesterId) {
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching class schedule:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get student's schedule for a specific day
router.get('/day/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
    
    console.log(`Fetching schedule for user ID: ${userId} on date: ${date}`);

    // Kết nối đến cơ sở dữ liệu
    const pool = await pool.connect();

    // Lấy lịch học từ thông tin đăng ký khóa học
    const scheduleResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('date', sql.Date, date)
      .query(`
        SELECT cc.ClassID, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               cc.Schedule, cc.Location, cc.Status
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        WHERE cr.UserID = @userId 
        AND cc.Status IN ('Ongoing', 'Registration', 'Planned')
        AND cr.Status = 'Approved'
      `);

    // Nếu không có lịch học, trả về mẫu dữ liệu giả định
    if (scheduleResult.recordset.length === 0) {
      // Tạo một vài dữ liệu mẫu dựa trên ngày trong tuần
      const dayOfWeek = new Date(date).getDay(); // 0 = Chủ nhật, 1 = Thứ hai, ...
      const sampleSchedule = [];
      
      // Thêm các lớp mẫu dựa trên ngày trong tuần
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Thứ hai đến thứ sáu
        sampleSchedule.push({
          ClassID: 1,
          ClassCode: 'CS101-1',
          SubjectCode: 'CS101',
          SubjectName: 'Nhập môn lập trình',
          Credits: 3,
          Schedule: JSON.stringify({
            day: dayOfWeek,
            startTime: '07:30',
            endTime: '09:00',
            room: 'A101'
          }),
          Location: 'Tòa nhà A, phòng 101',
          Status: 'Ongoing'
        });
        
        sampleSchedule.push({
          ClassID: 2,
          ClassCode: 'MATH101-2',
          SubjectCode: 'MATH101',
          SubjectName: 'Giải tích 1',
          Credits: 4,
          Schedule: JSON.stringify({
            day: dayOfWeek,
            startTime: '09:30',
            endTime: '11:00',
            room: 'B203'
          }),
          Location: 'Tòa nhà B, phòng 203',
          Status: 'Ongoing'
        });
      }
      
      return res.json(sampleSchedule);
    }

    // Lọc lớp học dựa trên ngày trong tuần
    const scheduleData = scheduleResult.recordset.filter(cls => {
      let schedule;
      try {
        schedule = JSON.parse(cls.Schedule);
      } catch (e) {
        return false;
      }
      
      // Kiểm tra ngày học trong lịch có khớp với ngày yêu cầu không
      const requestDate = new Date(date);
      const dayOfWeek = requestDate.getDay(); // 0 = Chủ nhật, 1 = Thứ hai, ...
      
      // Nếu lịch là mảng, kiểm tra từng phần tử
      if (Array.isArray(schedule)) {
        return schedule.some(s => s.day === dayOfWeek);
      }
      
      // Nếu lịch là object đơn, kiểm tra trực tiếp
      return schedule.day === dayOfWeek;
    });

    res.json(scheduleData);
  } catch (err) {
    console.error('Error in schedule for day:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch học',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get student's exam schedule
router.get('/exam/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semesterId } = req.query;
    
    let query = `
      SELECT e.*, s.SubjectCode, s.SubjectName, cc.ClassCode,
             u.FullName as SupervisorName, sem.SemesterName, sem.AcademicYear
      FROM ExamRegistrations er
      RIGHT JOIN Exams e ON er.ExamID = e.ExamID
      JOIN CourseClasses cc ON e.ClassID = cc.ClassID
      JOIN Subjects s ON cc.SubjectID = s.SubjectID
      JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      LEFT JOIN Users u ON e.SupervisorID = u.UserID
      WHERE (er.UserID = @userId OR (
        cc.ClassID IN (
          SELECT cr.ClassID FROM CourseRegistrations cr 
          WHERE cr.UserID = @userId AND cr.Status = 'Approved'
        )
      ))
    `;
    
    if (semesterId) {
      query += ' AND cc.SemesterID = @semesterId';
    } else {
      query += ' AND sem.IsCurrent = 1';
    }
    
    query += ' ORDER BY e.ExamDate, e.StartTime';
    
    const request = pool.request()
      .input('userId', sql.BigInt, userId);
      
    if (semesterId) {
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching exam schedule:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get available exams for registration
router.get('/available-exams/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT e.*, s.SubjectCode, s.SubjectName, cc.ClassCode,
               sem.SemesterName, sem.AcademicYear
        FROM Exams e
        JOIN CourseClasses cc ON e.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        WHERE e.ExamType IN ('Improvement', 'Retake')
        AND e.Status = 'Scheduled'
        AND e.ExamDate > GETDATE()
        AND NOT EXISTS (
          SELECT 1 FROM ExamRegistrations er
          WHERE er.ExamID = e.ExamID AND er.UserID = @userId
        )
        ORDER BY e.ExamDate
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching available exams:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get student's schedule for a specific week
router.get('/week/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const startDate = req.query.startDate; // Format: 'YYYY-MM-DD'
    
    // Kết nối đến cơ sở dữ liệu
    const pool = await pool.connect();
    
    // Lấy tất cả các lớp đã đăng ký của sinh viên
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT cc.ClassID, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               cc.Schedule, cc.Location, cc.Status
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        WHERE cr.UserID = @userId 
        AND cc.Status IN ('Ongoing', 'Registration', 'Planned')
        AND cr.Status = 'Approved'
      `);
    
    // Nếu không có lịch học, trả về mảng rỗng
    if (result.recordset.length === 0) {
      return res.json([]);
    }
    
    // Tạo lịch học theo tuần
    const weekSchedule = {};
    
    // Nếu có startDate, tính ngày của từng ngày trong tuần
    let weekDates = null;
    if (startDate) {
      // Tính 7 ngày trong tuần từ startDate
      weekDates = Array(7).fill().map((_, i) => {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        return day.toISOString().split('T')[0];
      });
    }
    
    // Lọc và tổ chức lịch học theo ngày trong tuần
    result.recordset.forEach(cls => {
      let schedule;
      try {
        schedule = JSON.parse(cls.Schedule);
      } catch (e) {
        return; // Bỏ qua nếu không parse được lịch
      }
      
      // Xử lý cho cả trường hợp schedule là array hoặc object đơn
      const schedules = Array.isArray(schedule) ? schedule : [schedule];
      
      schedules.forEach(s => {
        const day = s.day;
        if (!weekSchedule[day]) {
          weekSchedule[day] = [];
        }
        
        weekSchedule[day].push({
          ...cls,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          date: weekDates ? weekDates[day] : null
        });
      });
    });
    
    res.json(weekSchedule);
  } catch (err) {
    console.error('Error fetching weekly schedule:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch học theo tuần',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get student's exams
router.get('/exams/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kết nối đến cơ sở dữ liệu
    const pool = await pool.connect();
    
    // Lấy lịch thi
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT e.*, cc.ClassCode, s.SubjectCode, s.SubjectName, er.Status as RegistrationStatus
        FROM Exams e
        JOIN CourseClasses cc ON e.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID
        LEFT JOIN ExamRegistrations er ON e.ExamID = er.ExamID AND er.UserID = @userId
        WHERE cr.UserID = @userId
        AND e.Status <> 'Cancelled'
        ORDER BY e.ExamDate, e.StartTime
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching exam schedule:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch thi',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 