const { poolPromise } = require('../config/database');

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
    }
};

module.exports = teacherController; 