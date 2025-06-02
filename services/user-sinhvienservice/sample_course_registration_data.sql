-- Insert sample data for testing the Course Registration feature

-- Insert sample semester data if not exists
IF NOT EXISTS (SELECT * FROM Semesters)
BEGIN
    INSERT INTO Semesters (SemesterCode, SemesterName, AcademicYear, StartDate, EndDate, RegistrationStartDate, RegistrationEndDate, Status, IsCurrent)
    VALUES 
        ('HK1-2324', N'Học kỳ 1', '2023-2024', '2023-08-15', '2023-12-31', '2023-08-01', '2023-08-10', 'Completed', 0),
        ('HK2-2324', N'Học kỳ 2', '2023-2024', '2024-01-15', '2024-05-15', '2024-01-01', '2024-01-10', 'Ongoing', 1),
        ('HK3-2324', N'Học kỳ 3', '2023-2024', '2024-06-01', '2024-07-31', '2024-05-15', '2024-05-25', 'Upcoming', 0);
END

-- Insert sample subjects if not exists
IF NOT EXISTS (SELECT * FROM Subjects)
BEGIN
    INSERT INTO Subjects (SubjectCode, SubjectName, Credits, TheoryCredits, PracticeCredits, Prerequisites, Description, Department, Faculty, IsRequired, IsActive)
    VALUES
        ('CS101', N'Nhập môn lập trình', 3, 2, 1, NULL, N'Giới thiệu về lập trình với ngôn ngữ C++', N'Khoa học máy tính', N'Công nghệ thông tin', 1, 1),
        ('CS102', N'Cấu trúc dữ liệu và giải thuật', 4, 3, 1, 'CS101', N'Học về các cấu trúc dữ liệu cơ bản và thuật toán', N'Khoa học máy tính', N'Công nghệ thông tin', 1, 1),
        ('CS103', N'Lập trình hướng đối tượng', 3, 2, 1, 'CS101', N'Nguyên lý của lập trình hướng đối tượng với Java', N'Khoa học máy tính', N'Công nghệ thông tin', 1, 1),
        ('MATH101', N'Giải tích 1', 4, 4, 0, NULL, N'Đạo hàm, tích phân và ứng dụng', N'Toán học', N'Khoa học cơ bản', 1, 1),
        ('MATH102', N'Đại số tuyến tính', 3, 3, 0, NULL, N'Ma trận, không gian vector và ứng dụng', N'Toán học', N'Khoa học cơ bản', 1, 1),
        ('PHY101', N'Vật lý đại cương 1', 4, 3, 1, NULL, N'Cơ học và nhiệt học', N'Vật lý', N'Khoa học cơ bản', 1, 1),
        ('ENG101', N'Tiếng Anh chuyên ngành CNTT', 3, 3, 0, NULL, N'Tiếng Anh chuyên ngành cho sinh viên CNTT', N'Ngoại ngữ', N'Khoa học xã hội và nhân văn', 1, 1);
END

-- Insert sample teachers if they don't exist
IF NOT EXISTS (SELECT * FROM Users WHERE Role = 'TEACHER')
BEGIN
    INSERT INTO Users (Username, Email, Password, FullName, Role, Status, AccountStatus)
    VALUES 
        ('teacher1', 'teacher1@example.com', '$2a$10$ABCDEF', N'TS. Nguyễn Văn A', 'TEACHER', 'ONLINE', 'ACTIVE'),
        ('teacher2', 'teacher2@example.com', '$2a$10$ABCDEF', N'TS. Trần Thị B', 'TEACHER', 'ONLINE', 'ACTIVE'),
        ('teacher3', 'teacher3@example.com', '$2a$10$ABCDEF', N'PGS.TS. Phạm Văn C', 'TEACHER', 'ONLINE', 'ACTIVE');
END

-- Get teacher IDs
DECLARE @Teacher1ID BIGINT = (SELECT UserID FROM Users WHERE Username = 'teacher1');
DECLARE @Teacher2ID BIGINT = (SELECT UserID FROM Users WHERE Username = 'teacher2');
DECLARE @Teacher3ID BIGINT = (SELECT UserID FROM Users WHERE Username = 'teacher3');

-- Get semester IDs
DECLARE @Semester1ID BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK1-2324');
DECLARE @Semester2ID BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK2-2324');
DECLARE @Semester3ID BIGINT = (SELECT SemesterID FROM Semesters WHERE SemesterCode = 'HK3-2324');

-- Insert sample course classes if not exists
IF NOT EXISTS (SELECT * FROM CourseClasses)
BEGIN
    -- Get subject IDs
    DECLARE @CS101ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'CS101');
    DECLARE @CS102ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'CS102');
    DECLARE @CS103ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'CS103');
    DECLARE @MATH101ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'MATH101');
    DECLARE @MATH102ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'MATH102');
    DECLARE @PHY101ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'PHY101');
    DECLARE @ENG101ID BIGINT = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'ENG101');
    
    -- Insert course classes - Học kỳ 1
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, 
                               StartDate, EndDate, Schedule, Location, Status, Type)
    VALUES 
        ('CS101-01', @CS101ID, @Semester1ID, @Teacher1ID, 40, 35, '2023-08-15', '2023-12-31', 
         '{"days":["Monday","Wednesday"],"timeSlots":[{"start":"07:30","end":"09:00"}]}', N'A101', 'Completed', 'Regular'),
        ('MATH101-01', @MATH101ID, @Semester1ID, @Teacher2ID, 45, 43, '2023-08-15', '2023-12-31', 
         '{"days":["Tuesday","Thursday"],"timeSlots":[{"start":"09:15","end":"10:45"}]}', N'B203', 'Completed', 'Regular'),
        ('PHY101-01', @PHY101ID, @Semester1ID, @Teacher3ID, 40, 38, '2023-08-15', '2023-12-31', 
         '{"days":["Monday","Friday"],"timeSlots":[{"start":"13:00","end":"14:30"}]}', N'C305', 'Completed', 'Regular');
         
    -- Insert course classes - Học kỳ 2 (current)
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, 
                               StartDate, EndDate, Schedule, Location, Status, Type)
    VALUES 
        ('CS102-01', @CS102ID, @Semester2ID, @Teacher1ID, 35, 30, '2024-01-15', '2024-05-15', 
         '{"days":["Tuesday","Thursday"],"timeSlots":[{"start":"07:30","end":"09:00"}]}', N'A102', 'Ongoing', 'Regular'),
        ('CS103-01', @CS103ID, @Semester2ID, @Teacher2ID, 35, 33, '2024-01-15', '2024-05-15', 
         '{"days":["Monday","Wednesday"],"timeSlots":[{"start":"09:15","end":"10:45"}]}', N'A103', 'Ongoing', 'Regular'),
        ('MATH102-01', @MATH102ID, @Semester2ID, @Teacher3ID, 45, 42, '2024-01-15', '2024-05-15', 
         '{"days":["Wednesday","Friday"],"timeSlots":[{"start":"13:00","end":"14:30"}]}', N'B204', 'Ongoing', 'Regular'),
        ('ENG101-01', @ENG101ID, @Semester2ID, @Teacher2ID, 40, 38, '2024-01-15', '2024-05-15', 
         '{"days":["Tuesday","Thursday"],"timeSlots":[{"start":"15:00","end":"16:30"}]}', N'D105', 'Registration', 'Regular');
         
    -- Insert course classes - Học kỳ 3
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, 
                               StartDate, EndDate, Schedule, Location, Status, Type)
    VALUES 
        ('CS101-S', @CS101ID, @Semester3ID, @Teacher1ID, 30, 0, '2024-06-01', '2024-07-31', 
         '{"days":["Monday","Tuesday","Wednesday","Thursday"],"timeSlots":[{"start":"08:00","end":"10:00"}]}', N'A104', 'Planned', 'Regular'),
        ('MATH101-S', @MATH101ID, @Semester3ID, @Teacher3ID, 35, 0, '2024-06-01', '2024-07-31', 
         '{"days":["Monday","Tuesday","Wednesday","Thursday"],"timeSlots":[{"start":"13:00","end":"15:00"}]}', N'B205', 'Planned', 'Regular');
END

-- Insert sample student users if they don't exist
IF NOT EXISTS (SELECT * FROM Users WHERE Role = 'STUDENT' AND Username = 'student1')
BEGIN
    INSERT INTO Users (Username, Email, Password, FullName, Role, Status, AccountStatus)
    VALUES ('student1', 'student1@example.com', '$2a$10$ABCDEF', N'Nguyễn Văn Học', 'STUDENT', 'ONLINE', 'ACTIVE');
END

-- Get the student ID
DECLARE @StudentID BIGINT = (SELECT UserID FROM Users WHERE Username = 'student1');

-- Get class IDs
DECLARE @Class1ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'CS101-01');
DECLARE @Class2ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'MATH101-01');
DECLARE @Class3ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'PHY101-01');
DECLARE @Class4ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'CS102-01');
DECLARE @Class5ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'CS103-01');
DECLARE @Class6ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'MATH102-01');
DECLARE @Class7ID BIGINT = (SELECT ClassID FROM CourseClasses WHERE ClassCode = 'ENG101-01');

-- Insert sample course registrations if not exists
IF NOT EXISTS (SELECT * FROM CourseRegistrations WHERE UserID = @StudentID)
BEGIN
    -- Past semester registrations (HK1)
    INSERT INTO CourseRegistrations (UserID, ClassID, RegistrationType, Status, AdminApproval, ApprovedAt)
    VALUES
        (@StudentID, @Class1ID, 'Regular', 'Approved', 1, '2023-08-05T10:15:00'),
        (@StudentID, @Class2ID, 'Regular', 'Approved', 1, '2023-08-05T10:15:00'),
        (@StudentID, @Class3ID, 'Regular', 'Approved', 1, '2023-08-05T10:15:00');
    
    -- Current semester registrations (HK2)
    INSERT INTO CourseRegistrations (UserID, ClassID, RegistrationType, Status, AdminApproval, ApprovedAt)
    VALUES
        (@StudentID, @Class4ID, 'Regular', 'Approved', 1, '2024-01-05T09:30:00'),
        (@StudentID, @Class5ID, 'Regular', 'Approved', 1, '2024-01-05T09:30:00'),
        (@StudentID, @Class6ID, 'Regular', 'Pending', 0, NULL),
        (@StudentID, @Class7ID, 'Regular', 'Approved', 1, '2024-01-05T09:30:00');
END 