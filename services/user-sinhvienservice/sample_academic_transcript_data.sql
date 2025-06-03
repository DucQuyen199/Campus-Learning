-- Sample data for academic transcripts
USE campushubt;
GO

-- Check if the Faculties table exists, if not create it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Faculties')
BEGIN
    CREATE TABLE Faculties (
        FacultyID BIGINT IDENTITY(1,1) PRIMARY KEY,
        FacultyName NVARCHAR(100) NOT NULL,
        FacultyCode VARCHAR(20) UNIQUE NOT NULL,
        Description NVARCHAR(MAX),
        Dean NVARCHAR(100),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    
    -- Insert some sample faculties
    INSERT INTO Faculties (FacultyName, FacultyCode, Dean)
    VALUES 
        (N'Faculty of Information Technology', 'FIT', N'Dr. Nguyen Van A'),
        (N'Faculty of Business Administration', 'FBA', N'Dr. Tran Thi B'),
        (N'Faculty of Engineering', 'FEN', N'Dr. Le Van C');
END

-- Check if MajorSubjectID column exists in AcademicPrograms table, if not add it
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'AcademicPrograms' AND COLUMN_NAME = 'MajorSubjectID'
)
BEGIN
    ALTER TABLE AcademicPrograms ADD MajorSubjectID BIGINT NULL;
END

-- Check if FacultyID column exists in AcademicPrograms table, if not add it
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'AcademicPrograms' AND COLUMN_NAME = 'FacultyID'
)
BEGIN
    ALTER TABLE AcademicPrograms ADD FacultyID BIGINT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE AcademicPrograms
    ADD CONSTRAINT FK_AcademicPrograms_Faculties
    FOREIGN KEY (FacultyID) REFERENCES Faculties(FacultyID);
END

-- Sample Academic Programs
IF NOT EXISTS (SELECT 1 FROM AcademicPrograms WHERE ProgramCode = 'CS-REG')
BEGIN
    INSERT INTO AcademicPrograms (ProgramCode, ProgramName, Department, Faculty, Description, 
                                TotalCredits, ProgramDuration, DegreeName, ProgramType, FacultyID)
    VALUES ('CS-REG', N'Computer Science', N'Computer Science', N'Faculty of Information Technology', 
           N'Regular program for Computer Science major', 130, 8, N'Bachelor of Science', 'Regular',
           (SELECT FacultyID FROM Faculties WHERE FacultyCode = 'FIT'));
    
    INSERT INTO AcademicPrograms (ProgramCode, ProgramName, Department, Faculty, Description, 
                                TotalCredits, ProgramDuration, DegreeName, ProgramType, FacultyID)
    VALUES ('BA-REG', N'Business Administration', N'Business', N'Faculty of Business Administration', 
           N'Regular program for Business Administration major', 120, 8, N'Bachelor of Business Administration', 'Regular',
           (SELECT FacultyID FROM Faculties WHERE FacultyCode = 'FBA'));
END

-- Sample Student Details
IF NOT EXISTS (SELECT 1 FROM StudentDetails WHERE StudentCode = 'CS22001')
BEGIN
    INSERT INTO StudentDetails (UserID, StudentCode, Gender, EnrollmentDate, Class, CurrentSemester, AcademicStatus)
    VALUES (1, 'CS22001', 'Male', '2022-09-01', 'CS2022A', 3, 'Regular');
END

-- Sample Student Programs (link student to program)
IF NOT EXISTS (SELECT 1 FROM StudentPrograms WHERE UserID = 1 AND IsPrimary = 1)
BEGIN
    INSERT INTO StudentPrograms (UserID, ProgramID, EntryYear, ExpectedGraduationYear, Status, IsPrimary)
    VALUES (1, 
           (SELECT ProgramID FROM AcademicPrograms WHERE ProgramCode = 'CS-REG'),
           2022, 2026, 'Active', 1);
END

-- Sample Academic Subjects
IF NOT EXISTS (SELECT 1 FROM Subjects WHERE SubjectCode = 'CS101')
BEGIN
    INSERT INTO Subjects (SubjectCode, SubjectName, Credits, TheoryCredits, PracticeCredits, Department, Faculty)
    VALUES 
        ('CS101', N'Introduction to Computer Science', 3, 2, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('CS102', N'Programming Fundamentals', 3, 2, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('CS201', N'Data Structures and Algorithms', 4, 3, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('CS202', N'Database Systems', 3, 2, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('CS301', N'Software Engineering', 4, 3, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('CS302', N'Web Development', 3, 2, 1, 'Computer Science', 'Faculty of Information Technology'),
        ('MATH101', N'Calculus I', 3, 3, 0, 'Mathematics', 'Faculty of Information Technology'),
        ('MATH102', N'Linear Algebra', 3, 3, 0, 'Mathematics', 'Faculty of Information Technology');
        
    -- Set the major subject for CS program
    UPDATE AcademicPrograms 
    SET MajorSubjectID = (SELECT TOP 1 SubjectID FROM Subjects WHERE SubjectCode = 'CS101')
    WHERE ProgramCode = 'CS-REG';
END

-- Link subjects to programs
IF NOT EXISTS (SELECT 1 FROM ProgramSubjects WHERE ProgramID = (SELECT ProgramID FROM AcademicPrograms WHERE ProgramCode = 'CS-REG') AND SubjectID = (SELECT SubjectID FROM Subjects WHERE SubjectCode = 'CS101'))
BEGIN
    -- Add subjects to CS program
    INSERT INTO ProgramSubjects (ProgramID, SubjectID, Semester, SubjectType, IsRequired)
    SELECT 
        (SELECT ProgramID FROM AcademicPrograms WHERE ProgramCode = 'CS-REG'),
        SubjectID,
        CASE 
            WHEN SubjectCode IN ('CS101', 'CS102', 'MATH101', 'MATH102') THEN 1
            WHEN SubjectCode IN ('CS201', 'CS202') THEN 2
            ELSE 3
        END,
        CASE
            WHEN SubjectCode LIKE 'CS%' THEN 'Major'
            ELSE 'General'
        END,
        1
    FROM Subjects
    WHERE SubjectCode IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'MATH101', 'MATH102');
END

-- Sample Course Classes (specific class instances for each semester)
IF NOT EXISTS (SELECT 1 FROM CourseClasses WHERE ClassCode = 'CS101-HK1-2022')
BEGIN
    -- First semester classes
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, Schedule, Location, Status)
    SELECT 
        s.SubjectCode + '-HK1-2022',
        s.SubjectID,
        (SELECT TOP 1 SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2022_2023'),
        1,  -- Teacher ID
        40, -- Max students
        1,  -- Current students (just our sample student)
        '{"days":["Monday","Wednesday"],"times":["08:00-09:30","08:00-09:30"]}',
        'Room A101',
        'Completed'
    FROM Subjects s
    WHERE s.SubjectCode IN ('CS101', 'CS102', 'MATH101', 'MATH102');
    
    -- Second semester classes
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, Schedule, Location, Status)
    SELECT 
        s.SubjectCode + '-HK2-2022',
        s.SubjectID,
        (SELECT TOP 1 SemesterID FROM Semesters WHERE SemesterCode = 'HK2_2022_2023'),
        1,  -- Teacher ID
        40, -- Max students
        1,  -- Current students (just our sample student)
        '{"days":["Tuesday","Thursday"],"times":["10:00-11:30","10:00-11:30"]}',
        'Room B202',
        'Completed'
    FROM Subjects s
    WHERE s.SubjectCode IN ('CS201', 'CS202');
    
    -- Current semester classes
    INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, CurrentStudents, Schedule, Location, Status)
    SELECT 
        s.SubjectCode + '-HK1-2023',
        s.SubjectID,
        (SELECT TOP 1 SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2023_2024'),
        1,  -- Teacher ID
        40, -- Max students
        1,  -- Current students (just our sample student)
        '{"days":["Monday","Wednesday"],"times":["13:00-14:30","13:00-14:30"]}',
        'Room C303',
        'Ongoing'
    FROM Subjects s
    WHERE s.SubjectCode IN ('CS301', 'CS302');
END

-- Register student for classes
IF NOT EXISTS (SELECT 1 FROM CourseRegistrations WHERE UserID = 1 AND ClassID = (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS101-HK1-2022'))
BEGIN
    -- First semester registrations
    INSERT INTO CourseRegistrations (UserID, ClassID, RegistrationType, Status, AdminApproval)
    SELECT 
        1, -- Our sample student
        cc.ClassID,
        'Regular',
        'Approved',
        1
    FROM CourseClasses cc
    WHERE cc.ClassCode IN ('CS101-HK1-2022', 'CS102-HK1-2022', 'MATH101-HK1-2022', 'MATH102-HK1-2022');
    
    -- Second semester registrations
    INSERT INTO CourseRegistrations (UserID, ClassID, RegistrationType, Status, AdminApproval)
    SELECT 
        1, -- Our sample student
        cc.ClassID,
        'Regular',
        'Approved',
        1
    FROM CourseClasses cc
    WHERE cc.ClassCode IN ('CS201-HK2-2022', 'CS202-HK2-2022');
    
    -- Current semester registrations
    INSERT INTO CourseRegistrations (UserID, ClassID, RegistrationType, Status, AdminApproval)
    SELECT 
        1, -- Our sample student
        cc.ClassID,
        'Regular',
        'Approved',
        1
    FROM CourseClasses cc
    WHERE cc.ClassCode IN ('CS301-HK1-2023', 'CS302-HK1-2023');
END

-- Sample Academic Results (grades)
IF NOT EXISTS (SELECT 1 FROM AcademicResults WHERE UserID = 1 AND ClassID = (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS101-HK1-2022'))
BEGIN
    -- Create Academic Results for completed courses
    INSERT INTO AcademicResults (
        UserID, ClassID, AttendanceScore, AssignmentScore, MidtermScore, 
        FinalScore, TotalScore, LetterGrade, GPA, IsCompleted, IsPassed
    )
    VALUES
    -- First semester results
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS101-HK1-2022'),
        9.0, 8.5, 8.0, 8.5, 8.5, 'A', 4.0, 1, 1
    ),
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS102-HK1-2022'),
        8.5, 8.0, 7.5, 8.0, 8.0, 'A-', 3.7, 1, 1
    ),
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'MATH101-HK1-2022'),
        7.5, 7.0, 6.5, 7.0, 7.0, 'B+', 3.3, 1, 1
    ),
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'MATH102-HK1-2022'),
        7.0, 6.5, 6.0, 6.5, 6.5, 'B', 3.0, 1, 1
    ),
    
    -- Second semester results
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS201-HK2-2022'),
        9.5, 9.0, 8.5, 9.0, 9.0, 'A+', 4.0, 1, 1
    ),
    (
        1,
        (SELECT TOP 1 ClassID FROM CourseClasses WHERE ClassCode = 'CS202-HK2-2022'),
        8.0, 7.5, 7.0, 7.5, 7.5, 'B+', 3.3, 1, 1
    );
    
    -- Current semester has no results yet (courses in progress)
END

-- Create Academic Metrics for the student
IF NOT EXISTS (SELECT 1 FROM AcademicMetrics WHERE UserID = 1)
BEGIN
    -- First semester metrics
    INSERT INTO AcademicMetrics (
        UserID, SemesterID, TotalCredits, EarnedCredits, SemesterGPA, CumulativeGPA,
        CreditsPassed, CreditsFailed, AcademicStanding, CreditsRegistered
    )
    VALUES (
        1,
        (SELECT TOP 1 SemesterID FROM Semesters WHERE SemesterCode = 'HK1_2022_2023'),
        12, -- Total credits for semester
        12, -- All earned
        3.5, -- First semester GPA
        3.5, -- Same as cumulative at this point
        12, -- Credits passed
        0,  -- None failed
        'Good Standing',
        12  -- Credits registered
    );
    
    -- Second semester metrics
    INSERT INTO AcademicMetrics (
        UserID, SemesterID, TotalCredits, EarnedCredits, SemesterGPA, CumulativeGPA,
        CreditsPassed, CreditsFailed, AcademicStanding, CreditsRegistered
    )
    VALUES (
        1,
        (SELECT TOP 1 SemesterID FROM Semesters WHERE SemesterCode = 'HK2_2022_2023'),
        7, -- Total credits for semester
        7, -- All earned
        3.7, -- Second semester GPA
        3.6, -- Updated cumulative
        7, -- Credits passed
        0,  -- None failed
        'Good Standing',
        7  -- Credits registered
    );
END

-- Print success message
PRINT 'Sample academic transcript data has been loaded successfully.';
GO 