-- Bảng Courses: Quản lý thông tin khóa học
CREATE TABLE Courses (
    CourseID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của khóa học
    Title NVARCHAR(255) NOT NULL, -- Tiêu đề khóa học
    Slug VARCHAR(255) UNIQUE, -- Đường dẫn thân thiện
    Description NVARCHAR(MAX), -- Mô tả chi tiết
    ShortDescription NVARCHAR(500), -- Mô tả ngắn
    InstructorID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người hướng dẫn
    Level VARCHAR(20), -- Cấp độ khóa học
    Category VARCHAR(50), -- Danh mục chính
    SubCategory VARCHAR(50), -- Danh mục phụ
    CourseType VARCHAR(20) DEFAULT 'regular', -- Loại khóa học: 'it' hoặc 'regular'
    Language VARCHAR(20) DEFAULT 'vi', -- Ngôn ngữ giảng dạy
    Duration INT, -- Thời lượng (phút)
    Capacity INT, -- Sức chứa học viên
    EnrolledCount INT DEFAULT 0, -- Số học viên đã đăng ký
    Rating DECIMAL(3,2) DEFAULT 0, -- Đánh giá trung bình
    RatingCount INT DEFAULT 0, -- Số lượt đánh giá
    Price DECIMAL(10,2) DEFAULT 0, -- Giá gốc
    DiscountPrice DECIMAL(10,2), -- Giá khuyến mãi
    ImageUrl VARCHAR(255), -- Ảnh đại diện
    VideoUrl VARCHAR(255), -- Video giới thiệu
    Requirements NVARCHAR(MAX), -- Yêu cầu đầu vào
    Objectives NVARCHAR(MAX), -- Mục tiêu khóa học
    Syllabus NVARCHAR(MAX), -- Giáo trình
    Status VARCHAR(20) DEFAULT 'draft', -- Trạng thái khóa học
    IsPublished BIT DEFAULT 0, -- Đã xuất bản chưa
    PublishedAt DATETIME, -- Thời điểm xuất bản
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    DeletedAt DATETIME, -- Thời điểm xóa
    CONSTRAINT CHK_Course_Level CHECK (Level IN ('beginner', 'intermediate', 'advanced', 'expert')), -- Kiểm tra cấp độ hợp lệ
    CONSTRAINT CHK_Course_Status CHECK (Status IN ('draft', 'review', 'published', 'archived')), -- Kiểm tra trạng thái hợp lệ
    CONSTRAINT CHK_Course_Type CHECK (CourseType IN ('it', 'regular')) -- Kiểm tra loại khóa học hợp lệ
);
go
-- Bảng CourseModules: Quản lý các module trong khóa học
CREATE TABLE CourseModules (
    ModuleID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của module
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID), -- Khóa học chứa module
    Title NVARCHAR(255) NOT NULL, -- Tiêu đề module
    Description NVARCHAR(MAX), -- Mô tả module
    OrderIndex INT NOT NULL, -- Thứ tự sắp xếp
    Duration INT, -- Thời lượng (phút)
    IsPublished BIT DEFAULT 0, -- Đã xuất bản chưa
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
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
go
-- Bảng CourseLessons: Quản lý các bài học trong module
CREATE TABLE CourseLessons (
    LessonID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của bài học
    ModuleID BIGINT FOREIGN KEY REFERENCES CourseModules(ModuleID), -- Module chứa bài học
    Title NVARCHAR(255) NOT NULL, -- Tiêu đề bài học
    Description NVARCHAR(MAX), -- Mô tả bài học
    Type VARCHAR(50) NOT NULL, -- Loại bài học
    Content NVARCHAR(MAX), -- Nội dung cho bài học dạng văn bản
    VideoUrl VARCHAR(255), -- Đường dẫn video
    Duration INT, -- Thời lượng (phút)
    OrderIndex INT NOT NULL, -- Thứ tự sắp xếp
    IsPreview BIT DEFAULT 0, -- Cho phép xem thử
    IsPublished BIT DEFAULT 0, -- Đã xuất bản chưa
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    CONSTRAINT CHK_Lesson_Type CHECK (Type IN ('video', 'text', 'quiz', 'assignment', 'coding', 'exercise')) -- Kiểm tra loại bài học hợp lệ
);
Go
-- Bảng CourseEnrollments: Quản lý đăng ký khóa học của học viên
CREATE TABLE CourseEnrollments (
    EnrollmentID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của đăng ký
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID), -- Khóa học được đăng ký
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Học viên đăng ký
    Progress INT DEFAULT 0, -- Tiến độ học tập (%)
    LastAccessedLessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID), -- Bài học truy cập gần nhất
    EnrolledAt DATETIME DEFAULT GETDATE(), -- Thời điểm đăng ký
    CompletedAt DATETIME, -- Thời điểm hoàn thành
    CertificateIssued BIT DEFAULT 0, -- Đã cấp chứng chỉ chưa
    Status VARCHAR(20) DEFAULT 'active', -- Trạng thái học tập
    CONSTRAINT CHK_Enrollment_Status CHECK (Status IN ('active', 'completed', 'dropped', 'suspended')) -- Kiểm tra trạng thái hợp lệ
);
go  
-- Bảng LessonProgress: Theo dõi tiến độ học tập của học viên
CREATE TABLE LessonProgress (
    ProgressID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của tiến độ
    EnrollmentID BIGINT FOREIGN KEY REFERENCES CourseEnrollments(EnrollmentID), -- Liên kết với đăng ký khóa học
    LessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID), -- Bài học đang theo dõi
    Status VARCHAR(20) DEFAULT 'not_started', -- Trạng thái học tập
    CompletedAt DATETIME, -- Thời điểm hoàn thành
    TimeSpent INT DEFAULT 0, -- Thời gian đã học (giây)
    LastPosition INT DEFAULT 0, -- Vị trí xem video gần nhất
    CONSTRAINT CHK_Lesson_Status CHECK (Status IN ('not_started', 'in_progress', 'completed')) -- Kiểm tra trạng thái hợp lệ
);
go
-- Bảng CodingExercises: Quản lý bài tập lập trình
CREATE TABLE CodingExercises (
    ExerciseID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của bài tập
    LessonID BIGINT FOREIGN KEY REFERENCES CourseLessons(LessonID), -- Liên kết với bài học
    Title NVARCHAR(255) NOT NULL, -- Tiêu đề bài tập
    Description NVARCHAR(MAX), -- Mô tả chi tiết bài tập
    ProgrammingLanguage VARCHAR(50), -- Ngôn ngữ lập trình được sử dụng
    InitialCode NVARCHAR(MAX), -- Code mẫu ban đầu
    SolutionCode NVARCHAR(MAX), -- Code lời giải
    TestCases NVARCHAR(MAX), -- Các test case kiểm tra (định dạng JSON)
    TimeLimit INT DEFAULT 1000, -- Giới hạn thời gian chạy (mili giây)
    MemoryLimit INT DEFAULT 256, -- Giới hạn bộ nhớ sử dụng (MB)
    Difficulty VARCHAR(20) DEFAULT 'medium', -- Độ khó của bài tập
    Points INT DEFAULT 0, -- Điểm cho bài tập
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    CONSTRAINT CHK_Exercise_Difficulty CHECK (Difficulty IN ('easy', 'medium', 'hard', 'expert')) -- Kiểm tra độ khó hợp lệ
);
go
-- Bảng CodingSubmissions: Lưu trữ bài nộp của học viên
CREATE TABLE CodingSubmissions (
    SubmissionID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của bài nộp
    ExerciseID BIGINT FOREIGN KEY REFERENCES CodingExercises(ExerciseID), -- Liên kết với bài tập
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người nộp bài
    Code NVARCHAR(MAX), -- Code đã nộp
    Language VARCHAR(50), -- Ngôn ngữ lập trình sử dụng
    Status VARCHAR(20), -- Trạng thái chấm bài
    ExecutionTime INT, -- Thời gian chạy (mili giây)
    MemoryUsed INT, -- Bộ nhớ sử dụng (KB)
    TestCasesPassed INT DEFAULT 0, -- Số test case đã pass
    TotalTestCases INT DEFAULT 0, -- Tổng số test case
    Score INT DEFAULT 0, -- Điểm đạt được
    SubmittedAt DATETIME DEFAULT GETDATE(), -- Thời điểm nộp bài
    CONSTRAINT CHK_Submission_Status CHECK (Status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error')) -- Kiểm tra trạng thái hợp lệ
);
go

-- Thêm các cột mới vào bảng CourseModules
ALTER TABLE CourseModules
ADD VideoUrl NVARCHAR(500) NULL,
    ImageUrl NVARCHAR(500) NULL,
    PracticalGuide NVARCHAR(MAX) NULL,
    Objectives NVARCHAR(MAX) NULL,
    Requirements NVARCHAR(MAX) NULL,
    Materials NVARCHAR(MAX) NULL;

-- Cập nhật các cột có giá trị mặc định
UPDATE CourseModules
SET Objectives = '[]',
    Requirements = '[]',
    Materials = '[]'
WHERE Objectives IS NULL
   OR Requirements IS NULL
   OR Materials IS NULL; 

   -- Thêm cột cho bản phác thảo
ALTER TABLE CourseModules
ADD DraftData NVARCHAR(MAX) NULL,
    LastDraftSavedAt DATETIME NULL,
    IsDraft BIT DEFAULT 1;

-- Cập nhật các module hiện có
UPDATE CourseModules
SET IsDraft = 
    CASE 
        WHEN IsPublished = 1 THEN 0 
        ELSE 1 
    END; 

-- Cập nhật cấu trúc bảng CourseModules để hỗ trợ lưu URL video tốt hơn
ALTER TABLE CourseModules
ALTER COLUMN VideoUrl NVARCHAR(2000); -- Tăng độ dài cho URL video

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
    CONSTRAINT CHK_Practice_Language CHECK (ProgrammingLanguage IN ('javascript', 'python', 'java', 'cpp', 'csharp')),
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


-- Bảng PaymentTransactions: Quản lý các giao dịch thanh toán
CREATE TABLE PaymentTransactions (
    TransactionID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID),
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(10) DEFAULT 'VND',
    PaymentMethod VARCHAR(50) NOT NULL,
    TransactionCode VARCHAR(100) UNIQUE,
    PaymentStatus VARCHAR(20) DEFAULT 'pending',
    PaymentDate DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    PaymentDetails NVARCHAR(MAX),
    CONSTRAINT CHK_Payment_Status CHECK (PaymentStatus IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    CONSTRAINT CHK_Payment_Method CHECK (PaymentMethod IN ('vnpay', 'credit_card', 'bank_transfer', 'momo', 'free', 'paypal'))
);

-- Bảng PaymentHistory: Lưu lịch sử và log các sự kiện thanh toán
CREATE TABLE PaymentHistory (
    HistoryID BIGINT IDENTITY(1,1) PRIMARY KEY,
    TransactionID BIGINT FOREIGN KEY REFERENCES PaymentTransactions(TransactionID),
    Status VARCHAR(50) NOT NULL,
    Message NVARCHAR(500),
    ResponseData NVARCHAR(MAX),
    IPAddress VARCHAR(50),
    UserAgent NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE()
); 
use campushubt;
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, DiscountPrice, ImageUrl, VideoUrl, Requirements, Objectives, Syllabus, Status, IsPublished, PublishedAt) 
VALUES (
    N'Khóa học JavaScript Zero to Hero', 
    'javascript-zero-to-hero', 
    N'Khóa học JavaScript toàn diện giúp bạn từ người mới bắt đầu trở thành lập trình viên JavaScript chuyên nghiệp. Bạn sẽ được học từ những khái niệm cơ bản như biến, vòng lặp, hàm đến các kỹ thuật nâng cao như ES6+, Promise, async/await, DOM manipulation và REST API. Khóa học bao gồm nhiều bài tập thực hành và dự án thực tế giúp củng cố kiến thức.', 
    N'Khóa học JavaScript toàn diện với 40+ giờ video, 100+ bài tập và 6 dự án thực tế.',
    1,
    'beginner', 
    'programming', 
    'javascript', 
    'vi', 
    2400, -- 40 giờ học
    1000, -- Giới hạn 1000 học viên
    2500000, -- 2,500,000 VND
    1990000,  -- Giá khuyến mãi 1,990,000 VND
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    N'[
        "Kiến thức cơ bản về máy tính và internet",
        "Hiểu biết căn bản về HTML và CSS",
        "Máy tính có cấu hình đủ để chạy các công cụ lập trình",
        "Tinh thần tự học và kiên trì"
    ]',
    N'[
        "Nắm vững tất cả khái niệm cốt lõi của JavaScript",
        "Thành thạo ES6+ và các tính năng hiện đại",
        "Xây dựng được các ứng dụng web hoàn chỉnh",
        "Làm việc thành thạo với DOM và các Web APIs",
        "Hiểu và áp dụng được các design patterns phổ biến",
        "Biết cách tối ưu hiệu năng ứng dụng JavaScript"
    ]',
    N'[
        "Phần 1: Nền tảng JavaScript",
        "Phần 2: ES6+ và Tính năng Hiện đại",
        "Phần 3: DOM và Browser APIs",
        "Phần 4: Bất đồng bộ và Networking",
        "Phần 5: Object-Oriented JavaScript",
        "Phần 6: Design Patterns và Best Practices",
        "Phần 7: Testing và Debugging",
        "Phần 8: Dự án thực tế"
    ]',
    'published', 
    1, 
    GETDATE()
);

select * from Courses;
-- Thêm các Module của khóa học
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished, CreatedAt, UpdatedAt, VideoUrl, ImageUrl, PracticalGuide, Objectives, Requirements, Materials, DraftData, LastDraftSavedAt, IsDraft)
VALUES 
(10003, N'Nền tảng JavaScript', N'Module này giới thiệu về JavaScript, lịch sử phát triển, và các khái niệm nền tảng quan trọng. Bạn sẽ học cách cài đặt môi trường, viết code đầu tiên và hiểu về cách JavaScript hoạt động.', 1, 180, 1, GETDATE(), GETDATE(), 
'https://www.youtube.com/watch?v=PkZNo7MFNFg', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Cài đặt Visual Studio Code, Node.js, và các extensions cần thiết\n- Thiết lập môi trường phát triển chuyên nghiệp\n- Thực hành với Console và Chrome DevTools\n- Viết và debug code JavaScript cơ bản', 
N'["Hiểu sâu về cách JavaScript hoạt động", "Thành thạo công cụ phát triển", "Nắm vững quy trình debug code"]',
N'["Máy tính với Windows 10/11 hoặc macOS", "Kết nối internet ổn định", "Kiến thức cơ bản về lập trình"]',
N'["Visual Studio Code", "Node.js LTS", "Chrome DevTools", "Git"]', NULL, NULL, 0),

(10003, N'JavaScript Hiện đại với ES6+', N'Khám phá các tính năng mới và mạnh mẽ của JavaScript hiện đại. Tìm hiểu về arrow functions, destructuring, modules, và nhiều tính năng ES6+ khác.', 2, 240, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=W6NZfCO5SIk', 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Thực hành với arrow functions và this binding\n- Áp dụng destructuring trong dự án thực tế\n- Xây dựng ứng dụng sử dụng ES modules\n- Làm việc với Template Literals và Tagged Templates', 
N'["Sử dụng thành thạo các tính năng ES6+", "Áp dụng được modern JavaScript vào dự án", "Tối ưu code với các cú pháp mới"]',
N'["Hoàn thành module Nền tảng JavaScript", "Hiểu biết về scope và closure"]',
N'["ES6+ Cheatsheet", "Babel configuration guide", "Modern JavaScript examples"]', NULL, NULL, 0),

(10003, N'DOM và Tương tác người dùng', N'Học cách thao tác với DOM, xử lý sự kiện người dùng, và tạo giao diện tương tác. Module này tập trung vào việc xây dựng các ứng dụng web động.', 3, 300, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=Qqx_wzMmFeA', 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Thực hành DOM manipulation\n- Xây dựng các components tương tác\n- Tối ưu hiệu năng DOM operations\n- Project: Xây dựng trò chơi JavaScript', 
N'["Thành thạo DOM manipulation", "Xử lý được các sự kiện phức tạp", "Tạo được UI có tính tương tác cao"]',
N'["Kiến thức tốt về HTML/CSS", "Hoàn thành các module trước"]',
N'["Interactive UI components", "Game development guide", "Performance optimization tips"]', NULL, NULL, 0),

(10003, N'Lập trình Bất đồng bộ và API', N'Tìm hiểu sâu về lập trình bất đồng bộ trong JavaScript. Học cách làm việc với Promise, async/await, và tương tác với REST APIs.', 4, 360, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=hdI2bqOjy3c', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Xây dựng ứng dụng với REST APIs\n- Thực hành với Promise chains\n- Sử dụng async/await trong dự án thực tế\n- Xử lý lỗi và loading states', 
N'["Hiểu sâu về bất đồng bộ trong JavaScript", "Thành thạo Promise và async/await", "Xây dựng được ứng dụng full-stack"]',
N'["Kiến thức về HTTP và RESTful APIs", "Hiểu biết về JSON"]',
N'["API documentation", "Postman collections", "Error handling patterns"]', NULL, NULL, 0),

(10003, N'Testing và Performance', N'Học cách viết unit tests, integration tests và tối ưu hiệu năng ứng dụng JavaScript. Áp dụng các best practices trong phát triển phần mềm.', 5, 240, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=0ik6X4DJKCc', 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Viết unit tests với Jest\n- Thực hiện performance profiling\n- Tối ưu code với modern techniques\n- Áp dụng testing vào dự án thực tế', 
N'["Viết được test cases hiệu quả", "Tối ưu được hiệu năng ứng dụng", "Áp dụng được các testing patterns"]',
N'["Kiến thức về JavaScript testing", "Hiểu biết về performance metrics"]',
N'["Jest documentation", "Chrome Performance Tools", "Testing patterns guide"]', NULL, NULL, 0),

(10003, N'Dự án Thực tế', N'Áp dụng tất cả kiến thức đã học để xây dựng một ứng dụng web hoàn chỉnh. Học cách deploy và maintain một dự án thực tế.', 6, 480, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=PoRJizFvM7s', 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Xây dựng ứng dụng từ đầu đến cuối\n- Triển khai CI/CD pipeline\n- Tối ưu SEO và performance\n- Deploy lên cloud platform', 
N'["Xây dựng được ứng dụng hoàn chỉnh", "Triển khai được dự án thực tế", "Áp dụng được best practices"]',
N'["Hoàn thành tất cả các module trước", "Kiến thức về Git và deployment"]',
N'["Project starter template", "Deployment guide", "Best practices documentation"]', NULL, NULL, 0);

-- Thêm bài học vào các Module
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 1: Giới thiệu tổng quan', N'Tổng quan về module và các kiến thức sẽ học', 'Video', N'Giới thiệu chi tiết về module, mục tiêu học tập và các kiến thức quan trọng sẽ được đề cập.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 30, 1, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 2: Khái niệm cơ bản', N'Các khái niệm nền tảng cần nắm vững', 'Video', N'Giải thích chi tiết các khái niệm cơ bản và nền tảng quan trọng.', 'https://www.youtube.com/watch?v=hdI2bqOjy3c', 45, 2, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 3: Thực hành cơ bản', N'Áp dụng kiến thức cơ bản vào thực hành', 'Video', N'Hướng dẫn thực hành với các ví dụ đơn giản để nắm vững kiến thức.', 'https://www.youtube.com/watch?v=Qqx_wzMmFeA', 45, 3, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 4: Kiến thức trung cấp', N'Nâng cao kiến thức lên mức trung cấp', 'Video', N'Tìm hiểu các kiến thức trung cấp và cách áp dụng.', 'https://www.youtube.com/watch?v=PkZNo7MFNFg', 60, 4, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 5: Thực hành nâng cao', N'Thực hành với các bài tập phức tạp hơn', 'Video', N'Làm việc với các bài tập thực tế có độ khó tăng dần.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 60, 5, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 6: Kỹ thuật chuyên sâu', N'Tìm hiểu các kỹ thuật chuyên sâu', 'Video', N'Khám phá các kỹ thuật nâng cao và cách áp dụng vào dự án thực tế.', 'https://www.youtube.com/watch?v=hdI2bqOjy3c', 75, 6, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 7: Best Practices', N'Các phương pháp và cách làm tốt nhất', 'Video', N'Học hỏi các best practices từ chuyên gia trong ngành.', 'https://www.youtube.com/watch?v=Qqx_wzMmFeA', 60, 7, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 8: Xử lý lỗi và Debug', N'Kỹ thuật xử lý lỗi và debug code', 'Video', N'Hướng dẫn cách debug hiệu quả và xử lý các tình huống lỗi.', 'https://www.youtube.com/watch?v=PkZNo7MFNFg', 45, 8, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 9: Mini Project', N'Dự án thực tế nhỏ', 'Video', N'Xây dựng một dự án nhỏ để áp dụng toàn bộ kiến thức đã học.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 90, 9, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 10: Tổng kết và Kiểm tra', N'Ôn tập và kiểm tra kiến thức', 'Video', N'Tổng hợp kiến thức và bài kiểm tra cuối module.', 'https://www.youtube.com/watch?v=hdI2bqOjy3c', 60, 10, 0, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10003;
go
use campushubt;
-- Thêm bài tập thực hành

ALTER TABLE CourseLessons
DROP CONSTRAINT CHK_Lesson_Type;

ALTER TABLE CourseLessons
ADD CONSTRAINT CHK_Lesson_Type 
CHECK (Type IN ('video', 'text', 'quiz', 'assignment', 'coding', 'exercise'));

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
SELECT 
    ModuleID,
    N'Bài tập thực hành: ' + Title,
    N'Thực hành và củng cố kiến thức thông qua các bài tập tương tác',
    'Exercise', -- Sửa 'exercise' thành 'Exercise' để khớp với Type trong bảng
    N'// Bài tập 1: Tính tổng các số trong mảng
function calculateArraySum(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0);
}

// Bài tập 2: Tìm số lớn nhất trong mảng
function findMaxNumber(numbers) {
    return Math.max(...numbers);
}

// Bài tập 3: Đảo ngược chuỗi
function reverseString(str) {
    return str.split("").reverse().join("");
}

// Bài tập 4: Kiểm tra số nguyên tố
function isPrime(number) {
    if (number < 2) return false;
    for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) return false;
    }
    return true;
}

// Bài tập 5: Sắp xếp mảng tăng dần
function sortArray(arr) {
    return arr.sort((a, b) => a - b);
}

// Bài tập 6: Tìm phần tử xuất hiện nhiều nhất
function findMostFrequent(arr) {
    const freq = {};
    arr.forEach(item => freq[item] = (freq[item] || 0) + 1);
    return Object.entries(freq).reduce((a, b) => freq[a] >= freq[b] ? a : b)[0];
}

// Bài tập 7: Tính giai thừa
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Bài tập 8: Kiểm tra chuỗi palindrome
function isPalindrome(str) {
    str = str.toLowerCase().replace(/[^a-z0-9]/g, "");
    return str === str.split("").reverse().join("");
}',
    60,
    11,
    0,
    1,
    GETDATE(),
    GETDATE()
FROM CourseModules 
WHERE CourseID = 10003;

-- Thêm bài tập lập trình với test cases
INSERT INTO CodingExercises (LessonID, Title, Description, ProgrammingLanguage, InitialCode, SolutionCode, TestCases, TimeLimit, MemoryLimit, Difficulty, Points, CreatedAt, UpdatedAt)
VALUES 
(
    (SELECT TOP 1 LessonID FROM CourseLessons WHERE Type = 'Exercise'),
    N'Coding Challenge: Xử lý mảng cơ bản',
    N'Thử thách lập trình để kiểm tra và nâng cao kỹ năng xử lý mảng',
    'javascript',
    N'function processArray(arr) {
    // TODO: Implement your solution here
    // 1. Lọc ra các số chẵn
    // 2. Nhân đôi giá trị của chúng
    // 3. Tính tổng kết quả
    return 0;
}',
    N'function processArray(arr) {
    return arr
        .filter(num => num % 2 === 0)
        .map(num => num * 2)
        .reduce((sum, num) => sum + num, 0);
}',
    N'[
        {"input": [1, 2, 3, 4], "expected": 12},
        {"input": [2, 4, 6, 8], "expected": 40},
        {"input": [1, 3, 5, 7], "expected": 0},
        {"input": [10, 20], "expected": 60}
    ]',
    1000,
    256,
    'easy',
    10,
    GETDATE(),
    GETDATE()
);

-- SQL script to mark the first 3 lessons of each course as preview lessons
-- For each module, update the first 3 lessons by OrderIndex to be preview lessons
UPDATE l
SET l.IsPreview = 1
FROM CourseLessons l
INNER JOIN (
    SELECT ModuleID, LessonID, ROW_NUMBER() OVER (PARTITION BY ModuleID ORDER BY OrderIndex) as RowNum
    FROM CourseLessons
) as ranked
ON l.LessonID = ranked.LessonID
WHERE ranked.RowNum <= 3;
-- Log the update
SELECT 'Updated preview status for lesson count:', COUNT(*) FROM CourseLessons WHERE IsPreview = 1;

-- Insert C++ course
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, Level, Category, SubCategory, 
    Language, Duration, Price, ImageUrl, Status, IsPublished, PublishedAt
) VALUES (
    N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao',
    'lap-trinh-cpp-tu-co-ban-den-nang-cao',
    N'Khóa học toàn diện về lập trình C++, từ những khái niệm cơ bản đến các kỹ thuật nâng cao. Học viên sẽ được trang bị kiến thức vững chắc về C++ và có thể phát triển các ứng dụng thực tế.',
    N'Học C++ từ đầu, làm chủ ngôn ngữ lập trình mạnh mẽ này',
    'beginner',
    'Programming',
    'C++',
    'vi',
    1800,
    0,
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    'published',
    1,
    GETDATE()
);
use campushubt;

-- Insert modules for C++ course
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished, ImageUrl)
VALUES 
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao'),
    N'Module 1: Giới thiệu về C++',
    N'Làm quen với môi trường lập trình C++, cài đặt công cụ và viết chương trình đầu tiên',
    1,
    120,
    1,
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao'),
    N'Module 2: Các khái niệm cơ bản',
    N'Học về biến, kiểu dữ liệu, toán tử và cấu trúc điều khiển trong C++',
    2,
    180,
    1,
    'https://images.unsplash.com/photo-1555066931-bf19f8e1083d?w=800&auto=format&fit=crop&q=60'),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao'),
    N'Module 3: Hàm và cấu trúc chương trình',
    N'Tìm hiểu về hàm, tham số, giá trị trả về và cách tổ chức code',
    3,
    150,
    1,
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=60'),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao'),
    N'Module 4: Mảng và chuỗi',
    N'Học cách làm việc với mảng một chiều, đa chiều và xử lý chuỗi',
    4,
    180,
    1,
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=60'),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao'),
    N'Module 5: Lập trình hướng đối tượng',
    N'Khái niệm về OOP, class, object, kế thừa và đa hình trong C++',
    5,
    240,
    1,
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60');

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt) 
SELECT ModuleID, Title + N' - Bài 1: Giới thiệu tổng quan', N'Tổng quan về module và các kiến thức sẽ học', 'Video', N'Giới thiệu chi tiết về module, mục tiêu học tập và các kiến thức quan trọng sẽ được đề cập.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 30, 1, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 2: Các khái niệm cơ bản', N'Học về biến, kiểu dữ liệu, toán tử và cấu trúc điều khiển trong C++', 'Video', N'Giải thích chi tiết các khái niệm cơ bản và nền tảng quan trọng.', 'https://www.youtube.com/watch?v=hdI2bqOjy3c', 45, 2, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 3: Hàm và cấu trúc chương trình', N'Tìm hiểu về hàm, tham số, giá trị trả về và cách tổ chức code', 'Video', N'Giải thích chi tiết về hàm và cấu trúc chương trình trong C++', 'https://www.youtube.com/watch?v=Qqx_wzMmFeA', 60, 3, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 4: Mảng và chuỗi', N'Học cách làm việc với mảng một chiều, đa chiều và xử lý chuỗi', 'Video', N'Giải thích chi tiết về mảng và chuỗi trong C++', 'https://www.youtube.com/watch?v=PkZNo7MFNFg', 60, 4, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 5: Lập trình hướng đối tượng', N'Khái niệm về OOP, class, object, kế thừa và đa hình trong C++', 'Video', N'Giải thích chi tiết về lập trình hướng đối tượng trong C++', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 60, 5, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 6: File và I/O', N'Học cách đọc và ghi dữ liệu vào file trong C++', 'Video', N'Giải thích chi tiết về file và I/O trong C++', 'https://www.youtube.com/watch?v=3tDPZ45dZyM', 60, 6, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 7: Thực hành và làm bài tập', N'Thực hành và làm bài tập để củng cố kiến thức', 'Video', N'Giải thích chi tiết về thực hành và làm bài tập trong C++', 'https://www.youtube.com/watch?v=3tDPZ45dZyM', 60, 7, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 8: Tổng kết và kiểm tra', N'Tổng kết kiến thức và bài kiểm tra cuối khóa', 'Video', N'Giải thích chi tiết về tổng kết và bài kiểm tra cuối khóa trong C++', 'https://www.youtube.com/watch?v=3tDPZ45dZyM', 60, 8, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

insert into CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
select ModuleID, Title + N' - Bài 9: Tổng kết và kiểm tra', N'Tổng kết kiến thức và bài kiểm tra cuối khóa', 'Video', N'Giải thích chi tiết về tổng kết và bài kiểm tra cuối khóa trong C++', 'https://www.youtube.com/watch?v=3tDPZ45dZyM', 60, 9, 1, 1, GETDATE(), GETDATE()
from CourseModules where CourseID = 10004;

select * from CourseModules;


-- Insert Java OOP Course
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, ImageUrl, Status, IsPublished, PublishedAt)
VALUES (
    N'Lập Trình Hướng Đối Tượng Java',
    'lap-trinh-huong-doi-tuong-java',
    N'Khóa học cung cấp kiến thức toàn diện về lập trình hướng đối tượng với Java, từ cơ bản đến nâng cao.',
    N'Học lập trình hướng đối tượng với Java từ A-Z',
    1,
    'intermediate',
    'Programming',
    'Java',
    'vi',
    480,
    100,
    299000,
    'https://funix.edu.vn/wp-content/uploads/2023/12/Ung-dung-cua-Java-trong-phat-trien-web.jpg',
    'published',
    1,
    GETDATE()
);

-- Insert Java Course Modules
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES 
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Hướng Đối Tượng Java'),
    N'Module 1: Giới thiệu về Java OOP',
    N'Khái niệm cơ bản về lập trình hướng đối tượng và Java',
    1,
    120,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Hướng Đối Tượng Java'),
    N'Module 2: Class và Object',
    N'Chi tiết về class, object và các thành phần trong Java',
    2,
    180,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Hướng Đối Tượng Java'),
    N'Module 3: Kế thừa và Đa hình',
    N'Khái niệm về kế thừa, đa hình và interface trong Java',
    3,
    180,
    1);

-- Insert Java Course Lessons
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
SELECT ModuleID, Title + N' - Bài 1: Giới thiệu Java OOP', N'Tổng quan về lập trình hướng đối tượng trong Java', 'Video', N'Giới thiệu chi tiết về OOP và Java', 'https://www.youtube.com/watch?v=grEKMHGYyns', 30, 1, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = (SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Hướng Đối Tượng Java');

-- Insert Kotlin Course
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, ImageUrl, Status, IsPublished, PublishedAt)
VALUES (
    N'Lập Trình Kotlin Cho Android',
    'lap-trinh-kotlin-cho-android',
    N'Khóa học hướng dẫn lập trình Kotlin từ cơ bản đến nâng cao, tập trung vào phát triển ứng dụng Android.',
    N'Học lập trình Kotlin và phát triển ứng dụng Android',
    1,
    'intermediate',
    'Programming',
    'Mobile',
    'vi',
    360,
    100,
    399000,
    'https://images.viblo.asia/2185d41e-6e40-42ba-8464-201b818bee58.png',
    'published',
    1,
    GETDATE()
);

-- Insert Kotlin Course Modules
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES 
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Kotlin Cho Android'),
    N'Module 1: Giới thiệu Kotlin',
    N'Khái niệm cơ bản về Kotlin và Android Development',
    1,
    120,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Kotlin Cho Android'),
    N'Module 2: Kotlin cơ bản',
    N'Các khái niệm cơ bản trong Kotlin',
    2,
    120,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Kotlin Cho Android'),
    N'Module 3: Android UI với Kotlin',
    N'Xây dựng giao diện người dùng Android',
    3,
    120,
    1);

-- Insert Kotlin Course Lessons
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
SELECT ModuleID, Title + N' - Bài 1: Giới thiệu Kotlin', N'Tổng quan về Kotlin và Android Development', 'Video', N'Giới thiệu chi tiết về Kotlin', 'https://www.youtube.com/watch?v=H_oGi8uuDpA', 30, 1, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = (SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình Kotlin Cho Android');

-- Insert C# Course
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, ImageUrl, Status, IsPublished, PublishedAt)
VALUES (
    N'Lập Trình C# và .NET Framework',
    'lap-trinh-csharp-va-dotnet',
    N'Khóa học cung cấp kiến thức toàn diện về lập trình C# và phát triển ứng dụng với .NET Framework.',
    N'Học lập trình C# và phát triển ứng dụng .NET',
    1,
    'intermediate',
    'Programming',
    'C#',
    'vi',
    420,
    100,
    349000,
    'https://mfranc.com/images/code_review.jpeg',
    'published',
    1,
    GETDATE()
);

-- Insert C# Course Modules
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES 
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C# và .NET Framework'),
    N'Module 1: Giới thiệu C#',
    N'Khái niệm cơ bản về C# và .NET Framework',
    1,
    120,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C# và .NET Framework'),
    N'Module 2: C# cơ bản',
    N'Các khái niệm cơ bản trong C#',
    2,
    150,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C# và .NET Framework'),
    N'Module 3: Lập trình hướng đối tượng với C#',
    N'OOP trong C#',
    3,
    150,
    1);

-- Insert C# Course Lessons
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished, CreatedAt, UpdatedAt)
SELECT ModuleID, Title + N' - Bài 1: Giới thiệu C#', N'Tổng quan về C# và .NET Framework', 'Video', N'Giới thiệu chi tiết về C#', 'https://www.youtube.com/watch?v=gfkTfcpWqAY', 30, 1, 1, 1, GETDATE(), GETDATE()
FROM CourseModules WHERE CourseID = (SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình C# và .NET Framework');

-- Insert ReactJS Course
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, ImageUrl, Status, IsPublished, PublishedAt)
VALUES (
    N'Lập Trình ReactJS Từ Cơ Bản',
    'lap-trinh-reactjs-tu-co-ban',
    N'Khóa học hướng dẫn lập trình ReactJS từ cơ bản đến nâng cao, bao gồm các khái niệm và thực hành.',
    N'Học lập trình ReactJS từ cơ bản đến nâng cao',
    1,
    'beginner',
    'Programming',
    'Web',
    'vi',
    300,
    100,
    299000,
    'https://images.unsplash.com/photo-1633356122544-f53432440157?w=800&auto=format&fit=crop&q=60',
    'published',
    1,
    GETDATE()
);

-- Insert TypeScript Course
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, ImageUrl, Status, IsPublished, PublishedAt)
VALUES (
    N'Lập Trình TypeScript Chuyên Sâu',
    'lap-trinh-typescript-chuyen-sau',
    N'Khóa học cung cấp kiến thức chuyên sâu về TypeScript, từ cơ bản đến các tính năng nâng cao.',
    N'Học lập trình TypeScript từ cơ bản đến nâng cao',
    1,
    'intermediate',
    'Programming',
    'Web',
    'vi',
    240,
    100,
    249000,
    'https://www.orientsoftware.com/Themes/Content/Images/blog/2023-11-13/typescript-introduction.jpg',
    'published',
    1,
    GETDATE()
);

GO

-- Insert TypeScript Course Modules
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES 
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình TypeScript Chuyên Sâu'),
    N'Module 1: Giới thiệu TypeScript',
    N'Khái niệm cơ bản về TypeScript',
    1,
    120,
    1),
((SELECT TOP 1 CourseID FROM Courses WHERE Title = N'Lập Trình TypeScript Chuyên Sâu'),
    N'Module 2: Các tính năng nâng cao',
    N'Các tính năng nâng cao trong TypeScript',
    2,
    120,
    1);

UPDATE Courses
SET ImageUrl = CASE 
    WHEN Title = N'Lập Trình Hướng Đối Tượng Java' THEN 'https://funix.edu.vn/wp-content/uploads/2023/12/Ung-dung-cua-Java-trong-phat-trien-web.jpg'
    WHEN Title = N'Lập Trình Kotlin Cho Android' THEN 'https://images.viblo.asia/2185d41e-6e40-42ba-8464-201b818bee58.png'
    WHEN Title = N'Lập Trình C# và .NET Framework' THEN 'https://mfranc.com/images/code_review.jpeg'
    WHEN Title = N'Lập Trình ReactJS Từ Cơ Bản' THEN 'https://images.unsplash.com/photo-1633356122544-f53432440157?w=800&auto=format&fit=crop&q=60'
    WHEN Title = N'Lập Trình TypeScript Chuyên Sâu' THEN 'https://www.orientsoftware.com/Themes/Content/Images/blog/2023-11-13/typescript-introduction.jpg'
    ELSE ImageUrl
END;

UPDATE Courses
SET ImageUrl = 'https://careers.techvify.com.vn/wp-content/uploads/2022/06/lap-trinh-reactjs.jpeg'
WHERE Title = N'Lập Trình ReactJS Từ Cơ Bản';

update Courses
set imageurl = 'https://s3-sgn09.fptcloud.com/codelearnstorage/files/thumbnails/lap-trinh-cpp-co-ban_4af6f617fbec4380b4e046a7797624e1.png'
where courseid = 10004;

select * from Courses;

UPDATE Courses
SET ImageUrl = 'https://beecrowd.com/wp-content/uploads/2024/04/2022-07-19-Melhores-cursos-de-Python.jpg'
WHERE CourseID = 20;

-- Add 'paypal' to the payment methods constraint
ALTER TABLE PaymentTransactions
DROP CONSTRAINT CHK_Payment_Method;

ALTER TABLE PaymentTransactions
ADD CONSTRAINT CHK_Payment_Method CHECK (PaymentMethod IN ('vnpay', 'credit_card', 'bank_transfer', 'momo', 'free', 'paypal'));

use campushubt;
-- Insert data into CourseCategories table
-- Thêm khóa học Python miễn phí
INSERT INTO Courses (
    Title, 
    Slug, 
    Description, 
    ShortDescription, 
    InstructorID, 
    Level, 
    Category, 
    SubCategory, 
    Language, 
    Duration, 
    Capacity, 
    Price, 
    DiscountPrice, 
    ImageUrl, 
    VideoUrl, 
    Requirements, 
    Objectives, 
    Syllabus, 
    Status, 
    IsPublished, 
    PublishedAt
) VALUES (
    N'Python cơ bản cho người mới bắt đầu', 
    'python-co-ban-cho-nguoi-moi-bat-dau', 
    N'Khóa học Python miễn phí dành cho người mới bắt đầu, giúp bạn nắm vững các kiến thức nền tảng về lập trình Python. Bạn sẽ học từ khái niệm cơ bản về biến, kiểu dữ liệu, vòng lặp, hàm cho đến làm việc với file, thư viện và lập trình hướng đối tượng cơ bản.', 
    N'Học Python từ con số 0 với khóa học miễn phí chất lượng cao',
    1, -- InstructorID
    'beginner', 
    'programming', 
    'python', 
    'vi', 
    720, -- 12 giờ học
    5000, -- Không giới hạn học viên
    0, -- Giá 0 đồng (miễn phí)
    NULL, -- Không có giá khuyến mãi
    'https://beecrowd.com/wp-content/uploads/2024/04/2022-07-19-Melhores-cursos-de-Python.jpg',
    'https://www.youtube.com/watch?v=rfscVS0vtbw',
    N'[
        "Không yêu cầu kiến thức lập trình trước đó",
        "Máy tính có kết nối internet",
        "Tinh thần học hỏi và kiên trì"
    ]',
    N'[
        "Hiểu và áp dụng các khái niệm cơ bản của Python",
        "Viết được các chương trình Python đơn giản",
        "Làm việc với file và dữ liệu",
        "Phân tích và giải quyết vấn đề bằng Python",
        "Chuẩn bị nền tảng cho các khóa học nâng cao"
    ]',
    N'[
        "Phần 1: Làm quen với Python",
        "Phần 2: Biến và kiểu dữ liệu",
        "Phần 3: Cấu trúc điều khiển",
        "Phần 4: Hàm và Module",
        "Phần 5: Cấu trúc dữ liệu",
        "Phần 6: Làm việc với File",
        "Phần 7: Lập trình hướng đối tượng cơ bản",
        "Phần 8: Dự án thực tế nhỏ"
    ]',
    'published', 
    1, 
    GETDATE()
);

-- Lấy CourseID của khóa học vừa tạo
DECLARE @PythonCourseID BIGINT = SCOPE_IDENTITY();

-- Thêm các Module của khóa học Python
INSERT INTO CourseModules (
    CourseID, 
    Title, 
    Description, 
    OrderIndex, 
    Duration, 
    IsPublished, 
    CreatedAt, 
    UpdatedAt, 
    VideoUrl, 
    ImageUrl, 
    PracticalGuide, 
    Objectives, 
    Requirements, 
    Materials, 
    IsDraft
) VALUES 
(@PythonCourseID, 
N'Làm quen với Python', 
N'Module này giới thiệu về ngôn ngữ Python, lịch sử, và các đặc điểm nổi bật. Bạn sẽ học cách cài đặt Python và môi trường phát triển, viết chương trình Python đầu tiên.', 
1, 60, 1, GETDATE(), GETDATE(), 
'https://www.youtube.com/watch?v=rfscVS0vtbw', 
'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=2832&auto=format&fit=crop',
N'- Cài đặt Python và IDE\n- Sử dụng Python Shell\n- Viết chương trình Hello World\n- Làm quen với cú pháp Python', 
N'["Thiết lập môi trường phát triển Python", "Hiểu về cú pháp cơ bản", "Chạy chương trình Python đầu tiên"]',
N'["Máy tính với Windows/macOS/Linux", "Kết nối internet"]',
N'["Python 3.x", "VS Code hoặc PyCharm", "Jupyter Notebook"]', 
0),

(@PythonCourseID, 
N'Biến và kiểu dữ liệu', 
N'Tìm hiểu về biến, các kiểu dữ liệu cơ bản trong Python và cách thực hiện các phép toán.', 
2, 90, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=rfscVS0vtbw', 
'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Khai báo và sử dụng biến\n- Làm việc với các kiểu dữ liệu: số, chuỗi, Boolean\n- Thực hiện các phép toán cơ bản\n- Chuyển đổi kiểu dữ liệu', 
N'["Hiểu và sử dụng đúng các kiểu dữ liệu", "Thực hiện các phép toán với biến", "Áp dụng chuyển đổi kiểu dữ liệu"]',
N'["Hoàn thành module Làm quen với Python"]',
N'["Tài liệu Python Data Types", "Ví dụ minh họa"]', 
0),

(@PythonCourseID, 
N'Cấu trúc dữ liệu Python', 
N'Học về các cấu trúc dữ liệu quan trọng trong Python như List, Tuple, Set và Dictionary.', 
3, 120, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=rfscVS0vtbw', 
'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
N'- Làm việc với List và các phương thức\n- Sử dụng Tuple trong Python\n- Tìm hiểu về Set\n- Sử dụng Dictionary để lưu trữ dữ liệu key-value', 
N'["Sử dụng thành thạo List, Tuple, Set, Dictionary", "Chọn cấu trúc dữ liệu phù hợp cho bài toán", "Thực hiện các thao tác phổ biến"]',
N'["Kiến thức về biến và kiểu dữ liệu"]',
N'["Cheatsheet cấu trúc dữ liệu Python", "Bài tập thực hành"]', 
0);

-- Thêm bài học vào Module 1
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Giới thiệu về Python', 
    N'Tìm hiểu về Python và lý do nên học Python', 
    'video', 
    N'Python là ngôn ngữ lập trình bậc cao, đa năng được tạo ra bởi Guido van Rossum vào năm 1991. Python có cú pháp đơn giản, dễ đọc và thân thiện với người mới bắt đầu.',
    'https://www.youtube.com/watch?v=rfscVS0vtbw', 
    20, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @PythonCourseID AND OrderIndex = 1;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Cài đặt Python và môi trường phát triển', 
    N'Hướng dẫn cài đặt Python và các công cụ phát triển', 
    'video', 
    N'Trong bài học này, bạn sẽ được hướng dẫn cách cài đặt Python, cài đặt VS Code hoặc PyCharm và thiết lập môi trường phát triển.',
    'https://www.youtube.com/watch?v=rfscVS0vtbw', 
    25, 
    2, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @PythonCourseID AND OrderIndex = 1;

-- Thêm bài tập lập trình
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Bài tập: Viết chương trình Python đầu tiên', 
    N'Thực hành viết và chạy chương trình Python đầu tiên', 
    'coding', 
    N'Hãy viết chương trình Python đầu tiên hiển thị "Hello, Python World!"', 
    30, 
    3, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @PythonCourseID AND OrderIndex = 1;

-- Lấy LessonID của bài coding vừa tạo
DECLARE @CodingLessonID BIGINT = SCOPE_IDENTITY();

-- Thêm thông tin bài tập coding
INSERT INTO CodingExercises (
    LessonID, 
    Title, 
    Description, 
    ProgrammingLanguage, 
    InitialCode, 
    SolutionCode, 
    TestCases, 
    TimeLimit, 
    MemoryLimit, 
    Difficulty, 
    Points
) VALUES (
    @CodingLessonID,
    N'Chương trình Python đầu tiên',
    N'Hãy viết một chương trình Python hiển thị dòng chữ "Hello, Python World!"',
    'python',
    N'# Viết code của bạn ở đây
# Hiển thị dòng chữ "Hello, Python World!"

',
    N'print("Hello, Python World!")',
    N'[
        {"input": "", "expected": "Hello, Python World!", "isHidden": false},
        {"input": "", "expected": "Hello, Python World!", "isHidden": true}
    ]',
    1000,
    256,
    'easy',
    5
);

use campushubt;
-- Thêm khóa học mẫu về tư tưởng Hồ Chí Minh (khóa học thường)
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, DiscountPrice, ImageUrl, VideoUrl, Requirements, Objectives, Syllabus, Status, IsPublished, PublishedAt
) VALUES (
    N'Tư tưởng Hồ Chí Minh và ứng dụng trong đời sống', 
    'tu-tuong-ho-chi-minh',
    N'Khóa học cung cấp kiến thức toàn diện về tư tưởng Hồ Chí Minh và cách áp dụng những giá trị đó vào đời sống hiện đại. Học viên sẽ được tìm hiểu về cuộc đời, sự nghiệp và những đóng góp to lớn của Chủ tịch Hồ Chí Minh đối với cách mạng Việt Nam và phong trào giải phóng dân tộc trên thế giới. Khóa học bao gồm các bài giảng về tư tưởng độc lập dân tộc, chủ nghĩa nhân văn, đạo đức cách mạng và phong cách làm việc của Người.',
    N'Tìm hiểu về tư tưởng Hồ Chí Minh và cách áp dụng vào cuộc sống hiện đại.',
    1,
    'beginner', 
    'philosophy', 
    'political-science', 
    'vi', 
    900, 
    1000, 
    350000, 
    300000, 
    'https://cdnimg.vietnamplus.vn/uploaded/bokttj/2020_02_03/ttxvn_ho_chi_minh.jpg', 
    'https://www.youtube.com/watch?v=CyK7xA5Zn0o',
    N'[
        "Không yêu cầu kiến thức nền tảng đặc biệt",
        "Quan tâm đến lịch sử Việt Nam và tư tưởng chính trị",
        "Mong muốn áp dụng triết lý sống tích cực vào đời sống"
    ]',
    N'[
        "Hiểu sâu về cuộc đời và sự nghiệp của Chủ tịch Hồ Chí Minh",
        "Nắm vững những tư tưởng cốt lõi về độc lập dân tộc và chủ nghĩa xã hội",
        "Áp dụng tư tưởng đạo đức cách mạng trong công việc và cuộc sống",
        "Phân tích được giá trị của tư tưởng Hồ Chí Minh trong bối cảnh hiện đại"
    ]',
    N'[
        "Phần 1: Cuộc đời và sự nghiệp của Chủ tịch Hồ Chí Minh",
        "Phần 2: Tư tưởng về độc lập dân tộc và chủ nghĩa xã hội",
        "Phần 3: Tư tưởng về đạo đức cách mạng",
        "Phần 4: Phong cách Hồ Chí Minh",
        "Phần 5: Ứng dụng tư tưởng Hồ Chí Minh trong đời sống hiện đại"
    ]',
    'published', 
    1, 
    GETDATE()
);

-- Lấy CourseID của khóa học vừa tạo
DECLARE @HCMCourseID BIGINT = SCOPE_IDENTITY();

-- Thêm các Module của khóa học
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished, CreatedAt, UpdatedAt, VideoUrl, ImageUrl, PracticalGuide, Objectives, Requirements, Materials, IsDraft)
VALUES 
(@HCMCourseID, 
N'Cuộc đời và sự nghiệp của Chủ tịch Hồ Chí Minh', 
N'Module này giới thiệu tổng quan về cuộc đời, sự nghiệp và những đóng góp to lớn của Chủ tịch Hồ Chí Minh đối với cách mạng Việt Nam và phong trào giải phóng dân tộc trên thế giới.', 
1, 180, 1, GETDATE(), GETDATE(), 
'https://www.youtube.com/watch?v=CyK7xA5Zn0o', 
'https://cdnimg.vietnamplus.vn/uploaded/bokttj/2020_02_03/ttxvn_ho_chi_minh.jpg',
N'- Tìm hiểu về thời niên thiếu và quá trình hình thành tư tưởng\n- Nghiên cứu hành trình tìm đường cứu nước\n- Tìm hiểu về sự nghiệp cách mạng\n- Phân tích di sản tư tưởng', 
N'["Hiểu được bối cảnh lịch sử", "Nắm vững các giai đoạn phát triển tư tưởng", "Phân tích được những đóng góp quan trọng"]',
N'["Kiến thức cơ bản về lịch sử Việt Nam"]',
N'["Tiểu sử Hồ Chí Minh", "Tài liệu lịch sử cách mạng Việt Nam"]', 
0),

(@HCMCourseID, 
N'Tư tưởng về độc lập dân tộc và chủ nghĩa xã hội', 
N'Module này phân tích sâu về tư tưởng độc lập dân tộc gắn liền với chủ nghĩa xã hội trong hệ thống tư tưởng Hồ Chí Minh.', 
2, 150, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=DrvzjZYPRxQ', 
'https://media.baoquocte.vn/stores/news_dataimages/nguyenphuong/042018/24/09/tu-tuong-ho-chi-minh-gia-tri-va-y-nghia-thoi-dai_4.jpg',
N'- Nghiên cứu về độc lập dân tộc theo tư tưởng Hồ Chí Minh\n- Tìm hiểu về chủ nghĩa xã hội\n- Mối quan hệ giữa độc lập dân tộc và chủ nghĩa xã hội\n- Giá trị hiện đại của tư tưởng này', 
N'["Hiểu sâu về tư tưởng độc lập dân tộc", "Nắm vững quan điểm về chủ nghĩa xã hội", "Phân tích mối quan hệ biện chứng"]',
N'["Hoàn thành module 1", "Kiến thức cơ bản về chính trị"]',
N'["Tài liệu về độc lập dân tộc", "Nghiên cứu về chủ nghĩa xã hội"]', 
0),

(@HCMCourseID, 
N'Tư tưởng về đạo đức cách mạng', 
N'Module này tập trung vào tư tưởng đạo đức cách mạng của Hồ Chí Minh và giá trị thực tiễn của nó trong cuộc sống hiện đại.', 
3, 150, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=B9j4A3TpA5Y', 
'https://nhandan.vn/imgold/media/k2/items/src/6833/abaaf95f5a786b7133af35f46c1c0ecf.jpg',
N'- Nghiên cứu quan điểm về đạo đức cách mạng\n- Tìm hiểu các chuẩn mực đạo đức\n- Phân tích mối quan hệ giữa đạo đức và sự phát triển xã hội\n- Áp dụng trong cuộc sống hiện đại', 
N'["Nắm vững quan điểm về đạo đức cách mạng", "Hiểu và áp dụng các chuẩn mực đạo đức", "Vận dụng trong cuộc sống và công việc"]',
N'["Hoàn thành các module trước"]',
N'["Tài liệu về đạo đức cách mạng", "Sách nghiên cứu về tư tưởng đạo đức Hồ Chí Minh"]', 
0),

(@HCMCourseID, 
N'Phong cách Hồ Chí Minh', 
N'Module này giới thiệu về phong cách sống, làm việc, lãnh đạo và tư duy của Chủ tịch Hồ Chí Minh.', 
4, 120, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=KRqbBu0SVSA', 
'https://vnn-imgs-a1.vgcloud.vn/icdn.dantri.com.vn/2021/05/18/ho-chi-minh-4-dskf-1621346219998.jpeg',
N'- Tìm hiểu phong cách làm việc khoa học\n- Nghiên cứu phong cách lãnh đạo dân chủ\n- Phân tích phong cách tư duy sáng tạo\n- Phong cách sống giản dị, tiết kiệm', 
N'["Hiểu rõ về phong cách Hồ Chí Minh", "Áp dụng phong cách làm việc khoa học", "Vận dụng phong cách lãnh đạo và sống"]',
N'["Hiểu biết về tư tưởng Hồ Chí Minh"]',
N'["Tài liệu về phong cách Hồ Chí Minh", "Nghiên cứu về phong cách lãnh đạo"]', 
0),

(@HCMCourseID, 
N'Ứng dụng tư tưởng Hồ Chí Minh trong đời sống hiện đại', 
N'Module này hướng dẫn cách áp dụng những giá trị trong tư tưởng Hồ Chí Minh vào đời sống hiện đại, từ công việc đến cuộc sống cá nhân.', 
5, 120, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=W8VNBx5dS-c', 
'https://bcp.cdnchinhphu.vn/334894974524682240/2023/6/6/ho-chi-minh-16860284308541104143964.jpg',
N'- Áp dụng tư tưởng Hồ Chí Minh trong công việc\n- Vận dụng trong học tập và nghiên cứu\n- Ứng dụng trong xây dựng lối sống lành mạnh\n- Phát triển tư duy sáng tạo và kỹ năng lãnh đạo', 
N'["Vận dụng được tư tưởng Hồ Chí Minh vào thực tiễn", "Phát triển kỹ năng lãnh đạo và làm việc", "Xây dựng lối sống tích cực"]',
N'["Hoàn thành các module trước"]',
N'["Tài liệu ứng dụng", "Nghiên cứu điển hình", "Bài tập thực hành"]', 
0);

-- Thêm các bài học cho Module 1
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Thời niên thiếu và hành trình tìm đường cứu nước', 
    N'Bài học giới thiệu về thời niên thiếu và hành trình tìm đường cứu nước của Chủ tịch Hồ Chí Minh', 
    'video', 
    N'Bài học này tìm hiểu về thời niên thiếu của Nguyễn Tất Thành, quá trình hình thành tư tưởng yêu nước và hành trình tìm đường cứu nước ra đi từ Bến Nhà Rồng năm 1911.',
    'https://www.youtube.com/watch?v=CyK7xA5Zn0o', 
    45, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 1;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Sự nghiệp cách mạng và những đóng góp to lớn', 
    N'Bài học về sự nghiệp cách mạng và những đóng góp quan trọng của Chủ tịch Hồ Chí Minh', 
    'video', 
    N'Bài học phân tích sự nghiệp cách mạng của Chủ tịch Hồ Chí Minh từ khi thành lập Đảng Cộng sản Việt Nam, lãnh đạo Cách mạng Tháng Tám thành công đến việc xây dựng và bảo vệ nền độc lập dân tộc.',
    'https://www.youtube.com/watch?v=nJC4Y8nMhHQ', 
    60, 
    2, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 1;

-- Thêm các bài học cho Module 2
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Tư tưởng độc lập dân tộc', 
    N'Bài học về tư tưởng độc lập dân tộc trong hệ thống tư tưởng Hồ Chí Minh', 
    'video', 
    N'Bài học phân tích sâu về quan điểm độc lập dân tộc của Hồ Chí Minh, từ nguồn gốc hình thành đến nội dung và giá trị lịch sử cũng như ý nghĩa thực tiễn.',
    'https://www.youtube.com/watch?v=DrvzjZYPRxQ', 
    50, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 2;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Tư tưởng về chủ nghĩa xã hội', 
    N'Bài học về quan điểm của Hồ Chí Minh về chủ nghĩa xã hội', 
    'video', 
    N'Bài học tìm hiểu quan điểm của Hồ Chí Minh về chủ nghĩa xã hội phù hợp với điều kiện Việt Nam, mối quan hệ giữa độc lập dân tộc và chủ nghĩa xã hội.',
    'https://www.youtube.com/watch?v=R0gM6aSPQIo', 
    55, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 2;

-- Thêm các bài học cho Module 3
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Quan điểm về đạo đức cách mạng', 
    N'Bài học về quan điểm đạo đức cách mạng trong tư tưởng Hồ Chí Minh', 
    'video', 
    N'Bài học phân tích quan điểm của Hồ Chí Minh về vai trò của đạo đức cách mạng, những nguyên tắc cơ bản của đạo đức cách mạng.',
    'https://www.youtube.com/watch?v=B9j4A3TpA5Y', 
    45, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 3;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Chuẩn mực đạo đức cách mạng', 
    N'Bài học về các chuẩn mực đạo đức cách mạng trong tư tưởng Hồ Chí Minh', 
    'video', 
    N'Bài học giới thiệu về các chuẩn mực đạo đức cách mạng theo tư tưởng Hồ Chí Minh như cần, kiệm, liêm, chính, chí công vô tư.',
    'https://www.youtube.com/watch?v=bm1vLtbLGjc', 
    50, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 3;

-- Thêm các bài học cho Module 4
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Phong cách làm việc và lãnh đạo', 
    N'Bài học về phong cách làm việc và lãnh đạo của Chủ tịch Hồ Chí Minh', 
    'video', 
    N'Bài học phân tích phong cách làm việc khoa học, dân chủ và phong cách lãnh đạo gần dân, trọng dân, học dân, có lòng tin vào nhân dân của Chủ tịch Hồ Chí Minh.',
    'https://www.youtube.com/watch?v=KRqbBu0SVSA', 
    40, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 4;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Phong cách tư duy và sống', 
    N'Bài học về phong cách tư duy và lối sống của Chủ tịch Hồ Chí Minh', 
    'video', 
    N'Bài học tìm hiểu về phong cách tư duy độc lập, sáng tạo và lối sống giản dị, tiết kiệm, liêm khiết của Chủ tịch Hồ Chí Minh.',
    'https://www.youtube.com/watch?v=CyK7xA5Zn0o', 
    45, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 4;

-- Thêm các bài học cho Module 5
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Ứng dụng trong công việc và học tập', 
    N'Bài học về cách áp dụng tư tưởng Hồ Chí Minh trong công việc và học tập', 
    'video', 
    N'Bài học hướng dẫn cách vận dụng tư tưởng và phong cách Hồ Chí Minh vào công việc và học tập hiện đại, nâng cao hiệu quả và phát triển bản thân.',
    'https://www.youtube.com/watch?v=W8VNBx5dS-c', 
    45, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 5;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Xây dựng lối sống và phát triển cá nhân', 
    N'Bài học về cách áp dụng tư tưởng Hồ Chí Minh để xây dựng lối sống và phát triển cá nhân', 
    'video', 
    N'Bài học cung cấp phương pháp áp dụng tư tưởng Hồ Chí Minh để xây dựng lối sống lành mạnh, phát triển kỹ năng lãnh đạo và tư duy sáng tạo.',
    'https://www.youtube.com/watch?v=DrvzjZYPRxQ', 
    50, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @HCMCourseID AND OrderIndex = 5;

-- Cập nhật khóa học tư tưởng Hồ Chí Minh thành miễn phí
UPDATE Courses
SET Price = 0, DiscountPrice = NULL
WHERE Slug = 'tu-tuong-ho-chi-minh';

-- Thêm khóa học mẫu về lịch sử Đảng Cộng sản Việt Nam (miễn phí)
INSERT INTO Courses (Title, Slug, Description, ShortDescription, InstructorID, Level, Category, SubCategory, Language, Duration, Capacity, Price, DiscountPrice, ImageUrl, VideoUrl, Requirements, Objectives, Syllabus, Status, IsPublished, PublishedAt) 
VALUES 
(
  N'Lịch sử Đảng Cộng sản Việt Nam', 
  'lich-su-dang-cong-san-viet-nam',
  N'Khóa học cung cấp kiến thức toàn diện về lịch sử Đảng Cộng sản Việt Nam từ khi thành lập đến nay. Học viên sẽ được tìm hiểu về quá trình ra đời, phát triển và lãnh đạo cách mạng của Đảng qua các thời kỳ lịch sử, từ 1930 đến hiện tại. Khóa học bao gồm các bài giảng, tư liệu lịch sử, hình ảnh và video minh họa về các sự kiện quan trọng, các nhân vật lịch sử và các quyết định chiến lược của Đảng.',
  N'Tìm hiểu lịch sử Đảng Cộng sản Việt Nam từ khi thành lập đến nay.',
  1,
  'beginner', 
  'history', 
  'political-science', 
  'vi', 
  840, 
  2000, 
  0, 
  NULL, 
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Emblem_of_the_Communist_Party_of_Vietnam.svg/800px-Emblem_of_the_Communist_Party_of_Vietnam.svg.png', 
  'https://www.youtube.com/watch?v=fzNm67qHVBM',
  N'[
    "Không yêu cầu kiến thức nền tảng đặc biệt",
    "Quan tâm đến lịch sử Việt Nam hiện đại",
    "Mong muốn hiểu sâu về lịch sử dân tộc"
  ]',
  N'[
    "Hiểu rõ bối cảnh lịch sử ra đời của Đảng Cộng sản Việt Nam",
    "Nắm vững các giai đoạn phát triển quan trọng của Đảng",
    "Phân tích được vai trò lãnh đạo của Đảng trong các thời kỳ cách mạng",
    "Đánh giá được thành tựu và bài học kinh nghiệm từ lịch sử Đảng"
  ]',
  N'[
    "Phần 1: Bối cảnh lịch sử và sự ra đời của Đảng (1920-1930)",
    "Phần 2: Đảng lãnh đạo đấu tranh giành chính quyền (1930-1945)",
    "Phần 3: Kháng chiến chống thực dân Pháp (1945-1954)",
    "Phần 4: Đấu tranh thống nhất đất nước (1954-1975)",
    "Phần 5: Thời kỳ đổi mới và phát triển đất nước (1986-nay)"
  ]',
  'published', 
  1, 
  GETDATE()
);

-- Lấy CourseID của khóa học vừa tạo
DECLARE @DangCourseID BIGINT = SCOPE_IDENTITY();

-- Thêm các Module của khóa học
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished, CreatedAt, UpdatedAt, VideoUrl, ImageUrl, PracticalGuide, Objectives, Requirements, Materials, IsDraft)
VALUES 
(@DangCourseID, 
N'Bối cảnh lịch sử và sự ra đời của Đảng (1920-1930)', 
N'Module này giới thiệu bối cảnh lịch sử Việt Nam và thế giới đầu thế kỷ 20, phong trào yêu nước và cách mạng Việt Nam trước khi có Đảng, quá trình truyền bá chủ nghĩa Mác-Lênin vào Việt Nam và sự ra đời của Đảng Cộng sản Việt Nam.', 
1, 180, 1, GETDATE(), GETDATE(), 
'https://www.youtube.com/watch?v=fzNm67qHVBM', 
'https://file1.dangcongsan.vn/data/0/images/2021/02/02/cuongnt/1.jpg',
N'- Nghiên cứu bối cảnh lịch sử thế giới và Việt Nam đầu thế kỷ 20\n- Tìm hiểu các phong trào yêu nước trước khi có Đảng\n- Phân tích quá trình truyền bá chủ nghĩa Mác-Lênin vào Việt Nam\n- Nghiên cứu Hội nghị thành lập Đảng và Cương lĩnh đầu tiên', 
N'["Hiểu được bối cảnh ra đời của Đảng", "Nắm vững ý nghĩa lịch sử của sự kiện thành lập Đảng", "Phân tích được nội dung Cương lĩnh đầu tiên"]',
N'["Hiểu biết cơ bản về lịch sử Việt Nam"]',
N'["Tài liệu lịch sử Đảng", "Cương lĩnh đầu tiên của Đảng", "Tư liệu lịch sử thời kỳ 1920-1930"]', 
0),

(@DangCourseID, 
N'Đảng lãnh đạo đấu tranh giành chính quyền (1930-1945)', 
N'Module này tập trung vào quá trình Đảng lãnh đạo phong trào cách mạng từ khi thành lập đến Cách mạng Tháng Tám năm 1945, giành chính quyền trong cả nước và thành lập nước Việt Nam Dân chủ Cộng hòa.', 
2, 180, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=RLp0nIv1zJE', 
'https://cdnimg.vietnamplus.vn/uploaded/ngtnnn/2020_08_16/bac_ho_doc_tuyen_ngon_doc_lap_2.jpg',
N'- Nghiên cứu phong trào cách mạng 1930-1931 và Xô Viết Nghệ Tĩnh\n- Tìm hiểu quá trình vận động dân chủ 1936-1939\n- Phân tích chủ trương chuyển hướng của Đảng thời kỳ 1939-1945\n- Nghiên cứu về Cách mạng Tháng Tám 1945', 
N'["Hiểu được các phong trào cách mạng chính", "Nắm vững chiến lược, sách lược của Đảng", "Phân tích thành công của Cách mạng Tháng Tám"]',
N'["Hoàn thành module 1", "Kiến thức về bối cảnh thế giới thời kỳ này"]',
N'["Tài liệu về phong trào cách mạng 1930-1945", "Nghiên cứu về Cách mạng Tháng Tám", "Hồ sơ lịch sử về thành lập nước Việt Nam Dân chủ Cộng hòa"]', 
0),

(@DangCourseID, 
N'Kháng chiến chống thực dân Pháp (1945-1954)', 
N'Module này trình bày về quá trình Đảng lãnh đạo cuộc kháng chiến chống thực dân Pháp từ khi giành độc lập đến chiến thắng Điện Biên Phủ và Hiệp định Genève 1954.', 
3, 180, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=dQwY7GdQsEk', 
'https://media.baodautu.vn/Images/nguyentrang02/2019/05/06/Dien-Bien-Phu-tren-khong-va-Dien-Bien-Phu-tren-mat-dat-Dan-toc-ta-da-lam-nen-2-ky-tich-vi-dai1557161368.jpg',
N'- Nghiên cứu chủ trương kháng chiến toàn quốc\n- Tìm hiểu về chiến dịch Biên Giới 1950\n- Phân tích quá trình tiến tới chiến dịch Điện Biên Phủ\n- Nghiên cứu ý nghĩa của chiến thắng Điện Biên Phủ và Hiệp định Genève', 
N'["Hiểu sâu về đường lối kháng chiến của Đảng", "Nắm vững các chiến dịch quân sự quan trọng", "Phân tích ý nghĩa của chiến thắng Điện Biên Phủ"]',
N'["Hoàn thành các module trước", "Kiến thức cơ bản về chiến tranh Đông Dương lần thứ nhất"]',
N'["Tài liệu về kháng chiến chống Pháp", "Nghiên cứu về chiến dịch Điện Biên Phủ", "Hiệp định Genève và các văn kiện liên quan"]', 
0),

(@DangCourseID, 
N'Đấu tranh thống nhất đất nước (1954-1975)', 
N'Module này tập trung vào quá trình Đảng lãnh đạo đấu tranh giải phóng miền Nam, thống nhất đất nước, từ sau hiệp định Genève đến chiến dịch Hồ Chí Minh năm 1975.', 
4, 150, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=lL2TfzLQgc4', 
'https://file1.dangcongsan.vn/data/0/images/2020/04/29/vulinh/41.jpg',
N'- Nghiên cứu về cuộc kháng chiến chống Mỹ, cứu nước\n- Tìm hiểu về phong trào Đồng khởi 1960\n- Phân tích các chiến dịch quân sự lớn\n- Nghiên cứu chiến dịch Hồ Chí Minh lịch sử', 
N'["Hiểu rõ đường lối kháng chiến chống Mỹ", "Nắm vững các sự kiện quân sự và chính trị quan trọng", "Phân tích nguyên nhân thắng lợi của cuộc kháng chiến"]',
N'["Hoàn thành các module trước", "Kiến thức về chiến tranh Việt Nam"]',
N'["Tài liệu về kháng chiến chống Mỹ", "Nghiên cứu về chiến dịch Hồ Chí Minh", "Tư liệu về ngày thống nhất đất nước"]', 
0),

(@DangCourseID, 
N'Thời kỳ đổi mới và phát triển đất nước (1986-nay)', 
N'Module này giới thiệu về công cuộc đổi mới do Đảng khởi xướng và lãnh đạo, quá trình phát triển kinh tế - xã hội, hội nhập quốc tế và xây dựng, chỉnh đốn Đảng từ 1986 đến nay.', 
5, 150, 1, GETDATE(), GETDATE(),
'https://www.youtube.com/watch?v=XHPeRrRXKfU', 
'https://www.quanlynhanuoc.vn/wp-content/uploads/2021/02/1-8.jpg',
N'- Nghiên cứu bối cảnh và nguyên nhân của công cuộc đổi mới\n- Tìm hiểu nội dung cơ bản của đường lối đổi mới\n- Phân tích thành tựu và hạn chế của công cuộc đổi mới\n- Nghiên cứu về xây dựng, chỉnh đốn Đảng trong thời kỳ mới', 
N'["Hiểu sâu về đường lối đổi mới của Đảng", "Nắm vững các thành tựu của công cuộc đổi mới", "Phân tích thách thức và triển vọng phát triển đất nước"]',
N'["Hoàn thành các module trước", "Kiến thức về kinh tế, chính trị Việt Nam hiện đại"]',
N'["Tài liệu về công cuộc đổi mới", "Văn kiện Đại hội Đảng các khóa", "Nghiên cứu về phát triển kinh tế - xã hội Việt Nam"]', 
0);

-- Thêm các bài học cho Module 1
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Bối cảnh lịch sử thế giới và Việt Nam đầu thế kỷ 20', 
    N'Bài học giới thiệu bối cảnh lịch sử thế giới và Việt Nam đầu thế kỷ 20, làm tiền đề cho sự ra đời của Đảng Cộng sản Việt Nam', 
    'video', 
    N'Bài học này phân tích bối cảnh lịch sử thế giới với sự thắng lợi của Cách mạng Tháng Mười Nga, sự ra đời của Quốc tế Cộng sản, và tình hình Việt Nam dưới ách thống trị của thực dân Pháp.',
    'https://www.youtube.com/watch?v=fzNm67qHVBM', 
    45, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 1;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Quá trình thành lập Đảng Cộng sản Việt Nam', 
    N'Bài học về quá trình thành lập Đảng Cộng sản Việt Nam và ý nghĩa lịch sử của sự kiện này', 
    'video', 
    N'Bài học trình bày quá trình Nguyễn Ái Quốc truyền bá chủ nghĩa Mác-Lênin vào Việt Nam, sự ra đời của các tổ chức tiền thân của Đảng, và Hội nghị thành lập Đảng ngày 3/2/1930.',
    'https://www.youtube.com/watch?v=L6Y13a6SqUc', 
    60, 
    2, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 1;

-- Thêm các bài học cho Module 2
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Phong trào cách mạng 1930-1931 và Xô Viết Nghệ Tĩnh', 
    N'Bài học về phong trào cách mạng 1930-1931 và Xô Viết Nghệ Tĩnh', 
    'video', 
    N'Bài học phân tích phong trào cách mạng 1930-1931 và Xô Viết Nghệ Tĩnh - đỉnh cao của phong trào cách mạng dưới sự lãnh đạo của Đảng trong những năm đầu mới thành lập.',
    'https://www.youtube.com/watch?v=RLp0nIv1zJE', 
    50, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 2;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Cách mạng Tháng Tám năm 1945', 
    N'Bài học về Cách mạng Tháng Tám năm 1945 và sự thành lập nước Việt Nam Dân chủ Cộng hòa', 
    'video', 
    N'Bài học trình bày quá trình chuẩn bị, diễn biến và thắng lợi của Cách mạng Tháng Tám năm 1945, đỉnh cao là Lễ Tuyên ngôn Độc lập ngày 2/9/1945 và sự ra đời của nước Việt Nam Dân chủ Cộng hòa.',
    'https://www.youtube.com/watch?v=m4VNQ0LmF3U', 
    55, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 2;

-- Thêm các bài học cho Module 3
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Đường lối kháng chiến chống thực dân Pháp', 
    N'Bài học về đường lối kháng chiến chống thực dân Pháp của Đảng', 
    'video', 
    N'Bài học phân tích đường lối kháng chiến toàn dân, toàn diện, trường kỳ của Đảng trong cuộc kháng chiến chống thực dân Pháp, dựa trên tư tưởng "kháng chiến, kiến quốc" của Chủ tịch Hồ Chí Minh.',
    'https://www.youtube.com/watch?v=dQwY7GdQsEk', 
    45, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 3;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Chiến thắng Điện Biên Phủ và Hiệp định Genève 1954', 
    N'Bài học về Chiến thắng Điện Biên Phủ và Hiệp định Genève 1954', 
    'video', 
    N'Bài học giới thiệu chiến dịch Điện Biên Phủ, "trận đánh lớn chưa từng có trong lịch sử chiến tranh giải phóng dân tộc của nhân dân Việt Nam", và Hiệp định Genève 1954, đánh dấu thắng lợi của cuộc kháng chiến chống thực dân Pháp.',
    'https://www.youtube.com/watch?v=UJeKbcFLbIU', 
    50, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 3;

-- Thêm các bài học cho Module 4
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Đường lối kháng chiến chống Mỹ, cứu nước', 
    N'Bài học về đường lối kháng chiến chống Mỹ, cứu nước của Đảng', 
    'video', 
    N'Bài học phân tích đường lối kháng chiến chống Mỹ, cứu nước của Đảng, với chiến lược "đánh lâu dài", kết hợp đấu tranh quân sự, chính trị và ngoại giao, dựa vào sức mạnh toàn dân tộc và sự ủng hộ quốc tế.',
    'https://www.youtube.com/watch?v=lL2TfzLQgc4', 
    40, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 4;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Chiến dịch Hồ Chí Minh và thống nhất đất nước', 
    N'Bài học về Chiến dịch Hồ Chí Minh và thống nhất đất nước', 
    'video', 
    N'Bài học trình bày chiến dịch Hồ Chí Minh lịch sử, giải phóng hoàn toàn miền Nam, thống nhất đất nước và đưa cả nước tiến lên chủ nghĩa xã hội.',
    'https://www.youtube.com/watch?v=GShZXEYxsDQ', 
    45, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 4;

-- Thêm các bài học cho Module 5
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Đường lối đổi mới của Đảng', 
    N'Bài học về đường lối đổi mới của Đảng từ Đại hội VI (1986)', 
    'video', 
    N'Bài học phân tích hoàn cảnh lịch sử, nội dung và ý nghĩa của đường lối đổi mới do Đảng khởi xướng từ Đại hội VI (1986), tập trung vào đổi mới kinh tế, chính trị và đối ngoại.',
    'https://www.youtube.com/watch?v=XHPeRrRXKfU', 
    45, 
    1, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 5;

INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, VideoUrl, Duration, OrderIndex, IsPreview, IsPublished)
SELECT 
    ModuleID, 
    N'Thành tựu, thách thức và triển vọng phát triển đất nước', 
    N'Bài học về thành tựu, thách thức và triển vọng phát triển đất nước trong thời kỳ mới', 
    'video', 
    N'Bài học tổng kết những thành tựu to lớn của công cuộc đổi mới, phân tích các thách thức đang đặt ra và định hướng phát triển đất nước trong thời kỳ mới theo Nghị quyết Đại hội Đảng.',
    'https://www.youtube.com/watch?v=eKmXLWUwIgw', 
    50, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @DangCourseID AND OrderIndex = 5;

-- Script để thêm trường CourseType vào bảng Courses
-- Bước 1: Kiểm tra và thêm cột
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Courses' AND COLUMN_NAME = 'CourseType')
BEGIN
    ALTER TABLE Courses
    ADD CourseType VARCHAR(20) DEFAULT 'it';
    
    PRINT 'Đã thêm cột CourseType vào bảng Courses';
END
ELSE
BEGIN
    PRINT 'Cột CourseType đã tồn tại trong bảng Courses';
END
GO

-- Bước 2: Cập nhật dữ liệu (chỉ chạy nếu CourseType đã tồn tại)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Courses' AND COLUMN_NAME = 'CourseType')
BEGIN
    -- Cập nhật tất cả khóa học thành IT (mặc định)
    UPDATE Courses
    SET CourseType = 'it'
    WHERE CourseType IS NULL OR CourseType = '';
    
    -- Cập nhật các khóa học liên quan đến lịch sử, chính trị thành loại regular
    UPDATE Courses
    SET CourseType = 'regular'
    WHERE Title LIKE N'%lịch sử%' 
       OR Title LIKE N'%tư tưởng%'
       OR Title LIKE N'%chính trị%'
       OR Title LIKE N'%đạo đức%'
       OR Title LIKE N'%triết học%'
       OR Slug LIKE '%lich-su%'
       OR Slug LIKE '%tu-tuong%';
       
    PRINT 'Đã cập nhật dữ liệu CourseType';
END
GO

-- Bước 3: Thêm ràng buộc (nếu chưa có)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Courses' AND COLUMN_NAME = 'CourseType')
   AND NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'CHK_Course_Type' AND type = 'C')
BEGIN
    ALTER TABLE Courses
    ADD CONSTRAINT CHK_Course_Type CHECK (CourseType IN ('it', 'regular'));
    
    PRINT 'Đã thêm ràng buộc CHECK cho CourseType';
END
GO 

use campushubt;

-- Cập nhật đường dẫn ảnh cho khóa học về lịch sử đảng
UPDATE Courses
SET ImageUrl = 'https://snnptnt.binhdinh.gov.vn/upload/images/2(1)(1).jpg',
    CourseType = 'regular'
WHERE Title LIKE N'%lịch sử đảng%' 
   OR Slug LIKE '%lich-su-dang%';

-- Cập nhật đường dẫn ảnh cho khóa học về tư tưởng Hồ Chí Minh
UPDATE Courses
SET ImageUrl = 'https://huyendakto.kontum.gov.vn/Uploads/images/2021/DHDLTI.jpg',
    CourseType = 'regular'
WHERE Title LIKE N'%tư tưởng hồ chí minh%'
   OR Title LIKE N'%Tư tưởng Hồ Chí Minh%'
   OR Slug LIKE '%tu-tuong-ho-chi-minh%';

-- Đảm bảo các khóa học này được phân loại là "regular"
UPDATE Courses
SET CourseType = 'regular'
WHERE Title LIKE N'%lịch sử đảng%' 
   OR Title LIKE N'%tư tưởng hồ chí minh%'
   OR Title LIKE N'%Tư tưởng Hồ Chí Minh%'
   OR Slug LIKE '%lich-su-dang%'
   OR Slug LIKE '%tu-tuong-ho-chi-minh%';

PRINT N'Đã cập nhật đường dẫn ảnh cho khóa học lịch sử đảng và tư tưởng Hồ Chí Minh';
GO 




-- SQL script to create a free C++ course
-- Course specifications:
-- - Original price: 100,000 VND (but free with discount)
-- - Creator ID: 29
-- - Images and videos from internet
-- - Student capacity: 50
-- - Structure: 3 modules, each with 3 videos and 1 practice exercise
use campushubt;
-- Insert the main course record
INSERT INTO Courses (
    Title, 
    Slug, 
    Description, 
    ShortDescription, 
    InstructorID, 
    Level, 
    Category, 
    SubCategory, 
    CourseType,
    Language, 
    Duration, 
    Capacity, 
    Price, 
    DiscountPrice, 
    ImageUrl, 
    VideoUrl, 
    Requirements, 
    Objectives, 
    Syllabus, 
    Status, 
    IsPublished, 
    PublishedAt
) VALUES (
    N'Lập Trình C++ Từ Cơ Bản Đến Nâng Cao', 
    'lap-trinh-cpp-co-ban-den-nang-cao', 
    N'Khóa học cung cấp kiến thức toàn diện về lập trình C++ từ cơ bản đến nâng cao. Bạn sẽ được học về cú pháp, cấu trúc dữ liệu, lập trình hướng đối tượng và các kỹ thuật lập trình hiện đại trong C++. Khóa học được thiết kế với nhiều bài tập thực hành giúp học viên nắm vững kiến thức.',
    N'Khóa học C++ miễn phí dành cho người mới bắt đầu với 3 phần cơ bản, mỗi phần có 3 bài học và 1 bài thực hành.',
    29, -- InstructorID
    'beginner', 
    'programming', 
    'cpp', 
    'it', -- Course type
    'vi', 
    540, -- 9 hours total
    50, -- Capacity: 50 students
    100000, -- Original price: 100,000 VND
    0, -- Discount price: 0 VND (free)
    'https://www.codingninjas.com/blog/wp-content/uploads/2020/07/Blog-Image-C.jpg', 
    'https://www.youtube.com/watch?v=1v_4dL8l8pQ',
    N'[
        "Máy tính cài đặt hệ điều hành Windows, macOS hoặc Linux",
        "Không yêu cầu kinh nghiệm lập trình trước đó",
        "Kiến thức cơ bản về máy tính và sử dụng internet"
    ]',
    N'[
        "Hiểu và sử dụng thành thạo cú pháp C++",
        "Xây dựng các chương trình C++ từ cơ bản đến trung cấp",
        "Nắm vững các khái niệm lập trình hướng đối tượng",
        "Thành thạo cách sử dụng cấu trúc dữ liệu và thuật toán cơ bản",
        "Xây dựng được các ứng dụng thực tế bằng C++"
    ]',
    N'[
        "Phần 1: Cơ bản về C++ và cú pháp",
        "Phần 2: Cấu trúc dữ liệu và thuật toán",
        "Phần 3: Lập trình hướng đối tượng với C++"
    ]',
    'published', 
    1, 
    GETDATE()
);

-- Get the course ID
DECLARE @CPPCourseID BIGINT = SCOPE_IDENTITY();

-- Insert the three modules
-- Module 1: Cơ bản về C++ và cú pháp
INSERT INTO CourseModules (
    CourseID, 
    Title, 
    Description, 
    OrderIndex, 
    Duration, 
    IsPublished, 
    CreatedAt, 
    UpdatedAt, 
    VideoUrl, 
    ImageUrl, 
    PracticalGuide, 
    Objectives, 
    Requirements, 
    Materials, 
    IsDraft
) VALUES (
    @CPPCourseID, 
    N'Cơ bản về C++ và cú pháp', 
    N'Module này giới thiệu về ngôn ngữ C++, cách cài đặt môi trường phát triển, cú pháp cơ bản, biến, kiểu dữ liệu, toán tử và cấu trúc điều khiển.',
    1, 
    180, 
    1, 
    GETDATE(), 
    GETDATE(), 
    'https://www.youtube.com/watch?v=1v_4dL8l8pQ', 
    'https://www.simplilearn.com/ice9/free_resources_article_thumb/C_Plus_Plus_Programming_Language.jpg',
    N'- Cài đặt IDE cho C++ (Visual Studio, Code::Blocks)\n- Cấu trúc chương trình C++ cơ bản\n- Thực hành với biến và kiểu dữ liệu\n- Làm quen với cú pháp điều khiển', 
    N'["Cài đặt và sử dụng được môi trường phát triển C++", "Hiểu cú pháp cơ bản của C++", "Viết được chương trình C++ đơn giản"]',
    N'["Máy tính cài hệ điều hành Windows, macOS hoặc Linux", "Kiến thức cơ bản về sử dụng máy tính"]',
    N'["Visual Studio Community Edition", "Code::Blocks", "Tài liệu cú pháp C++"]', 
    0
);

-- Module 2: Cấu trúc dữ liệu và thuật toán
INSERT INTO CourseModules (
    CourseID, 
    Title, 
    Description, 
    OrderIndex, 
    Duration, 
    IsPublished, 
    CreatedAt, 
    UpdatedAt, 
    VideoUrl, 
    ImageUrl, 
    PracticalGuide, 
    Objectives, 
    Requirements, 
    Materials, 
    IsDraft
) VALUES (
    @CPPCourseID, 
    N'Cấu trúc dữ liệu và thuật toán', 
    N'Module này tập trung vào các cấu trúc dữ liệu cơ bản trong C++ như mảng, vector, danh sách liên kết, và một số thuật toán cơ bản về sắp xếp và tìm kiếm.',
    2, 
    180, 
    1, 
    GETDATE(), 
    GETDATE(), 
    'https://www.youtube.com/watch?v=B31LgI4Y4DQ', 
    'https://thecodeprogram.com/img/contents/data-structure-linked-list.jpg',
    N'- Làm việc với mảng và vector\n- Xây dựng danh sách liên kết\n- Cài đặt thuật toán sắp xếp\n- Thực hành thuật toán tìm kiếm', 
    N'["Hiểu và sử dụng được các cấu trúc dữ liệu cơ bản", "Cài đặt được các thuật toán sắp xếp và tìm kiếm", "Phân tích được hiệu năng thuật toán"]',
    N'["Hoàn thành Module 1", "Hiểu cú pháp cơ bản của C++"]',
    N'["STL (Standard Template Library)", "Tài liệu về cấu trúc dữ liệu", "Ví dụ code minh họa"]', 
    0
);

-- Module 3: Lập trình hướng đối tượng với C++
INSERT INTO CourseModules (
    CourseID, 
    Title, 
    Description, 
    OrderIndex, 
    Duration, 
    IsPublished, 
    CreatedAt, 
    UpdatedAt, 
    VideoUrl, 
    ImageUrl, 
    PracticalGuide, 
    Objectives, 
    Requirements, 
    Materials, 
    IsDraft
) VALUES (
    @CPPCourseID, 
    N'Lập trình hướng đối tượng với C++', 
    N'Module này giới thiệu về lập trình hướng đối tượng trong C++, bao gồm các khái niệm về lớp, đối tượng, kế thừa, đa hình, và khuôn hình.',
    3, 
    180, 
    1, 
    GETDATE(), 
    GETDATE(), 
    'https://www.youtube.com/watch?v=SiBw7os-_zI', 
    'https://media.geeksforgeeks.org/wp-content/uploads/OOPs-Concepts.jpg',
    N'- Xây dựng class và object\n- Thực hành kế thừa và đa hình\n- Sử dụng templates\n- Xây dựng ứng dụng OOP hoàn chỉnh', 
    N'["Hiểu các nguyên lý OOP trong C++", "Thiết kế và xây dựng được chương trình OOP", "Sử dụng được kế thừa và đa hình"]',
    N'["Hoàn thành Module 1 và 2", "Hiểu cú pháp cơ bản và cấu trúc dữ liệu C++"]',
    N'["Tài liệu về OOP", "Mẫu thiết kế (Design Patterns)", "Ví dụ ứng dụng thực tế"]', 
    0
);

-- Insert video lessons for Module 1
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Giới thiệu C++ và cài đặt môi trường', 
    N'Bài học giới thiệu về ngôn ngữ C++ và hướng dẫn cài đặt môi trường phát triển', 
    'video', 
    N'Bài học này giới thiệu về ngôn ngữ C++, lịch sử phát triển, và các ứng dụng phổ biến. Hướng dẫn cài đặt các IDE phổ biến như Visual Studio, Code::Blocks, và cách cấu hình để bắt đầu lập trình.',
    'https://www.youtube.com/watch?v=1v_4dL8l8pQ', 
    45, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 1;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Biến, kiểu dữ liệu và toán tử', 
    N'Bài học về biến, các kiểu dữ liệu và toán tử trong C++', 
    'video', 
    N'Bài học này tìm hiểu về cách khai báo biến, các kiểu dữ liệu cơ bản (int, float, double, char, bool), phạm vi của biến, và các toán tử số học, so sánh và logic trong C++.',
    'https://www.youtube.com/watch?v=uhFpPlMsLzY', 
    60, 
    2, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 1;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Cấu trúc điều khiển', 
    N'Bài học về các cấu trúc điều khiển trong C++', 
    'video', 
    N'Bài học này tìm hiểu về các cấu trúc điều khiển trong C++ bao gồm if-else, switch-case, vòng lặp for, while, do-while, và các câu lệnh break, continue.',
    'https://www.youtube.com/watch?v=qEgCT87KOfc', 
    60, 
    3, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 1;

-- Insert video lessons for Module 2
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Mảng và Vector', 
    N'Bài học về mảng và vector trong C++', 
    'video', 
    N'Bài học này tìm hiểu về cách sử dụng mảng một chiều, mảng đa chiều và vector trong C++. Các thao tác cơ bản như khởi tạo, truy cập phần tử, thêm, xóa và duyệt mảng/vector.',
    'https://www.youtube.com/watch?v=B31LgI4Y4DQ', 
    45, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 2;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Danh sách liên kết', 
    N'Bài học về danh sách liên kết trong C++', 
    'video', 
    N'Bài học này giới thiệu về cấu trúc dữ liệu danh sách liên kết, cách cài đặt danh sách liên kết đơn, danh sách liên kết đôi và các thao tác cơ bản như thêm, xóa, tìm kiếm phần tử.',
    'https://www.youtube.com/watch?v=HKfj0l7ndbc', 
    60, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 2;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Thuật toán sắp xếp và tìm kiếm', 
    N'Bài học về các thuật toán sắp xếp và tìm kiếm trong C++', 
    'video', 
    N'Bài học này tìm hiểu về các thuật toán sắp xếp (bubble sort, selection sort, insertion sort, quick sort) và thuật toán tìm kiếm (tìm kiếm tuyến tính, tìm kiếm nhị phân) trong C++.',
    'https://www.youtube.com/watch?v=pkkFqlG0Hds', 
    60, 
    3, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 2;

-- Insert video lessons for Module 3
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Lớp và đối tượng', 
    N'Bài học về lớp và đối tượng trong C++', 
    'video', 
    N'Bài học này giới thiệu về khái niệm lớp và đối tượng trong C++, cách khai báo lớp, tạo đối tượng, các thuộc tính và phương thức của lớp, constructor và destructor.',
    'https://www.youtube.com/watch?v=SiBw7os-_zI', 
    45, 
    1, 
    1, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 3;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Kế thừa và đa hình', 
    N'Bài học về kế thừa và đa hình trong C++', 
    'video', 
    N'Bài học này tìm hiểu về kế thừa đơn, kế thừa đa cấp, kế thừa nhiều lớp, và đa hình trong C++. Cách sử dụng từ khóa virtual, override và các phương thức ảo.',
    'https://www.youtube.com/watch?v=wN0x9eZLix4', 
    60, 
    2, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 3;

INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    VideoUrl, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Templates và STL', 
    N'Bài học về templates và thư viện STL trong C++', 
    'video', 
    N'Bài học này giới thiệu về templates trong C++, cách sử dụng thư viện chuẩn STL (Standard Template Library) với các container, iterator, và algorithm phổ biến như vector, list, map, set.',
    'https://www.youtube.com/watch?v=LyGlTmaWEPs', 
    60, 
    3, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 3;

-- Insert practice lessons for Module 1
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Bài thực hành: Cú pháp cơ bản C++', 
    N'Bài thực hành về cú pháp cơ bản của C++', 
    'coding', 
    N'// Bài tập 1: Viết chương trình tính tổng 2 số
// Bài tập 2: Viết chương trình kiểm tra số chẵn lẻ
// Bài tập 3: Viết chương trình tính giai thừa của một số
// Bài tập 4: Viết chương trình tìm số lớn nhất trong 3 số
// Bài tập 5: Viết chương trình in ra bảng cửu chương', 
    60, 
    4, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 1;

-- Insert practice lessons for Module 2
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Bài thực hành: Cấu trúc dữ liệu và thuật toán', 
    N'Bài thực hành về cấu trúc dữ liệu và thuật toán trong C++', 
    'coding', 
    N'// Bài tập 1: Cài đặt thuật toán sắp xếp nổi bọt (Bubble Sort)
// Bài tập 2: Cài đặt thuật toán tìm kiếm nhị phân (Binary Search)
// Bài tập 3: Xây dựng cấu trúc danh sách liên kết đơn
// Bài tập 4: Thao tác với vector - thêm, xóa, sắp xếp và tìm kiếm
// Bài tập 5: Giải quyết bài toán đếm tần suất xuất hiện các phần tử trong mảng', 
    60, 
    4, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 2;

-- Insert practice lessons for Module 3
INSERT INTO CourseLessons (
    ModuleID, 
    Title, 
    Description, 
    Type, 
    Content, 
    Duration, 
    OrderIndex, 
    IsPreview, 
    IsPublished
) 
SELECT 
    ModuleID, 
    N'Bài thực hành: Lập trình hướng đối tượng', 
    N'Bài thực hành về lập trình hướng đối tượng trong C++', 
    'coding', 
    N'// Bài tập 1: Xây dựng lớp Hình học với các phương thức tính diện tích và chu vi
// Bài tập 2: Cài đặt hệ thống quản lý sinh viên với các lớp Sinh viên, Khoa, Môn học
// Bài tập 3: Xây dựng ứng dụng ngân hàng với tính năng kế thừa và đa hình
// Bài tập 4: Sử dụng templates để xây dựng cấu trúc Stack và Queue
// Bài tập 5: Xây dựng ứng dụng quản lý thư viện với các lớp Sách, Tác giả, Độc giả', 
    60, 
    4, 
    0, 
    1
FROM CourseModules 
WHERE CourseID = @CPPCourseID AND OrderIndex = 3;

-- Insert coding exercises for practice lessons
-- Get the lesson IDs for practice lessons
DECLARE @Module1PracticeID BIGINT;
DECLARE @Module2PracticeID BIGINT;
DECLARE @Module3PracticeID BIGINT;

SELECT @Module1PracticeID = LessonID FROM CourseLessons 
WHERE Title = N'Bài thực hành: Cú pháp cơ bản C++' AND Type = 'coding';

SELECT @Module2PracticeID = LessonID FROM CourseLessons 
WHERE Title = N'Bài thực hành: Cấu trúc dữ liệu và thuật toán' AND Type = 'coding';

SELECT @Module3PracticeID = LessonID FROM CourseLessons 
WHERE Title = N'Bài thực hành: Lập trình hướng đối tượng' AND Type = 'coding';

-- Insert coding exercise for Module 1
INSERT INTO CodingExercises (
    LessonID, 
    Title, 
    Description, 
    ProgrammingLanguage, 
    InitialCode, 
    SolutionCode, 
    TestCases, 
    TimeLimit, 
    MemoryLimit, 
    Difficulty, 
    Points
) VALUES (
    @Module1PracticeID,
    N'Tính tổng hai số',
    N'Viết một chương trình C++ tính tổng của hai số nguyên',
    'cpp',
    N'#include <iostream>
using namespace std;

// Viết hàm tính tổng hai số nguyên
int sum(int a, int b) {
    // Viết code của bạn ở đây
    return 0;
}

int main() {
    int a, b;
    cin >> a >> b;
    cout << sum(a, b) << endl;
    return 0;}',
    N'#include <iostream>
using namespace std;

int sum(int a, int b) {
    return a + b;
}

int main() {
    int a, b;
    cin >> a >> b;
    cout << sum(a, b) << endl;
    return 0;}',
    N'[
        {"input": "5 7", "expected": "12", "isHidden": false},
        {"input": "10 20", "expected": "30", "isHidden": false},
        {"input": "-3 8", "expected": "5", "isHidden": true},
        {"input": "0 0", "expected": "0", "isHidden": true}
    ]',
    1000,
    256,
    'easy',
    5
);

-- Insert coding exercise for Module 2
INSERT INTO CodingExercises (
    LessonID, 
    Title, 
    Description, 
    ProgrammingLanguage, 
    InitialCode, 
    SolutionCode, 
    TestCases, 
    TimeLimit, 
    MemoryLimit, 
    Difficulty, 
    Points
) VALUES (
    @Module2PracticeID,
    N'Sắp xếp mảng',
    N'Cài đặt thuật toán Bubble Sort để sắp xếp mảng theo thứ tự tăng dần',
    'cpp',
    N'#include <iostream>
using namespace std;

// Viết hàm sắp xếp mảng sử dụng thuật toán Bubble Sort
void bubbleSort(int arr[], int n) {
    // Viết code của bạn ở đây
}

int main() {
    int n;
    cin >> n;
    int arr[100];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    bubbleSort(arr, n);
    
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    
    return 0;}',
    N'#include <iostream>
using namespace std;

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                // Hoán đổi arr[j] và arr[j+1]
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}

int main() {
    int n;
    cin >> n;
    int arr[100];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    
    bubbleSort(arr, n);
    
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    
    return 0;}',
    N'[
        {"input": "5\n5 4 3 2 1", "expected": "1 2 3 4 5 ", "isHidden": false},
        {"input": "4\n9 1 7 3", "expected": "1 3 7 9 ", "isHidden": false},
        {"input": "3\n5 5 5", "expected": "5 5 5 ", "isHidden": true},
        {"input": "6\n10 -5 8 0 3 1", "expected": "-5 0 1 3 8 10 ", "isHidden": true}
    ]',
    1000,
    256,
    'medium',
    10
);

-- Insert coding exercise for Module 3
INSERT INTO CodingExercises (
    LessonID, 
    Title, 
    Description, 
    ProgrammingLanguage, 
    InitialCode, 
    SolutionCode, 
    TestCases, 
    TimeLimit, 
    MemoryLimit, 
    Difficulty, 
    Points
) VALUES (
    @Module3PracticeID,
    N'Lớp Hình Chữ Nhật',
    N'Xây dựng lớp Hình Chữ Nhật với các phương thức tính chu vi và diện tích',
    'cpp',
    N'#include <iostream>
using namespace std;

// Xây dựng lớp Rectangle (Hình chữ nhật) với:
// - Thuộc tính: chiều dài và chiều rộng
// - Phương thức: tính chu vi và diện tích
class Rectangle {
private:
    // Khai báo thuộc tính ở đây
public:
    // Hàm khởi tạo
    Rectangle(double l, double w) {
        // Viết code của bạn ở đây
    }
    
    // Phương thức tính chu vi
    double perimeter() {
        // Viết code của bạn ở đây
        return 0;
    }
    
    // Phương thức tính diện tích
    double area() {
        // Viết code của bạn ở đây
        return 0;
    }
};

int main() {
    double length, width;
    cin >> length >> width;
    
    Rectangle rect(length, width);
    cout << rect.perimeter() << endl;
    cout << rect.area() << endl;
    
    return 0;}',
    N'#include <iostream>
using namespace std;

class Rectangle {
private:
    double length;
    double width;
public:
    Rectangle(double l, double w) {
        length = l;
        width = w;
    }
    
    double perimeter() {
        return 2 * (length + width);
    }
    
    double area() {
        return length * width;
    }
};

int main() {
    double length, width;
    cin >> length >> width;
    
    Rectangle rect(length, width);
    cout << rect.perimeter() << endl;
    cout << rect.area() << endl;
    
    return 0;}',
    N'[
        {"input": "5 3", "expected": "16\n15", "isHidden": false},
        {"input": "10 7", "expected": "34\n70", "isHidden": false},
        {"input": "2.5 4", "expected": "13\n10", "isHidden": true},
        {"input": "0 0", "expected": "0\n0", "isHidden": true}
    ]',
    1000,
    256,
    'medium',
    15
);

-- Set free payment transaction method for this course
INSERT INTO PaymentTransactions (
    UserID,
    CourseID,
    Amount,
    PaymentMethod,
    PaymentStatus,
    PaymentDate,
    CreatedAt,
    UpdatedAt
) VALUES (
    29, -- Same as instructor ID
    @CPPCourseID,
    0, -- Free course
    'free',
    'completed',
    GETDATE(),
    GETDATE(),
    GETDATE()
);

-- Add payment history record
INSERT INTO PaymentHistory (
    TransactionID,
    Status,
    Message,
    CreatedAt
) VALUES (
    SCOPE_IDENTITY(), -- Get transaction ID from previous insert
    'completed',
    N'Khóa học miễn phí được tạo thành công',
    GETDATE()
);

PRINT N'Đã tạo thành công khóa học C++ miễn phí với 3 module và các bài học!'; 




INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, InstructorID,
    Level, Category, SubCategory, CourseType, Language,
    Duration, Capacity, EnrolledCount, Rating, RatingCount,
    Price, DiscountPrice, ImageUrl, VideoUrl,
    Requirements, Objectives, Syllabus, Status, IsPublished,
    PublishedAt
)
VALUES (
    N'Lập trình Java Spring Boot cơ bản',
    'lap-trinh-java-spring-boot-co-ban',
    N'Khóa học cung cấp kiến thức nền tảng về Java Spring Boot, giúp bạn xây dựng ứng dụng web RESTful từ A đến Z.',
    N'Khóa học miễn phí về Java Spring Boot cho người mới bắt đầu',
    1, -- giả định InstructorID = 1
    'beginner',
    'backend',
    'java',
    'it',
    'vi',
    180, -- tổng thời lượng tạm tính
    100,
    0,
    0,
    0,
    0,
    0,
    'https://example.com/images/java-springboot-cover.jpg',
    'https://www.youtube.com/watch?v=vtPkZShrvXQ', -- video giới thiệu
    N'Biết lập trình Java cơ bản',
    N'Hiểu về Spring Boot và tạo REST API',
    N'[{"part": 1, "title": "Nhập môn Spring"}, {"part": 2, "title": "REST API"}, {"part": 3, "title": "Thực hành"}]',
    'published',
    1,
    GETDATE()
);
DECLARE @CourseID BIGINT = SCOPE_IDENTITY();
-- Module 1: Nhập môn Spring Boot
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES (@CourseID, N'Giới thiệu Spring Boot', N'Phần này giới thiệu framework Spring Boot và môi trường phát triển.', 1, 60, 1);

DECLARE @ModuleID1 BIGINT = SCOPE_IDENTITY();

-- 2 bài học
INSERT INTO CourseLessons (ModuleID, Title, Type, Description, Duration, OrderIndex, IsPublished)
VALUES
(@ModuleID1, N'Cài đặt môi trường Java & Spring Boot', 'video', N'Hướng dẫn cài đặt JDK, Maven và Spring Initializr', 15, 1, 1),
(@ModuleID1, N'Cấu trúc project Spring Boot', 'text', N'Giải thích cấu trúc thư mục của project Spring Boot', 10, 2, 1);

-- Thêm bài thực hành
INSERT INTO ModulePractices (ModuleID, Title, Description, ProgrammingLanguage, InitialCode)
VALUES (@ModuleID1, N'Tạo project Spring Boot đầu tiên', N'Thực hành tạo ứng dụng Spring Boot đơn giản', 'java', 'public class HelloSpring {}');

DECLARE @PracticeID1 BIGINT = SCOPE_IDENTITY();

-- Test case
INSERT INTO PracticeTestCases (PracticeID, Input, ExpectedOutput, OrderIndex)
VALUES (@PracticeID1, '', 'HelloSpring', 1);

-- Module 2: Xây dựng REST API
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES (@CourseID, N'Tạo REST API', N'Hướng dẫn tạo REST API với Spring Boot', 2, 60, 1);

DECLARE @ModuleID2 BIGINT = SCOPE_IDENTITY();

INSERT INTO CourseLessons (ModuleID, Title, Type, Description, Duration, OrderIndex, IsPublished)
VALUES
(@ModuleID2, N'Tạo controller đơn giản', 'coding', N'Hướng dẫn tạo REST controller', 20, 1, 1),
(@ModuleID2, N'Model & Repository', 'text', N'Cách tạo class model và repository', 15, 2, 1);

INSERT INTO ModulePractices (ModuleID, Title, Description, ProgrammingLanguage, InitialCode)
VALUES (@ModuleID2, N'API Get User', N'Tạo API trả về danh sách người dùng', 'java', 'public List<User> getUsers() { return new ArrayList<>(); }');

DECLARE @PracticeID2 BIGINT = SCOPE_IDENTITY();

INSERT INTO PracticeTestCases (PracticeID, Input, ExpectedOutput, OrderIndex)
VALUES (@PracticeID2, '', '[{"id":1,"name":"John"}]', 1);


-- Module 3: Thực hành dự án mini
INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
VALUES (@CourseID, N'Dự án mini', N'Tổng hợp kiến thức đã học để xây dựng ứng dụng REST hoàn chỉnh', 3, 60, 1);

DECLARE @ModuleID3 BIGINT = SCOPE_IDENTITY();

INSERT INTO CourseLessons (ModuleID, Title, Type, Description, Duration, OrderIndex, IsPublished)
VALUES
(@ModuleID3, N'Thiết kế API với Swagger', 'video', N'Dùng Swagger để thiết kế và test REST API', 15, 1, 1),
(@ModuleID3, N'Xử lý lỗi trong Spring', 'text', N'Sử dụng @ExceptionHandler trong Spring', 10, 2, 1);

INSERT INTO ModulePractices (ModuleID, Title, Description, ProgrammingLanguage, InitialCode)
VALUES (@ModuleID3, N'Tích hợp Swagger UI', N'Tích hợp Swagger UI vào dự án REST', 'java', '@Configuration\n@EnableSwagger2');

DECLARE @PracticeID3 BIGINT = SCOPE_IDENTITY();

INSERT INTO PracticeTestCases (PracticeID, Input, ExpectedOutput, OrderIndex)
VALUES (@PracticeID3, '', 'Swagger UI Loaded', 1);


UPDATE Courses
SET Price = 0, DiscountPrice = 0;


DECLARE @ModuleID INT;

INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, Duration, IsPublished)
OUTPUT INSERTED.ID INTO @ModuleID
VALUES (12, N'C++ Cơ bản', N'Nội dung mô tả...', 1, 60, 1);

-- Tiếp tục dùng @ModuleID để thêm bài học
INSERT INTO CourseLessons (ModuleID, Title, Description, Type, Content, Duration, OrderIndex, IsPublished)
VALUES (@ModuleID, N'Giới thiệu C++', N'...', 'text', N'...', 15, 1, 1);



select * from CourseLessons;