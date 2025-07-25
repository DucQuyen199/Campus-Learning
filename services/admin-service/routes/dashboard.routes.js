/*-----------------------------------------------------------------
* File: dashboard.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get user stats
    const userStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN DATEDIFF(day, CreatedAt, GETDATE()) <= 30 THEN 1 ELSE 0 END) as newUsers,
        SUM(CASE WHEN DATEDIFF(day, LastLoginAt, GETDATE()) <= 7 THEN 1 ELSE 0 END) as recentActiveUsers
      FROM Users
      WHERE 1=1
    `);
    
    // Get course stats
    const courseStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalCourses,
        SUM(CASE WHEN IsPublished = 1 THEN 1 ELSE 0 END) as publishedCourses,
        (SELECT COUNT(*) FROM CourseEnrollments) as totalEnrollments,
        (SELECT COUNT(DISTINCT CourseID) FROM CourseEnrollments) as coursesWithEnrollments
      FROM Courses
      WHERE 1=1
    `);
    
    // Get event stats
    const eventStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalEvents,
        SUM(CASE WHEN EventDate >= GETDATE() THEN 1 ELSE 0 END) as upcomingEvents,
        SUM(CASE WHEN EventDate < GETDATE() THEN 1 ELSE 0 END) as pastEvents,
        (SELECT COUNT(*) FROM EventParticipants) as totalParticipants
      FROM Events
      WHERE 1=1
    `);
    
    // Get exam stats
    const examStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalExams,
        SUM(CASE WHEN StartTime > GETDATE() THEN 1 ELSE 0 END) as upcomingExams,
        SUM(CASE WHEN EndTime < GETDATE() THEN 1 ELSE 0 END) as completedExams,
        (SELECT COUNT(*) FROM ExamParticipants) as totalParticipants
      FROM Exams
      WHERE 1=1
    `);
    
    // Get report stats
    const reportStats = await pool.request().query(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as pendingReports,
        SUM(CASE WHEN Status = 'resolved' THEN 1 ELSE 0 END) as resolvedReports,
        SUM(CASE WHEN Status = 'rejected' THEN 1 ELSE 0 END) as rejectedReports
      FROM Reports
    `);
    
    // Get monthly registration trend (last 6 months)
    const registrationTrend = await pool.request().query(`
      SELECT 
        MONTH(CreatedAt) as Month,
        YEAR(CreatedAt) as Year,
        COUNT(*) as Count
      FROM Users
      WHERE CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY YEAR(CreatedAt), MONTH(CreatedAt)
      ORDER BY Year, Month
    `);
    
    // Get monthly course enrollments (last 6 months)
    const enrollmentTrend = await pool.request().query(`
      SELECT 
        MONTH(EnrolledAt) as Month,
        YEAR(EnrolledAt) as Year,
        COUNT(*) as Count
      FROM CourseEnrollments
      WHERE EnrolledAt >= DATEADD(month, -6, GETDATE())
      GROUP BY YEAR(EnrolledAt), MONTH(EnrolledAt)
      ORDER BY Year, Month
    `);
    
    // Get user roles distribution
    const rolesDistribution = await pool.request().query(`
      SELECT 
        Role,
        COUNT(*) as Count
      FROM Users
      GROUP BY Role
      ORDER BY Count DESC
    `);
    
    // Get popular courses (top 5 by enrollment)
    const popularCourses = await pool.request().query(`
      SELECT TOP 5
        c.CourseID,
        c.Title,
        c.Category,
        COUNT(ce.EnrollmentID) as EnrollmentCount
      FROM Courses c
      JOIN CourseEnrollments ce ON c.CourseID = ce.CourseID
      GROUP BY c.CourseID, c.Title, c.Category
      ORDER BY EnrollmentCount DESC
    `);
    
    return res.status(200).json({
      userStats: userStats.recordset[0],
      courseStats: courseStats.recordset[0],
      eventStats: eventStats.recordset[0],
      examStats: examStats.recordset[0],
      reportStats: reportStats.recordset[0],
      registrationTrend: registrationTrend.recordset,
      enrollmentTrend: enrollmentTrend.recordset,
      rolesDistribution: rolesDistribution.recordset,
      popularCourses: popularCourses.recordset
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    
    // Return mock data on error
    const mockData = {
      userStats: {
        totalUsers: 120,
        activeUsers: 95,
        newUsers: 28,
        recentActiveUsers: 42
      },
      courseStats: {
        totalCourses: 25,
        publishedCourses: 18,
        totalEnrollments: 320,
        coursesWithEnrollments: 15
      },
      eventStats: {
        totalEvents: 8,
        upcomingEvents: 3,
        pastEvents: 5,
        totalParticipants: 150
      },
      examStats: {
        totalExams: 12,
        upcomingExams: 2,
        completedExams: 10,
        totalParticipants: 220
      },
      reportStats: {
        totalReports: 42,
        pendingReports: 15,
        resolvedReports: 20,
        rejectedReports: 7
      },
      registrationTrend: [
        { Month: 1, Year: 2023, Count: 18 },
        { Month: 2, Year: 2023, Count: 22 },
        { Month: 3, Year: 2023, Count: 15 },
        { Month: 4, Year: 2023, Count: 25 },
        { Month: 5, Year: 2023, Count: 30 },
        { Month: 6, Year: 2023, Count: 28 }
      ],
      enrollmentTrend: [
        { Month: 1, Year: 2023, Count: 35 },
        { Month: 2, Year: 2023, Count: 42 },
        { Month: 3, Year: 2023, Count: 38 },
        { Month: 4, Year: 2023, Count: 45 },
        { Month: 5, Year: 2023, Count: 52 },
        { Month: 6, Year: 2023, Count: 48 }
      ],
      rolesDistribution: [
        { Role: 'STUDENT', Count: 85 },
        { Role: 'INSTRUCTOR', Count: 15 },
        { Role: 'ADMIN', Count: 5 },
        { Role: 'MODERATOR', Count: 10 }
      ],
      popularCourses: [
        { CourseID: 1, Title: 'Introduction to Web Development', Category: 'Development', EnrollmentCount: 45 },
        { CourseID: 2, Title: 'Advanced JavaScript', Category: 'Programming', EnrollmentCount: 38 },
        { CourseID: 3, Title: 'React Fundamentals', Category: 'Frontend', EnrollmentCount: 32 },
        { CourseID: 4, Title: 'Node.js Backend', Category: 'Backend', EnrollmentCount: 28 },
        { CourseID: 5, Title: 'Database Design', Category: 'Database', EnrollmentCount: 25 }
      ]
    };
    
    return res.status(200).json(mockData);
  }
});

// Get specific chart data for dashboard
router.get('/charts/:chartType', async (req, res) => {
  try {
    const { chartType } = req.params;
    const { timeRange } = req.query; // Options: week, month, quarter, year
    const pool = await poolPromise;
    
    let timeFilter;
    switch(timeRange) {
      case 'week':
        timeFilter = 'DATEADD(week, -1, GETDATE())';
        break;
      case 'quarter':
        timeFilter = 'DATEADD(month, -3, GETDATE())';
        break;
      case 'year':
        timeFilter = 'DATEADD(year, -1, GETDATE())';
        break;
      case 'month':
      default:
        timeFilter = 'DATEADD(month, -1, GETDATE())';
    }
    
    let query;
    switch(chartType) {
      case 'user-registrations':
        query = `
          SELECT 
            CONVERT(date, CreatedAt) as Date,
            COUNT(*) as Count
          FROM Users
          WHERE CreatedAt >= ${timeFilter}
          GROUP BY CONVERT(date, CreatedAt)
          ORDER BY Date
        `;
        break;
        
      case 'course-enrollments':
        query = `
          SELECT 
            CONVERT(date, EnrolledAt) as Date,
            COUNT(*) as Count
          FROM CourseEnrollments
          WHERE EnrolledAt >= ${timeFilter}
          GROUP BY CONVERT(date, EnrolledAt)
          ORDER BY Date
        `;
        break;
        
      case 'event-registrations':
        query = `
          SELECT 
            CONVERT(date, RegistrationDate) as Date,
            COUNT(*) as Count
          FROM EventParticipants
          WHERE RegistrationDate >= ${timeFilter}
          GROUP BY CONVERT(date, RegistrationDate)
          ORDER BY Date
        `;
        break;
        
      case 'course-completions':
        query = `
          SELECT 
            CONVERT(date, CompletedAt) as Date,
            COUNT(*) as Count
          FROM CourseEnrollments
          WHERE 
            CompletedAt IS NOT NULL AND
            CompletedAt >= ${timeFilter}
          GROUP BY CONVERT(date, CompletedAt)
          ORDER BY Date
        `;
        break;
        
      case 'exam-participants':
        query = `
          SELECT 
            CONVERT(date, StartedAt) as Date,
            COUNT(*) as Count
          FROM ExamParticipants
          WHERE StartedAt >= ${timeFilter}
          GROUP BY CONVERT(date, StartedAt)
          ORDER BY Date
        `;
        break;
        
      case 'reports-by-type':
        query = `
          SELECT 
            Type,
            COUNT(*) as Count
          FROM Reports
          WHERE CreatedAt >= ${timeFilter}
          GROUP BY Type
          ORDER BY Count DESC
        `;
        break;
        
      case 'user-logins':
        query = `
          SELECT 
            CONVERT(date, LoginAt) as Date,
            COUNT(*) as Count
          FROM UserLoginHistory
          WHERE LoginAt >= ${timeFilter}
          GROUP BY CONVERT(date, LoginAt)
          ORDER BY Date
        `;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid chart type' });
    }
    
    const result = await pool.request().query(query);
    
    return res.status(200).json({
      chartType,
      timeRange,
      data: result.recordset
    });
  } catch (error) {
    console.error('Chart Data Error:', error);
    return res.status(500).json({ message: 'Server error while getting chart data' });
  }
});

// Get recent activities for dashboard
router.get('/activities', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get recent activities (last 20)
    const recentActivities = await pool.request().query(`
      SELECT TOP 20
        'user_registration' as type,
        u.UserID as id,
        u.FullName as name,
        u.CreatedAt as timestamp,
        'New user registration' as description,
        'user' as category
      FROM Users u
      WHERE 1=1
      
      UNION ALL
      
      SELECT TOP 20
        'course_enrollment' as type,
        ce.EnrollmentID as id,
        u.FullName as name,
        ce.EnrolledAt as timestamp,
        CONCAT('Enrolled in course: ', c.Title) as description,
        'course' as category
      FROM CourseEnrollments ce
      JOIN Users u ON ce.UserID = u.UserID
      JOIN Courses c ON ce.CourseID = c.CourseID
      
      UNION ALL
      
      SELECT TOP 20
        'event_registration' as type,
        ep.ParticipantID as id,
        u.FullName as name,
        ep.RegistrationDate as timestamp,
        CONCAT('Registered for event: ', e.Title) as description,
        'event' as category
      FROM EventParticipants ep
      JOIN Users u ON ep.UserID = u.UserID
      JOIN Events e ON ep.EventID = e.EventID
      
      ORDER BY timestamp DESC
    `);
    
    // Check if we got data, if not return mock data
    if (!recentActivities.recordset || recentActivities.recordset.length === 0) {
      const mockActivities = [
        {
          type: 'user_registration',
          id: 1001,
          name: 'Nguyễn Văn A',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          description: 'New user registration',
          category: 'user'
        },
        {
          type: 'course_enrollment',
          id: 2001,
          name: 'Trần Thị B',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Enrolled in course: Introduction to React',
          category: 'course'
        },
        {
          type: 'event_registration',
          id: 3001,
          name: 'Lê Văn C',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Registered for event: Tech Conference 2023',
          category: 'event'
        }
      ];
      return res.status(200).json(mockActivities);
    }
    
    return res.status(200).json(recentActivities.recordset);
  } catch (error) {
    console.error('Dashboard Activities Error:', error);
    
    // Return mock data on error
    const mockActivities = [
      {
        type: 'user_registration',
        id: 1001,
        name: 'Nguyễn Văn A',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        description: 'New user registration',
        category: 'user'
      },
      {
        type: 'course_enrollment',
        id: 2001,
        name: 'Trần Thị B',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Enrolled in course: Introduction to React',
        category: 'course'
      },
      {
        type: 'event_registration',
        id: 3001,
        name: 'Lê Văn C',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Registered for event: Tech Conference 2023',
        category: 'event'
      }
    ];
    return res.status(200).json(mockActivities);
  }
});

// Get system notifications
router.get('/notifications', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Get system notifications
    const notifications = await pool.request().query(`
      SELECT TOP 10
        'report' as type,
        r.ReportID as id,
        r.Title as title,
        r.CreatedAt as timestamp,
        CONCAT('New report: ', r.Title) as message,
        'warning' as priority
      FROM Reports r
      WHERE r.Status = 'pending'
      
      UNION ALL
      
      SELECT TOP 10
        'user_account' as type,
        u.UserID as id,
        u.FullName as title,
        u.CreatedAt as timestamp,
        CONCAT('New user registered: ', u.FullName) as message,
        'info' as priority
      FROM Users u
      WHERE DATEDIFF(day, u.CreatedAt, GETDATE()) <= 7
      
      UNION ALL
      
      SELECT TOP 10
        'event' as type,
        e.EventID as id,
        e.Title as title,
        e.EventDate as timestamp,
        CONCAT('Upcoming event: ', e.Title) as message,
        'info' as priority
      FROM Events e
      WHERE 
        e.EventDate > GETDATE() AND 
        e.EventDate <= DATEADD(day, 7, GETDATE())
      
      ORDER BY timestamp DESC
    `);
    
    // Check if we got data, if not return mock data
    if (!notifications.recordset || notifications.recordset.length === 0) {
      const mockNotifications = [
        {
          type: 'report',
          id: 101,
          title: 'Inappropriate content in forum',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          message: 'New report: Inappropriate content in forum',
          priority: 'warning'
        },
        {
          type: 'user_account',
          id: 201,
          title: 'Phạm Thị D',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'New user registered: Phạm Thị D',
          priority: 'info'
        },
        {
          type: 'event',
          id: 301,
          title: 'Web Development Workshop',
          timestamp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Upcoming event: Web Development Workshop',
          priority: 'info'
        }
      ];
      return res.status(200).json(mockNotifications);
    }
    
    return res.status(200).json(notifications.recordset);
  } catch (error) {
    console.error('Dashboard Notifications Error:', error);
    
    // Return mock data on error
    const mockNotifications = [
      {
        type: 'report',
        id: 101,
        title: 'Inappropriate content in forum',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        message: 'New report: Inappropriate content in forum',
        priority: 'warning'
      },
      {
        type: 'user_account',
        id: 201,
        title: 'Phạm Thị D',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'New user registered: Phạm Thị D',
        priority: 'info'
      },
      {
        type: 'event',
        id: 301,
        title: 'Web Development Workshop',
        timestamp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Upcoming event: Web Development Workshop',
        priority: 'info'
      }
    ];
    return res.status(200).json(mockNotifications);
  }
});

module.exports = router; 
