/*-----------------------------------------------------------------
* File: teacherController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { poolPromise, sql } = require('../config/database');

const teacherController = {
    // Lấy danh sách khóa học của giáo viên
    getTeacherCourses: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('teacherId', req.user.UserID)
                .query(`
                    SELECT c.*, 
                           COUNT(DISTINCT ce.UserID) as StudentCount,
                           AVG(CAST(ce.Rating as FLOAT)) as AverageRating
                    FROM Courses c
                    LEFT JOIN CourseEnrollments ce ON c.CourseID = ce.CourseID
                    WHERE c.InstructorID = @teacherId
                    GROUP BY c.CourseID, c.Title, c.Description, c.Status, 
                             c.CreatedAt, c.UpdatedAt, c.Price, c.Slug, c.ImageUrl
                `);

            res.json(result.recordset);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // Lấy chi tiết khóa học và thống kê
    getCourseDetail: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('courseId', req.params.id)
                .input('teacherId', req.user.UserID)
                .query(`
                    SELECT c.*,
                           COUNT(DISTINCT ce.UserID) as TotalStudents,
                           COUNT(DISTINCT cm.ModuleID) as TotalModules,
                           COUNT(DISTINCT cl.LessonID) as TotalLessons
                    FROM Courses c
                    LEFT JOIN CourseEnrollments ce ON c.CourseID = ce.CourseID
                    LEFT JOIN CourseModules cm ON c.CourseID = cm.CourseID
                    LEFT JOIN CourseLessons cl ON cm.ModuleID = cl.ModuleID
                    WHERE c.CourseID = @courseId AND c.InstructorID = @teacherId
                    GROUP BY c.CourseID, c.Title, c.Description, c.Status,
                             c.CreatedAt, c.UpdatedAt, c.Price, c.Slug, c.ImageUrl,
                             c.Requirements, c.Objectives, c.Level, c.Duration
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy khóa học' });
            }

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // Lấy danh sách học sinh trong khóa học
    getCourseStudents: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('courseId', req.params.id)
                .input('teacherId', req.user.UserID)
                .query(`
                    SELECT u.UserID, u.Username, u.Email,
                           ce.EnrollmentDate, ce.Status,
                           COUNT(DISTINCT lp.LessonID) as CompletedLessons
                    FROM Users u
                    JOIN CourseEnrollments ce ON u.UserID = ce.UserID
                    LEFT JOIN LessonProgress lp ON ce.EnrollmentID = lp.EnrollmentID
                    WHERE ce.CourseID = @courseId
                    AND EXISTS (
                        SELECT 1 FROM Courses c 
                        WHERE c.CourseID = ce.CourseID 
                        AND c.InstructorID = @teacherId
                    )
                    GROUP BY u.UserID, u.Username, u.Email, 
                             ce.EnrollmentDate, ce.Status
                `);

            res.json(result.recordset);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },
    
    // Lấy tiến độ của học sinh trong khóa học
    getStudentProgress: async (req, res) => {
        try {
            const { id: courseId, studentId } = req.params;
            const pool = await poolPromise;
            
            // Verify teacher has access to this course
            const accessCheck = await pool.request()
                .input('courseId', courseId)
                .input('teacherId', req.user.UserID)
                .query(`
                    SELECT COUNT(*) as HasAccess
                    FROM Courses
                    WHERE CourseID = @courseId 
                    AND InstructorID = @teacherId
                    AND DeletedAt IS NULL
                `);
            
            if (accessCheck.recordset[0].HasAccess === 0) {
                return res.status(403).json({ message: 'Bạn không có quyền truy cập khóa học này' });
            }
            
            // Get enrollment details
            const enrollmentResult = await pool.request()
                .input('courseId', courseId)
                .input('studentId', studentId)
                .query(`
                    SELECT ce.EnrollmentID, ce.Status, ce.Progress, ce.EnrollmentDate, 
                           ce.CompletionDate, ce.LastAccessedAt, ce.LastAccessedLessonID
                    FROM CourseEnrollments ce
                    WHERE ce.CourseID = @courseId AND ce.UserID = @studentId
                `);
            
            if (enrollmentResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Học sinh không đăng ký khóa học này' });
            }
            
            const enrollment = enrollmentResult.recordset[0];
            
            // Get all modules and lessons
            const modulesResult = await pool.request()
                .input('courseId', courseId)
                .query(`
                    SELECT m.ModuleID, m.Title, m.Description, m.OrderIndex
                    FROM Modules m
                    WHERE m.CourseID = @courseId
                    ORDER BY m.OrderIndex
                `);
            
            // Get all lessons
            const lessonsResult = await pool.request()
                .input('courseId', courseId)
                .query(`
                    SELECT l.LessonID, l.ModuleID, l.Title, l.Type, l.OrderIndex
                    FROM Lessons l
                    JOIN Modules m ON l.ModuleID = m.ModuleID
                    WHERE m.CourseID = @courseId
                    ORDER BY m.OrderIndex, l.OrderIndex
                `);
            
            // Get completed lessons
            const progressResult = await pool.request()
                .input('studentId', studentId)
                .input('courseId', courseId)
                .query(`
                    SELECT lp.LessonID, lp.Status, lp.CompletedAt, lp.TimeSpent
                    FROM LessonProgress lp
                    JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
                    WHERE ce.UserID = @studentId AND ce.CourseID = @courseId
                `);
            
            // Structure the data
            const modules = modulesResult.recordset.map(module => {
                const moduleLessons = lessonsResult.recordset
                    .filter(lesson => lesson.ModuleID === module.ModuleID)
                    .map(lesson => {
                        const progress = progressResult.recordset
                            .find(p => p.LessonID === lesson.LessonID);
                        
                        return {
                            ...lesson,
                            Completed: progress ? progress.Status === 'completed' : false,
                            CompletedAt: progress ? progress.CompletedAt : null,
                            TimeSpent: progress ? progress.TimeSpent : 0
                        };
                    });
                
                return {
                    ...module,
                    Lessons: moduleLessons,
                    CompletedLessons: moduleLessons.filter(l => l.Completed).length,
                    TotalLessons: moduleLessons.length
                };
            });
            
            res.json({
                enrollment,
                modules,
                totalLessons: lessonsResult.recordset.length,
                completedLessons: progressResult.recordset.filter(p => p.Status === 'completed').length
            });
        } catch (error) {
            console.error('Error getting student progress:', error);
            res.status(500).json({ message: 'Lỗi server khi tải tiến độ học sinh' });
        }
    },

    // Thống kê tổng quan cho giáo viên
    getTeacherStats: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('teacherId', req.user.UserID)
                .query(`
                    SELECT 
                        (SELECT COUNT(DISTINCT CourseID) 
                         FROM Courses 
                         WHERE InstructorID = @teacherId) as TotalCourses,
                        
                        (SELECT COUNT(DISTINCT ce.UserID)
                         FROM CourseEnrollments ce
                         JOIN Courses c ON ce.CourseID = c.CourseID
                         WHERE c.InstructorID = @teacherId) as TotalStudents,
                        
                        (SELECT AVG(CAST(Rating as FLOAT))
                         FROM CourseEnrollments ce
                         JOIN Courses c ON ce.CourseID = c.CourseID
                         WHERE c.InstructorID = @teacherId) as AverageRating
                `);

            res.json(result.recordset[0]);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    /**
     * Get teacher profile details
     */
    getTeacherProfile: async (req, res) => {
        try {
            // Support both naming conventions
            const userId = req.user.userId || req.user.UserID;

            if (!userId) {
                return res.status(401).json({ message: 'User ID not found in token' });
            }

            const pool = await poolPromise;
            
            // Query user details with joined profile information
            const result = await pool.request()
                .input('userId', sql.BigInt, userId)
                .query(`
                    SELECT u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
                           u.School, u.Role, u.Status, u.AccountStatus, 
                           u.Image, u.Avatar, u.Bio, u.PhoneNumber, u.Address, 
                           u.City, u.Country, u.LastLoginAt, u.CreatedAt,
                           up.Education, up.WorkExperience, up.Skills, 
                           up.Interests, up.SocialLinks, up.Achievements
                    FROM Users u
                    LEFT JOIN UserProfiles up ON u.UserID = up.UserID
                    WHERE u.UserID = @userId 
                    AND u.AccountStatus = 'ACTIVE'
                    AND (u.Role = 'TEACHER' OR u.Role = 'ADMIN')
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ message: 'Teacher profile not found' });
            }

            // Format the teacher data
            const teacher = result.recordset[0];
            
            console.log(`Profile data fetched for user ${userId}:`, {
                name: teacher.FullName,
                email: teacher.Email,
                role: teacher.Role
            });

            // Format the date fields
            if (teacher.DateOfBirth) {
                teacher.DateOfBirth = new Date(teacher.DateOfBirth).toISOString().split('T')[0];
            }
            
            // Parse JSON fields that are stored as strings
            try {
                if (teacher.SocialLinks && typeof teacher.SocialLinks === 'string') {
                    teacher.SocialLinks = JSON.parse(teacher.SocialLinks);
                }
                if (teacher.Achievements && typeof teacher.Achievements === 'string') {
                    teacher.Achievements = JSON.parse(teacher.Achievements);
                }
            } catch (err) {
                console.warn('Error parsing JSON fields:', err);
            }

            return res.status(200).json({ teacher });
        } catch (error) {
            console.error('Error fetching teacher profile:', error.message, error.stack);
            return res.status(500).json({ message: 'Error fetching teacher profile' });
        }
    },

    /**
     * Update teacher profile details
     */
    updateTeacherProfile: async (req, res) => {
        try {
            // Support both naming conventions
            const userId = req.user.userId || req.user.UserID;
            
            if (!userId) {
                return res.status(401).json({ message: 'User ID not found in token' });
            }

            const {
                FullName, Bio, DateOfBirth, School,
                PhoneNumber, Address, City, Country
            } = req.body;

            const pool = await poolPromise;
            
            // Start transaction to update both tables
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Update the Users table
                await transaction.request()
                    .input('userId', sql.BigInt, userId)
                    .input('fullName', sql.NVarChar(100), FullName)
                    .input('bio', sql.NVarChar(500), Bio)
                    .input('dateOfBirth', sql.Date, DateOfBirth ? new Date(DateOfBirth) : null)
                    .input('school', sql.NVarChar(255), School)
                    .input('phoneNumber', sql.VarChar(15), PhoneNumber)
                    .input('address', sql.NVarChar(255), Address)
                    .input('city', sql.NVarChar(100), City)
                    .input('country', sql.NVarChar(100), Country)
                    .query(`
                        UPDATE Users
                        SET FullName = @fullName,
                            Bio = @bio,
                            DateOfBirth = @dateOfBirth,
                            School = @school,
                            PhoneNumber = @phoneNumber,
                            Address = @address,
                            City = @city,
                            Country = @country,
                            UpdatedAt = GETDATE()
                        WHERE UserID = @userId
                        AND (Role = 'TEACHER' OR Role = 'ADMIN')
                    `);
                
                console.log(`Updated profile for user ${userId}`);

                // Check if UserProfile exists and upsert accordingly
                const profileCheck = await transaction.request()
                    .input('userId', sql.BigInt, userId)
                    .query(`SELECT ProfileID FROM UserProfiles WHERE UserID = @userId`);

                if (profileCheck.recordset.length === 0) {
                    // Create new profile
                    await transaction.request()
                        .input('userId', sql.BigInt, userId)
                        .query(`
                            INSERT INTO UserProfiles (UserID, UpdatedAt)
                            VALUES (@userId, GETDATE())
                        `);
                    console.log(`Created new UserProfile for user ${userId}`);
                }
                
                await transaction.commit();
                
                // Return updated user data
                const updatedUser = await pool.request()
                    .input('userId', sql.BigInt, userId)
                    .query(`
                        SELECT UserID, Username, Email, FullName, DateOfBirth,
                               School, Role, Status, AccountStatus, 
                               Image, Avatar, Bio, PhoneNumber, Address, 
                               City, Country
                        FROM Users
                        WHERE UserID = @userId
                    `);
                
                return res.status(200).json({ 
                    message: 'Profile updated successfully',
                    teacher: updatedUser.recordset[0]
                });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            console.error('Error updating teacher profile:', error.message, error.stack);
            return res.status(500).json({ message: 'Error updating teacher profile' });
        }
    }
};

module.exports = teacherController; 
