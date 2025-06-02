USE campushubt;
GO

CREATE TABLE [dbo].[Users] (
    [UserID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [Username]      VARCHAR (50)   NOT NULL,
    [Email]         VARCHAR (100)  NOT NULL,
    [Password]      VARCHAR (255)  NOT NULL,
    [FullName]      NVARCHAR (100) NOT NULL,
    [DateOfBirth]   DATE           NULL,
    [School]        NVARCHAR (255) NULL,
    [Role]          VARCHAR (20)   DEFAULT ('STUDENT') NULL,
    [Status]        VARCHAR (20)   DEFAULT ('ONLINE') NULL,
    [AccountStatus] VARCHAR (20)   DEFAULT ('ACTIVE') NULL,
    [Image]         VARCHAR (255)  NULL,
    [Bio]           NVARCHAR (500) NULL,
    [Provider]      VARCHAR (20)   DEFAULT ('local') NULL,
    [ProviderID]    VARCHAR (100)  NULL,
    [EmailVerified] BIT            DEFAULT ((0)) NULL,
    [PhoneNumber]   VARCHAR (15)   NULL,
    [Address]       NVARCHAR (255) NULL,
    [City]          NVARCHAR (100) NULL,
    [Country]       NVARCHAR (100) NULL,
    [LastLoginIP]   VARCHAR (45)   NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [LastLoginAt]   DATETIME       NULL,
    [DeletedAt]     DATETIME       NULL,
    [LockDuration]  INT            NULL,
    [LockReason]    NVARCHAR (255) NULL,
    [LockedUntil]   DATETIME       NULL,
    [Avatar]        NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [CHK_Account_Status] CHECK ([AccountStatus]='DELETED' OR [AccountStatus]='SUSPENDED' OR [AccountStatus]='LOCKED' OR [AccountStatus]='ACTIVE'),
    CONSTRAINT [CHK_User_Role] CHECK ([Role]='ADMIN' OR [Role]='TEACHER' OR [Role]='STUDENT'),
    CONSTRAINT [CHK_User_Status] CHECK ([Status]='AWAY' OR [Status]='OFFLINE' OR [Status]='ONLINE'),
    UNIQUE NONCLUSTERED ([Email] ASC),
    UNIQUE NONCLUSTERED ([Username] ASC)
);

CREATE TABLE [dbo].[UserProfiles] (
    [ProfileID]               BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]                  BIGINT         NULL,
    [Education]               NVARCHAR (MAX) NULL,
    [WorkExperience]          NVARCHAR (MAX) NULL,
    [Skills]                  NVARCHAR (MAX) NULL,
    [Interests]               NVARCHAR (MAX) NULL,
    [SocialLinks]             NVARCHAR (MAX) NULL,
    [Achievements]            NVARCHAR (MAX) NULL,
    [PreferredLanguage]       VARCHAR (10)   DEFAULT ('vi') NULL,
    [TimeZone]                VARCHAR (50)   DEFAULT ('Asia/Ho_Chi_Minh') NULL,
    [NotificationPreferences] NVARCHAR (MAX) NULL,
    [UpdatedAt]               DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProfileID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);

-- Bảng Courses: Quản lý thông tin khóa học
CREATE TABLE Courses (
    CourseID BIGINT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE,
    Description NVARCHAR(MAX),
    ShortDescription NVARCHAR(500),
    InstructorID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Level VARCHAR(20),
    Category VARCHAR(50),
    SubCategory VARCHAR(50),
    CourseType VARCHAR(20) DEFAULT 'regular',
    Language VARCHAR(20) DEFAULT 'vi',
    Duration INT,
    Capacity INT,
    EnrolledCount INT DEFAULT 0,
    Rating DECIMAL(3,2) DEFAULT 0,
    RatingCount INT DEFAULT 0,
    Price DECIMAL(10,2) DEFAULT 0,
    DiscountPrice DECIMAL(10,2),
    ImageUrl VARCHAR(255),
    VideoUrl VARCHAR(255),
    Requirements NVARCHAR(MAX),
    Objectives NVARCHAR(MAX),
    Syllabus NVARCHAR(MAX),
    Status VARCHAR(20) DEFAULT 'draft',
    IsPublished BIT DEFAULT 0,
    PublishedAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    DeletedAt DATETIME,
    CONSTRAINT CHK_Course_Level CHECK (Level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    CONSTRAINT CHK_Course_Status CHECK (Status IN ('draft', 'review', 'published', 'archived')),
    CONSTRAINT CHK_Course_Type CHECK (CourseType IN ('it', 'regular'))
);

-- Bảng CourseModules: Quản lý các module trong khóa học
CREATE TABLE CourseModules (
    ModuleID BIGINT IDENTITY(1,1) PRIMARY KEY,
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    OrderIndex INT NOT NULL,
    Duration INT,
    IsPublished BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    VideoUrl NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NULL,
    PracticalGuide NVARCHAR(MAX) NULL,
    Objectives NVARCHAR(MAX) NULL,
    Requirements NVARCHAR(MAX) NULL,
    Materials NVARCHAR(MAX) NULL,
    DraftData NVARCHAR(MAX) NULL,
    LastDraftSavedAt DATETIME NULL,
    IsDraft BIT DEFAULT 1
);

-- Bảng CourseLessons: Quản lý các bài học trong module
CREATE TABLE CourseLessons (
    LessonID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ModuleID BIGINT FOREIGN KEY REFERENCES CourseModules(ModuleID),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Type VARCHAR(50) NOT NULL,
    Content NVARCHAR(MAX),
    VideoUrl VARCHAR(255),
    Duration INT,
    OrderIndex INT NOT NULL,
    IsPreview BIT DEFAULT 0,
    IsPublished BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Lesson_Type CHECK (Type IN ('video', 'text', 'quiz', 'assignment', 'coding', 'exercise'))
);

-- Bảng CourseEnrollments: Quản lý đăng ký khóa học của học viên
CREATE TABLE CourseEnrollments (
    EnrollmentID BIGINT IDENTITY(1,1) PRIMARY KEY,
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID),
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Progress INT DEFAULT 0,
    LastAccessedLessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID),
    EnrolledAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME,
    CertificateIssued BIT DEFAULT 0,
    Status VARCHAR(20) DEFAULT 'active',
    CONSTRAINT CHK_Enrollment_Status CHECK (Status IN ('active', 'completed', 'dropped', 'suspended'))
);

-- Bảng LessonProgress: Theo dõi tiến độ học tập của học viên
CREATE TABLE LessonProgress (
    ProgressID BIGINT IDENTITY(1,1) PRIMARY KEY,
    EnrollmentID BIGINT FOREIGN KEY REFERENCES CourseEnrollments(EnrollmentID),
    LessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID),
    Status VARCHAR(20) DEFAULT 'not_started',
    CompletedAt DATETIME,
    TimeSpent INT DEFAULT 0,
    LastPosition INT DEFAULT 0,
    CONSTRAINT CHK_Lesson_Status CHECK (Status IN ('not_started', 'in_progress', 'completed'))
);

-- Bảng CodingExercises: Quản lý bài tập lập trình
CREATE TABLE CodingExercises (
    ExerciseID BIGINT IDENTITY(1,1) PRIMARY KEY,
    LessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    ProgrammingLanguage VARCHAR(50),
    InitialCode NVARCHAR(MAX),
    SolutionCode NVARCHAR(MAX),
    TestCases NVARCHAR(MAX),
    TimeLimit INT DEFAULT 1000,
    MemoryLimit INT DEFAULT 256,
    Difficulty VARCHAR(20) DEFAULT 'medium',
    Points INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Exercise_Difficulty CHECK (Difficulty IN ('easy', 'medium', 'hard', 'expert'))
);

-- Bảng CodingSubmissions: Lưu trữ bài nộp của học viên
CREATE TABLE CodingSubmissions (
    SubmissionID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ExerciseID BIGINT FOREIGN KEY REFERENCES CodingExercises(ExerciseID),
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Code NVARCHAR(MAX),
    Language VARCHAR(50),
    Status VARCHAR(20),
    ExecutionTime INT,
    MemoryUsed INT,
    TestCasesPassed INT DEFAULT 0,
    TotalTestCases INT DEFAULT 0,
    Score INT DEFAULT 0,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Submission_Status CHECK (Status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error'))
);

-- Bảng ModulePractices: Quản lý bài tập thực hành trong module
CREATE TABLE ModulePractices (
    PracticeID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ModuleID BIGINT FOREIGN KEY REFERENCES CourseModules(ModuleID),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    ProgrammingLanguage VARCHAR(50) NOT NULL,
    InitialCode NVARCHAR(MAX),
    TimeLimit INT DEFAULT 1000,
    MemoryLimit INT DEFAULT 256,
    Difficulty VARCHAR(20) DEFAULT 'easy',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Practice_Language CHECK (ProgrammingLanguage IN ('javascript', 'python', 'java', 'cpp', 'csharp', 'rust')),
    CONSTRAINT CHK_Practice_Difficulty CHECK (Difficulty IN ('easy', 'medium', 'hard', 'expert'))
);

-- Bảng PracticeTestCases: Lưu trữ test cases cho bài tập
CREATE TABLE PracticeTestCases (
    TestCaseID BIGINT IDENTITY(1,1) PRIMARY KEY,
    PracticeID BIGINT FOREIGN KEY REFERENCES ModulePractices(PracticeID),
    Input NVARCHAR(MAX),
    ExpectedOutput NVARCHAR(MAX),
    IsHidden BIT DEFAULT 0,
    OrderIndex INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE [dbo].[Exams] (
    [ExamID]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [CourseID]         BIGINT         NULL,
    [Title]            NVARCHAR (255) NOT NULL,
    [Description]      NVARCHAR (MAX) NULL,
    [Type]             VARCHAR (50)   NOT NULL,
    [Duration]         INT            NOT NULL,
    [TotalPoints]      INT            DEFAULT ((100)) NULL,
    [PassingScore]     INT            DEFAULT ((60)) NULL,
    [StartTime]        DATETIME       NOT NULL,
    [EndTime]          DATETIME       NOT NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    [AllowReview]      BIT            DEFAULT ((1)) NULL,
    [ShuffleQuestions] BIT            DEFAULT ((1)) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('upcoming') NULL,
    [CreatedBy]        BIGINT         NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [AlternateId]      NVARCHAR (255) NULL,
    [AllowRetakes]     BIT            DEFAULT ((0)) NULL,
    [MaxRetakes]       INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ExamID] ASC),
    CONSTRAINT [CHK_Exam_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming'),
    CONSTRAINT [CHK_Exam_Type] CHECK ([Type]='mixed' OR [Type]='coding' OR [Type]='essay' OR [Type]='multiple_choice'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);

CREATE TABLE [dbo].[ExamQuestions] (
    [QuestionID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]        BIGINT         NULL,
    [Type]          VARCHAR (50)   NOT NULL,
    [Content]       NVARCHAR (MAX) NULL,
    [Points]        INT            DEFAULT ((1)) NULL,
    [OrderIndex]    INT            NULL,
    [Options]       NVARCHAR (MAX) NULL,
    [CorrectAnswer] NVARCHAR (MAX) NULL,
    [Explanation]   NVARCHAR (MAX) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([QuestionID] ASC),
    CONSTRAINT [CHK_Question_Type] CHECK ([Type]='coding' OR [Type]='essay' OR [Type]='multiple_choice'),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID])
);

CREATE TABLE [dbo].[ExamMonitoringLogs] (
    [LogID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [ParticipantID] BIGINT         NULL,
    [EventType]     VARCHAR (50)   NULL,
    [EventData]     NVARCHAR (MAX) NULL,
    [Timestamp]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LogID] ASC),
    CONSTRAINT [CHK_Event_Type] CHECK ([EventType]='exam_submit' OR [EventType]='exam_start' OR [EventType]='penalty_applied' OR [EventType]='suspicious_activity' OR [EventType]='no_face' OR [EventType]='multiple_faces' OR [EventType]='face_detection' OR [EventType]='copy_paste' OR [EventType]='full_screen_return' OR [EventType]='full_screen_exit' OR [EventType]='tab_switch'),
    FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[ExamParticipants] ([ParticipantID])
);

CREATE TABLE [dbo].[EssayAnswerAnalysis] (
    [AnalysisID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [AnswerID]          BIGINT         NULL,
    [MatchPercentage]   DECIMAL (5, 2) NULL,
    [KeywordsMatched]   INT            NULL,
    [TotalKeywords]     INT            NULL,
    [ContentSimilarity] DECIMAL (5, 2) NULL,
    [GrammarScore]      DECIMAL (5, 2) NULL,
    [AnalyzedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [AutoGradedScore]   INT            NULL,
    [FinalScore]        INT            NULL,
    [ReviewerComments]  NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([AnalysisID] ASC),
    FOREIGN KEY ([AnswerID]) REFERENCES [dbo].[ExamAnswers] ([AnswerID])
);

CREATE TABLE [dbo].[ExamParticipants] (
    [ParticipantID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]            BIGINT         NULL,
    [UserID]            BIGINT         NULL,
    [StartedAt]         DATETIME       NULL,
    [CompletedAt]       DATETIME       NULL,
    [TimeSpent]         INT            NULL,
    [Score]             INT            NULL,
    [Status]            VARCHAR (20)   DEFAULT ('registered') NULL,
    [Feedback]          NVARCHAR (MAX) NULL,
    [ReviewedBy]        BIGINT         NULL,
    [ReviewedAt]        DATETIME       NULL,
    [PenaltyApplied]    BIT            DEFAULT ((0)) NOT NULL,
    [PenaltyReason]     NVARCHAR (255) NULL,
    [PenaltyPercentage] INT            DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_Participant_Status] CHECK ([Status]='reviewed' OR [Status]='completed' OR [Status]='in_progress' OR [Status]='registered'),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID]),
    FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);

CREATE TABLE [dbo].[ExamAnswers] (
    [AnswerID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [ParticipantID]    BIGINT         NULL,
    [QuestionID]       BIGINT         NULL,
    [Answer]           NVARCHAR (MAX) NULL,
    [IsCorrect]        BIT            NULL,
    [Score]            INT            NULL,
    [ReviewerComments] NVARCHAR (MAX) NULL,
    [SubmittedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AnswerID] ASC),
    FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[ExamParticipants] ([ParticipantID]),
    FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[ExamQuestions] ([QuestionID])
);

CREATE TABLE [dbo].[ExamAnswerTemplates] (
    [TemplateID]             BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]                 BIGINT         NULL,
    [Content]                NVARCHAR (MAX) NULL,
    [Keywords]               NVARCHAR (MAX) NULL,
    [MinimumMatchPercentage] DECIMAL (5, 2) NULL,
    [CreatedBy]              BIGINT         NULL,
    [CreatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME       NULL,
    [QuestionID]             BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID]),
    CONSTRAINT [FK_ExamAnswerTemplates_ExamQuestions] FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[ExamQuestions] ([QuestionID])
);

-- Bổ sung bảng thông tin chi tiết sinh viên (Sơ yếu lý lịch)
CREATE TABLE StudentDetails (
    DetailID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    StudentCode VARCHAR(20) UNIQUE,
    IdentityCardNumber VARCHAR(20),
    IdentityCardIssueDate DATE,
    IdentityCardIssuePlace NVARCHAR(100),
    Gender VARCHAR(10),
    MaritalStatus VARCHAR(20),
    BirthPlace NVARCHAR(100),
    Ethnicity NVARCHAR(50),
    Religion NVARCHAR(50),
    HomeTown NVARCHAR(100),
    ParentName NVARCHAR(100),
    ParentPhone VARCHAR(15),
    ParentEmail VARCHAR(100),
    EmergencyContact NVARCHAR(100),
    EmergencyPhone VARCHAR(15),
    HealthInsuranceNumber VARCHAR(20),
    BloodType VARCHAR(5),
    EnrollmentDate DATE,
    GraduationDate DATE,
    Class NVARCHAR(50),
    CurrentSemester INT,
    AcademicStatus VARCHAR(30) DEFAULT 'Regular',
    BankAccountNumber VARCHAR(30),
    BankName NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Academic_Status CHECK (AcademicStatus IN ('Regular', 'Probation', 'Suspended', 'Expelled', 'Graduated', 'On Leave'))
);

-- Chương trình đào tạo
CREATE TABLE AcademicPrograms (
    ProgramID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProgramCode VARCHAR(20) UNIQUE,
    ProgramName NVARCHAR(200) NOT NULL,
    Department NVARCHAR(100),
    Faculty NVARCHAR(100),
    Description NVARCHAR(MAX),
    TotalCredits INT,
    ProgramDuration INT, -- Số học kỳ
    DegreeName NVARCHAR(100),
    ProgramType VARCHAR(50), -- Chính quy, liên thông, văn bằng 2
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Liên kết sinh viên với chương trình đào tạo
CREATE TABLE StudentPrograms (
    StudentProgramID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ProgramID BIGINT FOREIGN KEY REFERENCES AcademicPrograms(ProgramID),
    EntryYear INT,
    ExpectedGraduationYear INT,
    AdvisorID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Status VARCHAR(20) DEFAULT 'Active',
    IsPrimary BIT DEFAULT 1, -- Đánh dấu ngành 1 hay ngành 2
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Program_Status CHECK (Status IN ('Active', 'Completed', 'Suspended', 'Transferred'))
);

-- Môn học
CREATE TABLE Subjects (
    SubjectID BIGINT IDENTITY(1,1) PRIMARY KEY,
    SubjectCode VARCHAR(20) UNIQUE,
    SubjectName NVARCHAR(200) NOT NULL,
    Credits INT NOT NULL,
    TheoryCredits INT,
    PracticeCredits INT,
    Prerequisites NVARCHAR(MAX), -- Môn học tiên quyết
    Description NVARCHAR(MAX),
    Department NVARCHAR(100),
    Faculty NVARCHAR(100),
    IsRequired BIT DEFAULT 1,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Môn học trong chương trình đào tạo
CREATE TABLE ProgramSubjects (
    ProgramSubjectID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProgramID BIGINT FOREIGN KEY REFERENCES AcademicPrograms(ProgramID),
    SubjectID BIGINT FOREIGN KEY REFERENCES Subjects(SubjectID),
    Semester INT, -- Học kỳ đề xuất
    SubjectType VARCHAR(50), -- Cơ sở, chuyên ngành, đại cương
    IsRequired BIT DEFAULT 1,
    MinimumGrade DECIMAL(5,2),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Học kỳ
CREATE TABLE Semesters (
    SemesterID BIGINT IDENTITY(1,1) PRIMARY KEY,
    SemesterCode VARCHAR(20) UNIQUE,
    SemesterName NVARCHAR(100),
    AcademicYear VARCHAR(20),
    StartDate DATE,
    EndDate DATE,
    RegistrationStartDate DATE,
    RegistrationEndDate DATE,
    Status VARCHAR(20) DEFAULT 'Upcoming',
    IsCurrent BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Semester_Status CHECK (Status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled'))
);

-- Lớp học phần
CREATE TABLE CourseClasses (
    ClassID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ClassCode VARCHAR(20) UNIQUE,
    SubjectID BIGINT FOREIGN KEY REFERENCES Subjects(SubjectID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    TeacherID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    MaxStudents INT,
    CurrentStudents INT DEFAULT 0,
    StartDate DATE,
    EndDate DATE,
    Schedule NVARCHAR(MAX), -- JSON lưu lịch học hàng tuần
    Location NVARCHAR(100),
    Status VARCHAR(20) DEFAULT 'Planned',
    Type VARCHAR(20) DEFAULT 'Regular', -- Regular, Retake, Improvement
    IsOnline BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Class_Status CHECK (Status IN ('Planned', 'Registration', 'Ongoing', 'Completed', 'Cancelled')),
    CONSTRAINT CHK_Class_Type CHECK (Type IN ('Regular', 'Retake', 'Improvement'))
);

-- Đăng ký lớp học phần
CREATE TABLE CourseRegistrations (
    RegistrationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ClassID BIGINT FOREIGN KEY REFERENCES CourseClasses(ClassID),
    RegistrationType VARCHAR(20) DEFAULT 'Regular', -- Regular, Retake, Improvement
    RegistrationTime DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending',
    AdminApproval BIT DEFAULT 0,
    ApprovedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ApprovedAt DATETIME,
    CancellationReason NVARCHAR(255),
    CancelledAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Registration_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    CONSTRAINT CHK_Registration_Type CHECK (RegistrationType IN ('Regular', 'Retake', 'Improvement'))
);

-- Lịch thi
CREATE TABLE Exams (
    ExamID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ClassID BIGINT FOREIGN KEY REFERENCES CourseClasses(ClassID),
    ExamName NVARCHAR(100),
    ExamType VARCHAR(20), -- Giữa kỳ, cuối kỳ, cải thiện
    ExamDate DATE,
    StartTime TIME,
    EndTime TIME,
    Location NVARCHAR(100),
    SupervisorID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Status VARCHAR(20) DEFAULT 'Scheduled',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Exam_Status CHECK (Status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
    CONSTRAINT CHK_Exam_Type CHECK (ExamType IN ('Midterm', 'Final', 'Improvement', 'Retake'))
);

ALTER TABLE Exams
ADD ExamDate DATE;

go

-- Đăng ký thi cải thiện điểm
CREATE TABLE ExamRegistrations (
    ExamRegistrationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ExamID BIGINT FOREIGN KEY REFERENCES Exams(ExamID),
    RegistrationTime DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending',
    AdminApproval BIT DEFAULT 0,
    ApprovedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ApprovedAt DATETIME,
    CancellationReason NVARCHAR(255),
    CancelledAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_ExamRegistration_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
);
go

-- Điểm học tập
CREATE TABLE AcademicResults (
    ResultID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ClassID BIGINT FOREIGN KEY REFERENCES CourseClasses(ClassID),
    AttendanceScore DECIMAL(5,2),
    AssignmentScore DECIMAL(5,2),
    MidtermScore DECIMAL(5,2),
    FinalScore DECIMAL(5,2),
    TotalScore DECIMAL(5,2),
    LetterGrade VARCHAR(5),
    GPA DECIMAL(5,2),
    IsCompleted BIT DEFAULT 0,
    IsPassed BIT DEFAULT 0,
    Comments NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
go

-- Điểm rèn luyện
CREATE TABLE ConductScores (
    ConductID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    SelfScore INT, -- Điểm tự đánh giá
    ClassScore INT, -- Điểm lớp đánh giá
    FacultyScore INT, -- Điểm khoa đánh giá
    TotalScore INT,
    Classification VARCHAR(20), -- Xuất sắc, tốt, khá, trung bình, yếu
    Comments NVARCHAR(500),
    Status VARCHAR(20) DEFAULT 'Draft',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Conduct_Status CHECK (Status IN ('Draft', 'Submitted', 'Reviewed', 'Finalized')),
    CONSTRAINT CHK_Conduct_Classification CHECK (Classification IN ('Excellent', 'Good', 'Average', 'Below Average', 'Poor'))
);
go

-- Cảnh báo học vụ
CREATE TABLE AcademicWarnings (
    WarningID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    WarningType VARCHAR(20), -- Cảnh báo mức 1, 2, 3
    Reason NVARCHAR(500),
    WarningDate DATE,
    RequiredAction NVARCHAR(500),
    ResolvedDate DATE,
    Status VARCHAR(20) DEFAULT 'Active',
    CreatedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Warning_Status CHECK (Status IN ('Active', 'Resolved', 'Expired')),
    CONSTRAINT CHK_Warning_Type CHECK (WarningType IN ('Level1', 'Level2', 'Level3', 'Suspension'))
);
go

-- Học phí
CREATE TABLE Tuition (
    TuitionID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    TotalCredits INT,
    AmountPerCredit DECIMAL(10,2),
    TotalAmount DECIMAL(10,2),
    ScholarshipAmount DECIMAL(10,2) DEFAULT 0,
    FinalAmount DECIMAL(10,2),
    DueDate DATE,
    Status VARCHAR(20) DEFAULT 'Unpaid',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Tuition_Status CHECK (Status IN ('Unpaid', 'Partial', 'Paid', 'Overdue', 'Waived'))
);
go

-- Giao dịch thanh toán học phí
CREATE TABLE TuitionPayments (
    PaymentID BIGINT IDENTITY(1,1) PRIMARY KEY,
    TuitionID BIGINT FOREIGN KEY REFERENCES Tuition(TuitionID),
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Amount DECIMAL(10,2),
    PaymentMethod VARCHAR(50),
    TransactionCode VARCHAR(100),
    PaymentDate DATETIME,
    Status VARCHAR(20) DEFAULT 'Pending',
    BankReference VARCHAR(100),
    Notes NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Payment_Status_Tuition CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled')),
    CONSTRAINT CHK_Payment_Method_Tuition CHECK (PaymentMethod IN ('Bank Transfer', 'Online Banking', 'Credit Card', 'Cash', 'Momo', 'ZaloPay', 'VNPay'))
);
go

-- Khen thưởng, kỷ luật
CREATE TABLE StudentAwards (
    AwardID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    AwardType VARCHAR(20), -- Khen thưởng hoặc kỷ luật
    Title NVARCHAR(200),
    Description NVARCHAR(MAX),
    AwardDate DATE,
    Amount DECIMAL(10,2),
    IssuedBy NVARCHAR(100),
    DocumentNumber VARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Award_Type CHECK (AwardType IN ('Reward', 'Scholarship', 'Discipline', 'Warning'))
);
go

-- Đánh giá giảng viên
CREATE TABLE TeacherEvaluations (
    EvaluationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Student ID
    TeacherID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Teacher ID
    ClassID BIGINT FOREIGN KEY REFERENCES CourseClasses(ClassID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    TeachingScore INT, -- Điểm phương pháp giảng dạy
    ContentScore INT, -- Điểm nội dung bài giảng
    AttitudeScore INT, -- Điểm thái độ
    OverallScore INT, -- Điểm tổng
    Comments NVARCHAR(MAX),
    IsAnonymous BIT DEFAULT 1,
    SubmittedAt DATETIME DEFAULT GETDATE(),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
go

-- Ý kiến sinh viên
CREATE TABLE StudentFeedback (
    FeedbackID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(200),
    Content NVARCHAR(MAX),
    Type VARCHAR(50), -- Góp ý, khiếu nại, đề xuất
    Department NVARCHAR(100), -- Phòng ban tiếp nhận
    Status VARCHAR(20) DEFAULT 'Submitted',
    Response NVARCHAR(MAX),
    RespondedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    RespondedAt DATETIME,
    IsAnonymous BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Feedback_Status CHECK (Status IN ('Submitted', 'Processing', 'Responded', 'Resolved', 'Rejected')),
    CONSTRAINT CHK_Feedback_Type CHECK (Type IN ('Suggestion', 'Complaint', 'Question', 'Request', 'Other'))
);
go

-- Dịch vụ sinh viên
CREATE TABLE StudentServices (
    ServiceID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ServiceName NVARCHAR(100),
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2),
    ProcessingTime VARCHAR(50), -- Thời gian xử lý
    RequiredDocuments NVARCHAR(MAX),
    Department NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
go

-- Đăng ký dịch vụ
CREATE TABLE ServiceRegistrations (
    RegistrationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ServiceID BIGINT FOREIGN KEY REFERENCES StudentServices(ServiceID),
    Quantity INT DEFAULT 1,
    TotalPrice DECIMAL(10,2),
    RequestDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending',
    ProcessedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ProcessedAt DATETIME,
    DeliveryMethod VARCHAR(50),
    PaymentStatus VARCHAR(20) DEFAULT 'Unpaid',
    Comments NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_ServiceRequest_Status CHECK (Status IN ('Pending', 'Processing', 'Completed', 'Rejected', 'Cancelled')),
    CONSTRAINT CHK_ServicePayment_Status CHECK (PaymentStatus IN ('Unpaid', 'Paid', 'Refunded', 'Free'))
);
go
-- Thông tin thực tập
CREATE TABLE Internships (
    InternshipID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    CompanyName NVARCHAR(200),
    Position NVARCHAR(100),
    Department NVARCHAR(100),
    Supervisor NVARCHAR(100),
    ContactEmail VARCHAR(100),
    ContactPhone VARCHAR(20),
    StartDate DATE,
    EndDate DATE,
    Status VARCHAR(20) DEFAULT 'Planned',
    WeeklyHours INT,
    Description NVARCHAR(MAX),
    ObjectivesMet NVARCHAR(MAX),
    FacultyAdvisorID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    Grade VARCHAR(5),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Internship_Status CHECK (Status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled', 'Failed'))
);
go
-- Đăng ký xét tốt nghiệp
CREATE TABLE GraduationRegistrations (
    GraduationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    RegistrationDate DATETIME DEFAULT GETDATE(),
    ExpectedGraduationDate DATE,
    TotalCredits INT,
    AverageGPA DECIMAL(5,2),
    HasThesis BIT DEFAULT 0,
    ThesisTitle NVARCHAR(200),
    ThesisSupervisorID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    EngCertificate NVARCHAR(100),
    ItCertificate NVARCHAR(100),
    Status VARCHAR(20) DEFAULT 'Pending',
    ReviewedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ReviewedAt DATETIME,
    Comments NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Graduation_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Graduated', 'Cancelled'))
);
go
-- Điểm danh
CREATE TABLE Attendance (
    AttendanceID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ClassID BIGINT FOREIGN KEY REFERENCES CourseClasses(ClassID),
    SessionDate DATE,
    Status VARCHAR(20) DEFAULT 'Present',
    CheckInTime TIME,
    CheckOutTime TIME,
    Method VARCHAR(20) DEFAULT 'Manual', -- QR Code, RFID, Manual, Online
    Notes NVARCHAR(255),
    RecordedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Attendance_Status CHECK (Status IN ('Present', 'Absent', 'Late', 'Excused', 'Leave')),
    CONSTRAINT CHK_Attendance_Method CHECK (Method IN ('QR Code', 'RFID', 'Manual', 'Online', 'Face Recognition'))
);
go  
-- Bảng lưu trữ chỉ số học tập theo học kỳ
CREATE TABLE AcademicMetrics (
    MetricID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    SemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    TotalCredits INT DEFAULT 0,
    EarnedCredits INT DEFAULT 0,
    SemesterGPA DECIMAL(5,2),
    CumulativeGPA DECIMAL(5,2),
    CreditsPassed INT DEFAULT 0,
    CreditsFailed INT DEFAULT 0,
    AcademicStanding VARCHAR(20), -- Good, Warning, Probation, Suspended
    CreditsRegistered INT DEFAULT 0,
    RankInClass INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_Academic_Standing CHECK (AcademicStanding IN ('Good Standing', 'Warning', 'Probation', 'Suspended', 'Dismissed'))
);
go
use campushubt;
-- Đăng ký học ngành 2
CREATE TABLE SecondMajorRegistrations (
    RegistrationID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ProgramID BIGINT FOREIGN KEY REFERENCES AcademicPrograms(ProgramID), -- Ngành 2
    RegistrationDate DATETIME DEFAULT GETDATE(),
    CurrentGPA DECIMAL(5,2),
    CompletedCredits INT,
    Reason NVARCHAR(MAX),
    Status VARCHAR(20) DEFAULT 'Pending',
    ReviewedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ReviewedAt DATETIME,
    Comments NVARCHAR(500),
    StartSemesterID BIGINT FOREIGN KEY REFERENCES Semesters(SemesterID),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT CHK_SecondMajor_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'))
);
go
-- Bảng chứa lịch sử cập nhật thông tin cá nhân
CREATE TABLE ProfileUpdates (
    UpdateID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    FieldName VARCHAR(50),
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    UpdateTime DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending',
    ApprovedBy BIGINT FOREIGN KEY REFERENCES Users(UserID),
    ApprovedAt DATETIME,
    Reason NVARCHAR(255),
    CONSTRAINT CHK_ProfileUpdate_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected'))
);go
