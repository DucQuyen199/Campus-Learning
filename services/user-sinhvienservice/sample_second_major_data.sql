USE campushubt;
GO

-- Add sample academic programs
-- Only run this if you don't already have programs
IF NOT EXISTS (SELECT 1 FROM AcademicPrograms WHERE ProgramCode = 'CS')
BEGIN
    INSERT INTO AcademicPrograms (
        ProgramCode, 
        ProgramName, 
        Department, 
        Faculty, 
        Description, 
        TotalCredits, 
        ProgramDuration, 
        DegreeName, 
        ProgramType, 
        IsActive
    )
    VALUES
    ('CS', 'Khoa học máy tính', 'Khoa học máy tính', 'Công nghệ thông tin', 
     'Chương trình đào tạo Khoa học máy tính cung cấp kiến thức nền tảng về thuật toán, cấu trúc dữ liệu, và lý thuyết tính toán.', 
     150, 8, 'Cử nhân', 'Regular', 1),
    
    ('SE', 'Kỹ thuật phần mềm', 'Kỹ thuật phần mềm', 'Công nghệ thông tin', 
     'Chương trình đào tạo Kỹ thuật phần mềm tập trung vào quy trình phát triển phần mềm, kiểm thử và bảo trì hệ thống phần mềm.', 
     145, 8, 'Cử nhân', 'Regular', 1),
    
    ('IS', 'Hệ thống thông tin', 'Hệ thống thông tin', 'Công nghệ thông tin', 
     'Chương trình đào tạo Hệ thống thông tin tập trung vào thiết kế, phát triển và quản lý các hệ thống thông tin trong doanh nghiệp.', 
     140, 8, 'Cử nhân', 'Regular', 1),
    
    ('BA', 'Quản trị kinh doanh', 'Quản trị kinh doanh', 'Kinh tế', 
     'Chương trình đào tạo Quản trị kinh doanh cung cấp kiến thức và kỹ năng quản lý, marketing, tài chính và chiến lược kinh doanh.', 
     135, 8, 'Cử nhân', 'Regular', 1),
    
    ('FIN', 'Tài chính - Ngân hàng', 'Tài chính - Ngân hàng', 'Kinh tế', 
     'Chương trình đào tạo Tài chính - Ngân hàng cung cấp kiến thức về thị trường tài chính, ngân hàng, đầu tư và quản lý rủi ro.', 
     130, 8, 'Cử nhân', 'Regular', 1),
    
    ('ENG', 'Ngôn ngữ Anh', 'Ngôn ngữ Anh', 'Ngoại ngữ', 
     'Chương trình đào tạo Ngôn ngữ Anh tập trung vào phát triển kỹ năng ngôn ngữ, văn hóa và giao tiếp liên văn hóa.', 
     125, 8, 'Cử nhân', 'Regular', 1),
    
    ('ME', 'Kỹ thuật cơ khí', 'Kỹ thuật cơ khí', 'Cơ khí', 
     'Chương trình đào tạo Kỹ thuật cơ khí cung cấp kiến thức về thiết kế, sản xuất và bảo trì hệ thống cơ khí.', 
     160, 8, 'Kỹ sư', 'Regular', 1)
END;

-- Add sample semester data if not exists
IF NOT EXISTS (SELECT 1 FROM Semesters WHERE SemesterCode = 'HK12023')
BEGIN
    INSERT INTO Semesters (
        SemesterCode, 
        SemesterName, 
        AcademicYear, 
        StartDate, 
        EndDate, 
        RegistrationStartDate, 
        RegistrationEndDate, 
        Status, 
        IsCurrent
    )
    VALUES
    ('HK12023', 'Học kỳ 1', '2023-2024', '2023-09-01', '2024-01-15', '2023-08-01', '2023-08-15', 'Completed', 0),
    ('HK22023', 'Học kỳ 2', '2023-2024', '2024-01-30', '2024-05-30', '2024-01-10', '2024-01-25', 'Completed', 0),
    ('HK12024', 'Học kỳ 1', '2024-2025', '2024-09-01', '2025-01-15', '2024-08-01', '2024-08-15', 'Ongoing', 1);
END;

-- Add sample academic metrics for students
-- This is for testing eligibility
INSERT INTO AcademicMetrics (
    UserID, 
    SemesterID, 
    TotalCredits, 
    EarnedCredits, 
    SemesterGPA, 
    CumulativeGPA, 
    AcademicStanding, 
    CreditsRegistered
)
SELECT 
    u.UserID,
    (SELECT TOP 1 SemesterID FROM Semesters WHERE IsCurrent = 1),
    CASE 
        WHEN u.UserID % 3 = 0 THEN 25  -- Below credit requirement
        ELSE 40                         -- Above credit requirement
    END,
    CASE 
        WHEN u.UserID % 3 = 0 THEN 25
        ELSE 40
    END,
    CASE 
        WHEN u.UserID % 4 = 0 THEN 2.2  -- Low GPA
        WHEN u.UserID % 4 = 1 THEN 3.5  -- High GPA
        WHEN u.UserID % 4 = 2 THEN 2.8  -- Medium GPA
        ELSE 3.0                        -- Average GPA
    END,
    CASE 
        WHEN u.UserID % 4 = 0 THEN 2.2  -- Low GPA
        WHEN u.UserID % 4 = 1 THEN 3.5  -- High GPA
        WHEN u.UserID % 4 = 2 THEN 2.8  -- Medium GPA
        ELSE 3.0                        -- Average GPA
    END,
    CASE 
        WHEN u.UserID % 4 = 0 THEN 'Warning'
        ELSE 'Good Standing'
    END,
    CASE 
        WHEN u.UserID % 3 = 0 THEN 15
        ELSE 18
    END
FROM Users u
WHERE u.Role = 'STUDENT'
  AND NOT EXISTS (
    SELECT 1 FROM AcademicMetrics am 
    WHERE am.UserID = u.UserID 
    AND am.SemesterID = (SELECT TOP 1 SemesterID FROM Semesters WHERE IsCurrent = 1)
  );

-- Add some sample second major registrations
-- These are for demo purposes to show different states
INSERT INTO SecondMajorRegistrations (
    UserID,
    ProgramID,
    RegistrationDate,
    CurrentGPA,
    CompletedCredits,
    Reason,
    Status,
    StartSemesterID,
    CreatedAt,
    UpdatedAt
)
SELECT TOP 5
    u.UserID,
    (SELECT TOP 1 ProgramID FROM AcademicPrograms WHERE ProgramCode = 'FIN'),
    DATEADD(DAY, -CAST(RAND(CHECKSUM(NEWID())) * 30 AS INT), GETDATE()),
    3.2,
    45,
    'Tôi muốn học thêm ngành Tài chính để bổ sung kiến thức về lĩnh vực tài chính cho công việc trong tương lai.',
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY NEWID()) = 1 THEN 'Approved'
        WHEN ROW_NUMBER() OVER (ORDER BY NEWID()) = 2 THEN 'Rejected'
        WHEN ROW_NUMBER() OVER (ORDER BY NEWID()) = 3 THEN 'Cancelled'
        ELSE 'Pending'
    END,
    (SELECT TOP 1 SemesterID FROM Semesters WHERE IsCurrent = 1),
    GETDATE(),
    GETDATE()
FROM Users u
WHERE u.Role = 'STUDENT'
  AND NOT EXISTS (SELECT 1 FROM SecondMajorRegistrations sm WHERE sm.UserID = u.UserID)
  AND EXISTS (SELECT 1 FROM AcademicMetrics am WHERE am.UserID = u.UserID AND am.CumulativeGPA >= 2.5)
ORDER BY NEWID();

-- Update some registrations with review information
UPDATE TOP (2) SecondMajorRegistrations
SET 
    ReviewedBy = (SELECT TOP 1 UserID FROM Users WHERE Role = 'ADMIN' ORDER BY NEWID()),
    ReviewedAt = DATEADD(DAY, -CAST(RAND(CHECKSUM(NEWID())) * 10 AS INT), GETDATE()),
    Comments = CASE 
        WHEN Status = 'Approved' THEN 'Hồ sơ đạt yêu cầu. Sinh viên đủ điều kiện học ngành 2.'
        WHEN Status = 'Rejected' THEN 'Sinh viên chưa đáp ứng đủ điều kiện theo quy định của khoa.'
        ELSE NULL
    END
WHERE Status IN ('Approved', 'Rejected');

PRINT 'Sample data for Second Major Registration feature has been added.';
GO 