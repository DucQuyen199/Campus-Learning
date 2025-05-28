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

use campushubt;
-- Thêm khóa học với các bài thực hành đầy đủ
-- Thêm khóa học với InstructorID là NULL
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, 
    InstructorID, Level, Category, SubCategory, 
    CourseType, Language, Duration, Capacity, 
    Price, ImageUrl, VideoUrl, Requirements, Objectives,
    Status, IsPublished, PublishedAt
)
VALUES (
    'Lập Trình Web Fullstack', 
    'lap-trinh-web-fullstack', 
    '<p>Khóa học giúp bạn trở thành lập trình viên Fullstack với JavaScript, từ Frontend với React đến Backend với Node.js. Khóa học bao gồm các bài tập thực hành và dự án thực tế để nâng cao kỹ năng của bạn.</p><p>Bạn sẽ học cách xây dựng ứng dụng web hoàn chỉnh từ giao diện người dùng đến API và cơ sở dữ liệu.</p>', 
    'Trở thành lập trình viên Fullstack với JavaScript, React và Node.js',
    NULL, -- InstructorID là NULL
    'intermediate', 
    'Lập trình', 
    'Web Development',
    'regular', 
    'vi', 
    1800, -- 30 giờ
    200,
    0, -- Giá đầy đủ
    'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    '["Kiến thức cơ bản về HTML, CSS và JavaScript", "Máy tính có kết nối internet", "Hiểu biết cơ bản về lập trình"]',
    '["Xây dựng ứng dụng web đầy đủ với React", "Phát triển RESTful API với Node.js và Express", "Thiết kế và quản lý cơ sở dữ liệu", "Triển khai ứng dụng web lên môi trường thực tế"]',
    'published',
    1,
    GETDATE()
);

-- Lấy CourseID vừa thêm
DECLARE @CourseID BIGINT;
SELECT @CourseID = SCOPE_IDENTITY();

-- MODULE 1: Giới thiệu về Web Development
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Giới thiệu về Web Development',
    'Module này giới thiệu tổng quan về lập trình web và các công nghệ cơ bản.',
    1,
    120, -- 2 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/gXLjWRteuWI',
    'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    'Tìm hiểu cách web hoạt động và các công nghệ cần thiết.',
    'Hiểu được cách internet và web hoạt động, các công nghệ cơ bản.',
    'Máy tính có kết nối internet.',
    'Tài liệu giới thiệu về web, slides, và code mẫu.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module1ID BIGINT;
SELECT @Module1ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Tổng quan về lập trình web',
    'Bài học giới thiệu về lập trình web và hành trình từ Frontend đến Backend.',
    'video',
    NULL,
    'https://www.youtube.com/embed/gXLjWRteuWI',
    30, -- 30 phút
    1,
    1, -- Đây là bài preview
    1  -- Đã publish
);

-- Bài 2: Lý thuyết
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    N'Các công nghệ web hiện đại',
    N'Tìm hiểu về các công nghệ web phổ biến hiện nay.',
    'text',
    '<h3>Công nghệ Frontend</h3><p>React, Vue, Angular là ba framework phổ biến nhất hiện nay.</p><h3>Công nghệ Backend</h3><p>Node.js, Django, Ruby on Rails là các lựa chọn hàng đầu.</p>',
    20, -- 20 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập coding - Bao gồm hướng dẫn trong Content
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    N'Bài tập thực hành: Tạo trang HTML đầu tiên',
    N'Bài tập thực hành tạo trang HTML đơn giản.',
    'coding',
    '<p>Hãy tạo một trang HTML đơn giản với tiêu đề và đoạn văn bản.</p><p><strong>Yêu cầu:</strong></p><ul><li>Tạo file HTML với tiêu đề "Hello Web"</li><li>Thêm một đoạn văn "Đây là trang web đầu tiên của tôi"</li><li>Sử dụng thẻ h1 cho tiêu đề chính</li></ul>',
    25, -- 25 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson3ID BIGINT;
SELECT @Lesson3ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson3ID,
    N'Tạo trang HTML đầu tiên',
    N'Hãy tạo một trang HTML với tiêu đề "Hello Web" và đoạn văn "Đây là trang web đầu tiên của tôi".',
    'html',
    '<!DOCTYPE html>\n<html>\n<head>\n  <title></title>\n</head>\n<body>\n  <!-- Thêm nội dung tại đây -->\n  \n</body>\n</html>',
    '<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello Web</title>\n</head>\n<body>\n  <h1>Hello Web</h1>\n  <p>Đây là trang web đầu tiên của tôi</p>\n</body>\n</html>',
    '[{"input":"","expectedOutput":"<title>Hello Web</title>.*<h1>Hello Web</h1>.*<p>Đây là trang web đầu tiên của tôi</p>"}]',
    'easy',
    10
);

-- MODULE 2: JavaScript cơ bản
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    N'JavaScript cơ bản',
    N'Module này giới thiệu về JavaScript, ngôn ngữ lập trình phổ biến nhất trên web.',
    2,
    240, -- 4 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/hdI2bqOjy3c',
    'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
    N'Luyện tập JavaScript từ cơ bản đến nâng cao.',
    N'Hiểu và sử dụng được JavaScript cho các ứng dụng web.',
    N'Kiến thức cơ bản về HTML và CSS.',
    N'Code mẫu, bài tập và quiz.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module2ID BIGINT;
SELECT @Module2ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu JavaScript
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    N'Giới thiệu JavaScript',
    N'Tìm hiểu về JavaScript và tại sao nó quan trọng.',
    'video',
    NULL,
    'https://www.youtube.com/embed/hdI2bqOjy3c',
    35, -- 35 phút
    1,
    1, -- Đây là bài preview
    1  -- Đã publish
);

-- Bài 2: Biến và kiểu dữ liệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    N'Biến và kiểu dữ liệu trong JavaScript',
    N'Học về cách khai báo biến và các kiểu dữ liệu trong JavaScript.',
    'text',
    '<h3>Biến trong JavaScript</h3><p>JavaScript có ba cách khai báo biến: var, let và const.</p><pre>let name = "John";\nconst age = 30;\nvar isStudent = true;</pre><h3>Kiểu dữ liệu</h3><p>JavaScript có các kiểu dữ liệu: String, Number, Boolean, Object, Array, null và undefined.</p>',
    40, -- 40 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập JavaScript - Đưa các chỉ dẫn vào Content
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    N'Bài tập thực hành: Tính tổng các số trong mảng',
    N'Bài tập thực hành về mảng và vòng lặp trong JavaScript.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Viết một hàm có tên <code>sumArray</code> nhận vào một mảng số nguyên và trả về tổng của tất cả các phần tử trong mảng đó.</p><h4>Ví dụ:</h4><ul><li>Input: <code>[1, 2, 3, 4]</code> => Output: <code>10</code></li><li>Input: <code>[10, 20, 30]</code> => Output: <code>60</code></li><li>Input: <code>[-5, 10, -15, 20]</code> => Output: <code>10</code></li></ul><p>// Bài tập 1: Viết hàm tính tổng mảng\n// Test cases: [1,2,3,4] -> 10, [10,20,30] -> 60, [-5,10,-15,20] -> 10</p>',
    45, -- 45 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson6ID BIGINT;
SELECT @Lesson6ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson6ID,
    N'Tính tổng các số trong mảng',
    N'Viết hàm sumArray nhận vào một mảng số và trả về tổng của chúng.',
    'javascript',
    '// Viết hàm tính tổng các số trong mảng\nfunction sumArray(numbers) {\n  // Viết code của bạn ở đây\n  \n}\n\n// Ví dụ: sumArray([1, 2, 3, 4]) sẽ trả về 10',
    'function sumArray(numbers) {\n  let sum = 0;\n  for (let i = 0; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum;\n}',
    '[{"input":"[1, 2, 3, 4]","expectedOutput":"10"},{"input":"[10, 20, 30]","expectedOutput":"60"},{"input":"[-5, 10, -15, 20]","expectedOutput":"10"}]',
    'medium',
    20
);

-- MODULE 3: React Basics
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    N'React Cơ Bản',
    N'Module này giới thiệu về React, thư viện JavaScript phổ biến để xây dựng giao diện người dùng.',
    3,
    300, -- 5 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/w7ejDZ8SWv8',
    'https://images.pexels.com/photos/11035474/pexels-photo-11035474.jpeg',
    N'Xây dựng các component trong React và quản lý state.',
    N'Hiểu cách React hoạt động và xây dựng ứng dụng web với React.',
    N'Kiến thức vững về JavaScript, HTML và CSS.',
    N'Code mẫu, bài tập và tài liệu tham khảo.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module3ID BIGINT;
SELECT @Module3ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu React
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    N'Giới thiệu về React',
    N'Hiểu về React và cách nó thay đổi cách tiếp cận phát triển web.',
    'video',
    NULL,
    'https://www.youtube.com/embed/w7ejDZ8SWv8',
    40, -- 40 phút
    1,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 2: Bài tập React Component - đưa hướng dẫn vào Content
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    N'Bài tập thực hành: Tạo React Component đầu tiên',
    N'Thực hành tạo và sử dụng component trong React.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Tạo một React component có tên <code>UserProfile</code> nhận vào 3 props:</p><ul><li><code>name</code>: Tên người dùng</li><li><code>email</code>: Email của người dùng</li><li><code>avatar</code>: URL ảnh đại diện</li></ul><p>Component cần hiển thị:</p><ul><li>Ảnh đại diện với alt text là tên người dùng</li><li>Tên người dùng trong thẻ h3</li><li>Email trong thẻ p</li></ul><p>Tất cả được bọc trong một div với className="user-profile"</p><p>// Bài tập 1: Tạo Component UserProfile\n// Hiển thị thông tin người dùng như tên, email và avatar</p>',
    60, -- 60 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson8ID BIGINT;
SELECT @Lesson8ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học với cấu trúc phù hợp
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson8ID,
    N'Tạo React Component hiển thị thông tin người dùng',
    N'Tạo một React component để hiển thị thông tin người dùng bao gồm tên, email và avatar.',
    'javascript',
    'import React from "react";\n\n// Tạo component UserProfile\nconst UserProfile = (props) => {\n  // Viết code ở đây\n  \n};\n\nexport default UserProfile;',
    'import React from "react";\n\nconst UserProfile = ({ name, email, avatar }) => {\n  return (\n    <div className="user-profile">\n      <img src={avatar} alt={name} />\n      <h3>{name}</h3>\n      <p>{email}</p>\n    </div>\n  );\n};\n\nexport default UserProfile;',
    '[{"input":"","expectedOutput":"<div className=\\"user-profile\\">.*<img src=\\{avatar\\} alt=\\{name\\} />.*<h3>\\{name\\}</h3>.*<p>\\{email\\}</p>.*</div>"}]',
    'medium',
    30
);

-- Bài 3: Thêm bài tập thực hành Todo App - đưa mã mẫu vào mô tả
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    N'Bài tập thực hành: Xây dựng Todo App với React',
    N'Xây dựng ứng dụng Todo List đơn giản với React Hooks.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Xây dựng ứng dụng Todo List với các chức năng:</p><ul><li>Thêm công việc mới</li><li>Đánh dấu công việc đã hoàn thành</li><li>Xóa công việc</li></ul><p>Sử dụng React Hooks:</p><ul><li>useState để quản lý danh sách todo và input</li><li>Tạo các hàm xử lý sự kiện cho các chức năng</li></ul><p>// Bài tập 1: Todo List App\n// Tạo ứng dụng quản lý công việc đơn giản</p>',
    90, -- 90 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson9ID BIGINT;
SELECT @Lesson9ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài Todo App - bao gồm mã mẫu trong InitialCode
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson9ID,
    N'Xây dựng ứng dụng Todo List với React',
    N'Xây dựng ứng dụng Todo List đơn giản sử dụng React hooks.',
    'javascript',
    'import React, { useState } from "react";\n\nconst TodoApp = () => {\n  // Tạo state cho danh sách todo\n  const [todos, setTodos] = useState([]);\n  \n  // Tạo state cho input text\n  const [inputText, setInputText] = useState("");\n  \n  // Hàm thêm todo mới\n  const addTodo = () => {\n    // Viết code thêm todo mới vào danh sách\n    \n  };\n  \n  // Hàm đánh dấu todo đã hoàn thành\n  const toggleTodo = (index) => {\n    // Viết code đánh dấu todo hoàn thành\n    \n  };\n  \n  // Hàm xóa todo\n  const deleteTodo = (index) => {\n    // Viết code xóa todo\n    \n  };\n  \n  return (\n    <div className="todo-app">\n      <h1>Todo List</h1>\n      \n      {/* Form thêm todo */}\n      <div className="input-container">\n        <input\n          type="text"\n          value={inputText}\n          onChange={(e) => setInputText(e.target.value)}\n          placeholder="Thêm công việc mới..."\n        />\n        <button onClick={addTodo}>Thêm</button>\n      </div>\n      \n      {/* Danh sách todo */}\n      <ul className="todo-list">\n        {todos.map((todo, index) => (\n          <li key={index} className={todo.completed ? "completed" : ""}>\n            <span onClick={() => toggleTodo(index)}>{todo.text}</span>\n            <button onClick={() => deleteTodo(index)}>Xóa</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n};\n\nexport default TodoApp;',
    'import React, { useState } from "react";\n\nconst TodoApp = () => {\n  const [todos, setTodos] = useState([]);\n  const [inputText, setInputText] = useState("");\n  \n  const addTodo = () => {\n    if (inputText.trim() !== "") {\n      setTodos([...todos, { text: inputText, completed: false }]);\n      setInputText("");\n    }\n  };\n  \n  const toggleTodo = (index) => {\n    const newTodos = [...todos];\n    newTodos[index].completed = !newTodos[index].completed;\n    setTodos(newTodos);\n  };\n  \n  const deleteTodo = (index) => {\n    const newTodos = todos.filter((_, i) => i !== index);\n    setTodos(newTodos);\n  };\n  \n  return (\n    <div className="todo-app">\n      <h1>Todo List</h1>\n      \n      <div className="input-container">\n        <input\n          type="text"\n          value={inputText}\n          onChange={(e) => setInputText(e.target.value)}\n          placeholder="Thêm công việc mới..."\n        />\n        <button onClick={addTodo}>Thêm</button>\n      </div>\n      \n      <ul className="todo-list">\n        {todos.map((todo, index) => (\n          <li key={index} className={todo.completed ? "completed" : ""}>\n            <span onClick={() => toggleTodo(index)}>{todo.text}</span>\n            <button onClick={() => deleteTodo(index)}>Xóa</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n};\n\nexport default TodoApp;',
    '[{"input":"add:Buy milk;add:Learn React;toggle:0","expectedOutput":"Buy milk:completed;Learn React:active"},{"input":"add:Call mom;add:Pay bills;add:Go to gym;remove:1","expectedOutput":"Call mom:active;Go to gym:active"}]',
    'medium',
    40
);

-- Thêm bài tập thực hành cho Module 3
INSERT INTO ModulePractices (
    ModuleID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    Difficulty
)
VALUES (
    @Module3ID,
    'Xây dựng ứng dụng Todo List với React',
    'Thực hành tạo ứng dụng Todo List đơn giản sử dụng React hooks.',
    'javascript',
    'import React, { useState } from "react";\n\nconst TodoApp = () => {\n  // Tạo state cho danh sách todo\n  const [todos, setTodos] = useState([]);\n  \n  // Tạo state cho input text\n  const [inputText, setInputText] = useState("");\n  \n  // Hàm thêm todo mới\n  const addTodo = () => {\n    // Viết code thêm todo mới vào danh sách\n    \n  };\n  \n  // Hàm đánh dấu todo đã hoàn thành\n  const toggleTodo = (index) => {\n    // Viết code đánh dấu todo hoàn thành\n    \n  };\n  \n  // Hàm xóa todo\n  const deleteTodo = (index) => {\n    // Viết code xóa todo\n    \n  };\n  \n  return (\n    <div className="todo-app">\n      <h1>Todo List</h1>\n      {/* Form thêm todo */}\n      <div className="input-container">\n        <input\n          type="text"\n          value={inputText}\n          onChange={(e) => setInputText(e.target.value)}\n          placeholder="Thêm công việc mới..."\n        />\n        <button onClick={addTodo}>Thêm</button>\n      </div>\n      \n      {/* Danh sách todo */}\n      <ul className="todo-list">\n        {todos.map((todo, index) => (\n          <li key={index} className={todo.completed ? "completed" : ""}>\n            <span onClick={() => toggleTodo(index)}>{todo.text}</span>\n            <button onClick={() => deleteTodo(index)}>Xóa</button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n};\n\nexport default TodoApp;',
    'medium'
);

-- Lấy PracticeID vừa thêm
DECLARE @PracticeID BIGINT;
SELECT @PracticeID = SCOPE_IDENTITY();

-- Thêm test case cho bài tập thực hành
INSERT INTO PracticeTestCases (
    PracticeID, Input, ExpectedOutput, OrderIndex
)
VALUES (
    @PracticeID,
    'add:Buy milk;add:Learn React;toggle:0',
    'Buy milk:completed;Learn React:active',
    1
);

INSERT INTO PracticeTestCases (
    PracticeID, Input, ExpectedOutput, OrderIndex
)
VALUES (
    @PracticeID,
    'add:Call mom;add:Pay bills;add:Go to gym;remove:1',
    'Call mom:active;Go to gym:active',
    2
);

UPDATE Courses
SET 
    Price = 0.00,
    DiscountPrice = 0.00,
    UpdatedAt = GETDATE()
WHERE 
    DeletedAt IS NULL; -- đảm bảo không cập nhật các khoá học đã bị xoá mềm


-- Thêm khóa học Python cơ bản
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, 
    InstructorID, Level, Category, SubCategory, 
    CourseType, Language, Duration, Capacity, 
    Price, ImageUrl, VideoUrl, Requirements, Objectives,
    Status, IsPublished, PublishedAt
)
VALUES (
    'Python Cơ Bản Cho Người Mới Bắt Đầu', 
    'python-co-ban', 
    '<p>Khóa học Python cơ bản dành cho người mới. Học cách lập trình Python từ đầu với các ví dụ thực tế.</p>', 
    'Khởi đầu lập trình Python cho người mới bắt đầu',
    NULL, -- InstructorID là NULL
    'beginner', 
    'Lập trình', 
    'Python',
    'regular', 
    'vi', 
    600, -- 10 giờ
    300,
    0,
    'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
    'https://www.youtube.com/embed/rfscVS0vtbw',
    '["Không yêu cầu kiến thức lập trình trước đó", "Máy tính có kết nối internet"]',
    '["Học được cú pháp Python cơ bản", "Giải quyết bài toán đơn giản với Python", "Xây dựng được các chương trình nhỏ"]',
    'published',
    1,
    GETDATE()
);

-- Lấy CourseID vừa thêm
DECLARE @CourseID BIGINT;
SELECT @CourseID = SCOPE_IDENTITY();

-- MODULE 1: Cơ bản về Python
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Nhập Môn Python',
    'Giới thiệu về Python và các cú pháp cơ bản.',
    1,
    180, -- 3 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/kqtD5dpn9C8',
    'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
    'Cài đặt môi trường và viết các chương trình Python đầu tiên.',
    'Hiểu cách Python hoạt động, cài đặt và cấu trúc cơ bản.',
    'Máy tính cơ bản.',
    'Tài liệu và ví dụ mã nguồn.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module1ID BIGINT;
SELECT @Module1ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Giới thiệu về Python',
    'Tìm hiểu tổng quan về Python và các ứng dụng của nó.',
    'video',
    NULL,
    'https://www.youtube.com/embed/kqtD5dpn9C8',
    25, -- 25 phút
    1,
    1, -- Đây là bài preview
    1  -- Đã publish
);

-- Bài 2: Biến và kiểu dữ liệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Biến và kiểu dữ liệu trong Python',
    'Học về các kiểu dữ liệu cơ bản và cách khai báo biến.',
    'text',
    '<h3>Biến trong Python</h3><p>Python là ngôn ngữ có kiểu dữ liệu động, không cần khai báo kiểu trước.</p><pre>name = "John"<br>age = 30<br>is_student = True</pre><h3>Kiểu dữ liệu cơ bản</h3><p>Python có các kiểu dữ liệu cơ bản: int, float, str, bool, list, tuple, dict, set.</p>',
    30, -- 30 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập Python đầu tiên
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Bài tập: Chương trình đầu tiên với Python',
    'Viết chương trình Python đầu tiên.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Viết một chương trình Python in ra câu "Hello, World!" và sau đó hỏi tên người dùng và chào họ.</p><p>Ví dụ:</p><pre>Output: Hello, World!<br>Nhập tên của bạn: John<br>Output: Xin chào, John!</pre>',
    25, -- 25 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson3ID BIGINT;
SELECT @Lesson3ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson3ID,
    'Chương trình Hello World',
    'Viết chương trình Python đầu tiên để in ra "Hello World" và chào người dùng.',
    'python',
    '# Viết chương trình của bạn ở đây\n\n# 1. In ra "Hello, World!"\n\n# 2. Hỏi tên người dùng và chào họ\n',
    'print("Hello, World!")\nname = input("Nhập tên của bạn: ")\nprint(f"Xin chào, {name}!")',
    '[{"input":"John","expectedOutput":"Hello, World!\\nNhập tên của bạn: John\\nXin chào, John!"}]',
    'easy',
    10
);

-- MODULE 2: Cấu trúc dữ liệu và hàm
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Cấu trúc dữ liệu và hàm',
    'Tìm hiểu về các cấu trúc dữ liệu và cách viết hàm trong Python.',
    2,
    240, -- 4 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/daefaLgNkw0',
    'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg',
    'Thực hành với các cấu trúc dữ liệu và viết hàm.',
    'Thành thạo với list, dict và cách viết hàm trong Python.',
    'Kiến thức cơ bản về Python từ Module 1.',
    'Bài tập thực hành và code mẫu.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module2ID BIGINT;
SELECT @Module2ID = SCOPE_IDENTITY();

-- Bài 1: List và Dictionary
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Làm việc với List và Dictionary',
    'Học cách sử dụng và thao tác với List và Dictionary trong Python.',
    'text',
    '<h3>List trong Python</h3><p>List là một cấu trúc dữ liệu lưu trữ nhiều giá trị có thứ tự.</p><pre>fruits = ["apple", "banana", "cherry"]<br>fruits.append("orange")<br>print(fruits[0])  # Kết quả: apple</pre><h3>Dictionary</h3><p>Dictionary lưu trữ dữ liệu dạng key-value.</p><pre>person = {<br>  "name": "John",<br>  "age": 30,<br>  "city": "New York"<br>}<br>print(person["name"])  # Kết quả: John</pre>',
    40, -- 40 phút
    1,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 2: Hàm trong Python
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Hàm trong Python',
    'Học cách định nghĩa và sử dụng hàm.',
    'video',
    NULL,
    'https://www.youtube.com/embed/daefaLgNkw0',
    35, -- 35 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập về hàm
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Bài tập: Xử lý danh sách với hàm',
    'Thực hành viết hàm xử lý dữ liệu trong danh sách.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Viết một hàm <code>find_max_min</code> nhận vào một danh sách các số và trả về một tuple chứa giá trị lớn nhất và nhỏ nhất trong danh sách.</p><p>Ví dụ:</p><ul><li>Input: <code>[5, 2, 9, 1, 7]</code> → Output: <code>(9, 1)</code></li><li>Input: <code>[10, 20, 30]</code> → Output: <code>(30, 10)</code></li><li>Input: <code>[-5, 0, -10, 15]</code> → Output: <code>(15, -10)</code></li></ul>',
    30, -- 30 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson6ID BIGINT;
SELECT @Lesson6ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson6ID,
    'Tìm giá trị lớn nhất và nhỏ nhất',
    'Viết hàm tìm giá trị lớn nhất và nhỏ nhất trong một danh sách.',
    'python',
    'def find_max_min(numbers):\n    # Viết code của bạn ở đây\n    pass\n\n# Kiểm tra hàm với các ví dụ\n# print(find_max_min([5, 2, 9, 1, 7]))  # Kết quả: (9, 1)',
    'def find_max_min(numbers):\n    max_value = max(numbers)\n    min_value = min(numbers)\n    return (max_value, min_value)\n\n# Cách 2: không dùng hàm có sẵn\n# def find_max_min(numbers):\n#     max_value = numbers[0]\n#     min_value = numbers[0]\n#     for num in numbers:\n#         if num > max_value:\n#             max_value = num\n#         if num < min_value:\n#             min_value = num\n#     return (max_value, min_value)',
    '[{"input":"[5, 2, 9, 1, 7]","expectedOutput":"(9, 1)"},{"input":"[10, 20, 30]","expectedOutput":"(30, 10)"},{"input":"[-5, 0, -10, 15]","expectedOutput":"(15, -10)"}]',
    'easy',
    15
);

-- Thêm khóa học C++ cơ bản
INSERT INTO Courses (
    Title, Slug, Description, ShortDescription, 
    InstructorID, Level, Category, SubCategory, 
    CourseType, Language, Duration, Capacity, 
    Price, ImageUrl, VideoUrl, Requirements, Objectives,
    Status, IsPublished, PublishedAt
)
VALUES (
    'Lập Trình C++ Cơ Bản', 
    'lap-trinh-cpp-co-ban', 
    '<p>Khóa học C++ cơ bản giúp bạn làm quen với ngôn ngữ lập trình C++, hiểu rõ về cú pháp, cấu trúc dữ liệu và lập trình hướng đối tượng trong C++. Thông qua các bài tập thực hành, bạn sẽ xây dựng nền tảng vững chắc cho lập trình C++.</p>', 
    'Học lập trình C++ từ cơ bản đến nâng cao với các bài tập thực hành',
    NULL, -- InstructorID là NULL
    'beginner', 
    'Lập trình', 
    'C++',
    'regular', 
    'vi', 
    720, -- 12 giờ
    150,
    0,
    'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg',
    'https://www.youtube.com/embed/vLnPwxZdW4Y',
    '["Không yêu cầu kiến thức lập trình trước đó", "Máy tính có cài đặt môi trường C++"]',
    '["Hiểu cú pháp và nguyên lý cơ bản của C++", "Làm việc với biến, mảng, chuỗi và con trỏ", "Lập trình hướng đối tượng với C++", "Xây dựng ứng dụng C++ đơn giản"]',
    'published',
    1,
    GETDATE()
);

-- Lấy CourseID vừa thêm
DECLARE @CourseID BIGINT;
SELECT @CourseID = SCOPE_IDENTITY();

-- MODULE 1: Nhập môn C++
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Nhập môn C++',
    'Làm quen với ngôn ngữ lập trình C++ và cài đặt môi trường phát triển.',
    1,
    150, -- 2.5 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/vLnPwxZdW4Y',
    'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
    'Cài đặt môi trường và viết chương trình C++ đầu tiên.',
    'Hiểu các khái niệm cơ bản về C++ và môi trường phát triển.',
    'Máy tính và phần mềm biên dịch C++.',
    'Tài liệu hướng dẫn cài đặt và ví dụ code.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module1ID BIGINT;
SELECT @Module1ID = SCOPE_IDENTITY();

-- Bài 1: Video giới thiệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Giới thiệu về C++',
    'Tìm hiểu về lịch sử, đặc điểm và ứng dụng của ngôn ngữ C++.',
    'video',
    NULL,
    'https://www.youtube.com/embed/vLnPwxZdW4Y',
    30, -- 30 phút
    1,
    1, -- Đây là bài preview
    1  -- Đã publish
);

-- Bài 2: Cài đặt môi trường
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Cài đặt môi trường phát triển C++',
    'Hướng dẫn cài đặt trình biên dịch C++ và IDE.',
    'text',
    '<h3>Cài đặt trình biên dịch C++</h3><p>C++ là ngôn ngữ biên dịch, bạn cần một trình biên dịch (compiler) để chuyển mã nguồn thành chương trình thực thi.</p><h4>Trên Windows</h4><p>Bạn có thể sử dụng MinGW hoặc Visual Studio.</p><h4>Trên macOS</h4><p>Sử dụng Clang thông qua Xcode Command Line Tools.</p><h4>Trên Linux</h4><p>Sử dụng GCC thông qua gói build-essential.</p><h3>Cài đặt IDE</h3><p>Các IDE phổ biến cho C++ bao gồm Visual Studio Code, CLion, Code::Blocks và Dev-C++.</p>',
    30, -- 30 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Chương trình đầu tiên
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module1ID,
    'Bài tập: Chương trình C++ đầu tiên',
    'Viết và chạy chương trình Hello World trong C++.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Viết chương trình C++ đầu tiên hiển thị dòng "Hello, C++ World!" ra màn hình và thực hiện các phép tính đơn giản.</p><ul><li>Sử dụng iostream để xuất dữ liệu ra màn hình</li><li>Thực hiện phép tính cộng hai số</li><li>Hiển thị kết quả</li></ul>',
    20, -- 20 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson3ID BIGINT;
SELECT @Lesson3ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson3ID,
    'Hello C++ World',
    'Viết chương trình C++ đầu tiên hiển thị câu chào và tính tổng.',
    'cpp',
    '#include <iostream>\n\nint main() {\n    // Viết code hiển thị "Hello, C++ World!"\n    \n    // Tính và hiển thị tổng của 10 và 25\n    \n    return 0;\n}',
    '#include <iostream>\n\nint main() {\n    // Hiển thị câu chào\n    std::cout << "Hello, C++ World!" << std::endl;\n    \n    // Tính tổng\n    int sum = 10 + 25;\n    std::cout << "Tổng của 10 và 25 là: " << sum << std::endl;\n    \n    return 0;\n}',
    '[{"input":"","expectedOutput":"Hello, C\\+\\+ World!.*?Tổng của 10 và 25 là: 35"}]',
    'easy',
    10
);

-- MODULE 2: Cơ bản về C++
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Cú pháp và cấu trúc dữ liệu cơ bản',
    'Tìm hiểu về cú pháp, biến, điều kiện và vòng lặp trong C++.',
    2,
    210, -- 3.5 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/GQp1zzTwrIg',
    'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg',
    'Làm việc với các kiểu dữ liệu và cấu trúc điều khiển trong C++.',
    'Hiểu và sử dụng được các kiểu dữ liệu, mảng, chuỗi, rẽ nhánh và vòng lặp.',
    'Đã hoàn thành Module 1.',
    'Ví dụ code và bài tập thực hành.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module2ID BIGINT;
SELECT @Module2ID = SCOPE_IDENTITY();

-- Bài 1: Biến và kiểu dữ liệu
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Biến và kiểu dữ liệu trong C++',
    'Tìm hiểu về kiểu dữ liệu, khai báo biến và phạm vi biến.',
    'text',
    '<h3>Kiểu dữ liệu cơ bản trong C++</h3><p>C++ có các kiểu dữ liệu cơ bản như:</p><ul><li><code>int</code>: Kiểu số nguyên</li><li><code>float</code> và <code>double</code>: Kiểu số thực</li><li><code>char</code>: Kiểu ký tự</li><li><code>bool</code>: Kiểu logic</li></ul><p>Ví dụ:</p><pre>int age = 25;\ndouble salary = 1500.50;\nchar grade = \''A\'';\nbool isActive = true;</pre><h3>Phạm vi biến</h3><p>Biến trong C++ có thể có phạm vi toàn cục hoặc cục bộ, tùy thuộc vào nơi khai báo.</p>',
    40, -- 40 phút
    1,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 2: Mảng và chuỗi
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Mảng và chuỗi trong C++',
    'Tìm hiểu cách khai báo và sử dụng mảng, chuỗi trong C++.',
    'video',
    NULL,
    'https://www.youtube.com/embed/GQp1zzTwrIg',
    35, -- 35 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập tìm số lớn nhất
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module2ID,
    'Bài tập: Tìm số lớn nhất trong mảng',
    'Thực hành với mảng: Tìm số lớn nhất trong một mảng số nguyên.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Viết hàm <code>findMax</code> nhận vào một mảng số nguyên và kích thước của mảng, trả về giá trị lớn nhất trong mảng đó.</p><p>Ví dụ:</p><ul><li>Mảng: [5, 9, 3, 7, 2] → Kết quả: 9</li><li>Mảng: [10, 20, 5, 15] → Kết quả: 20</li><li>Mảng: [-5, -10, -2, -1] → Kết quả: -1</li></ul>',
    30, -- 30 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson6ID BIGINT;
SELECT @Lesson6ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson6ID,
    'Tìm số lớn nhất trong mảng',
    'Viết hàm tìm giá trị lớn nhất trong một mảng.',
    'cpp',
    '#include <iostream>\n\n// Hàm tìm giá trị lớn nhất trong mảng\nint findMax(int arr[], int size) {\n    // Viết code của bạn ở đây\n    \n}\n\nint main() {\n    // Kiểm tra hàm với ví dụ\n    int arr1[] = {5, 9, 3, 7, 2};\n    std::cout << "Giá trị lớn nhất: " << findMax(arr1, 5) << std::endl;\n    \n    return 0;\n}',
    '#include <iostream>\n\nint findMax(int arr[], int size) {\n    // Giả sử phần tử đầu tiên là lớn nhất\n    int max = arr[0];\n    \n    // Duyệt qua từng phần tử còn lại\n    for (int i = 1; i < size; i++) {\n        // Nếu tìm thấy phần tử lớn hơn max hiện tại\n        if (arr[i] > max) {\n            max = arr[i];\n        }\n    }\n    \n    return max;\n}\n\nint main() {\n    int arr1[] = {5, 9, 3, 7, 2};\n    std::cout << "Giá trị lớn nhất: " << findMax(arr1, 5) << std::endl;\n    \n    return 0;\n}',
    '[{"input":"","expectedOutput":"Giá trị lớn nhất: 9"}]',
    'easy',
    15
);

-- MODULE 3: Lập trình hướng đối tượng với C++
INSERT INTO CourseModules (
    CourseID, Title, Description, OrderIndex, 
    Duration, IsPublished, VideoUrl, ImageUrl, 
    PracticalGuide, Objectives, Requirements, 
    Materials, IsDraft
)
VALUES (
    @CourseID,
    'Lập trình hướng đối tượng với C++',
    'Tìm hiểu về các khái niệm OOP trong C++ như lớp, đối tượng, tính kế thừa.',
    3,
    180, -- 3 giờ
    1, -- Đã publish
    'https://www.youtube.com/embed/SiBw7os-_zI',
    'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    'Xây dựng các lớp và đối tượng trong C++.',
    'Hiểu và áp dụng các nguyên tắc OOP trong C++.',
    'Đã hoàn thành Module 1 và 2.',
    'Ví dụ code và bài tập thực hành OOP.',
    0 -- Không phải draft
);

-- Lấy ModuleID vừa thêm
DECLARE @Module3ID BIGINT;
SELECT @Module3ID = SCOPE_IDENTITY();

-- Bài 1: Lớp và đối tượng
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, VideoUrl, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    'Lớp và đối tượng trong C++',
    'Tìm hiểu cách định nghĩa lớp, tạo đối tượng và sử dụng thuộc tính, phương thức.',
    'video',
    NULL,
    'https://www.youtube.com/embed/SiBw7os-_zI',
    40, -- 40 phút
    1,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 2: Tính kế thừa và đa hình
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    'Tính kế thừa và đa hình trong C++',
    'Hiểu về tính kế thừa, đa hình và ghi đè phương thức.',
    'text',
    '<h3>Tính kế thừa trong C++</h3><p>Kế thừa cho phép một lớp có thể kế thừa thuộc tính và phương thức từ lớp khác.</p><pre>class Animal {\npublic:\n    void eat() {\n        std::cout << "Animal is eating" << std::endl;\n    }\n};\n\nclass Dog : public Animal {\npublic:\n    void bark() {\n        std::cout << "Dog is barking" << std::endl;\n    }\n};</pre><h3>Tính đa hình</h3><p>Đa hình cho phép một phương thức có thể có nhiều cách thực hiện khác nhau.</p><pre>class Shape {\npublic:\n    virtual double area() {\n        return 0;\n    }\n};\n\nclass Rectangle : public Shape {\nprivate:\n    double width, height;\npublic:\n    Rectangle(double w, double h) : width(w), height(h) {}\n    double area() override {\n        return width * height;\n    }\n};</pre>',
    40, -- 40 phút
    2,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Bài 3: Bài tập tạo lớp
INSERT INTO CourseLessons (
    ModuleID, Title, Description, Type,
    Content, Duration, OrderIndex, 
    IsPreview, IsPublished
)
VALUES (
    @Module3ID,
    'Bài tập: Tạo lớp Student',
    'Thực hành tạo lớp Student với các thuộc tính và phương thức.',
    'coding',
    '<h3>Yêu cầu:</h3><p>Tạo một lớp <code>Student</code> với các thuộc tính:</p><ul><li>Tên (<code>name</code>): chuỗi</li><li>Mã số sinh viên (<code>id</code>): chuỗi</li><li>Điểm trung bình (<code>gpa</code>): số thực</li></ul><p>Và các phương thức:</p><ul><li>Constructor nhận vào các tham số tương ứng</li><li>Getter và setter cho các thuộc tính</li><li><code>displayInfo()</code>: hiển thị thông tin sinh viên</li><li><code>isHonorStudent()</code>: trả về true nếu điểm trung bình >= 8.0</li></ul>',
    60, -- 60 phút
    3,
    0, -- Không phải bài preview
    1  -- Đã publish
);

-- Lấy LessonID vừa thêm
DECLARE @Lesson9ID BIGINT;
SELECT @Lesson9ID = SCOPE_IDENTITY();

-- Thêm bài tập lập trình cho bài học
INSERT INTO CodingExercises (
    LessonID, Title, Description, 
    ProgrammingLanguage, InitialCode, 
    SolutionCode, TestCases, Difficulty, Points
)
VALUES (
    @Lesson9ID,
    'Tạo lớp Student',
    'Tạo một lớp Student với thuộc tính và phương thức cần thiết.',
    'cpp',
    '#include <iostream>\n#include <string>\n\n// Định nghĩa lớp Student\nclass Student {\n    // Khai báo thuộc tính và phương thức ở đây\n    \n};\n\nint main() {\n    // Tạo đối tượng Student\n    Student student1("Nguyen Van A", "SV001", 8.5);\n    \n    // Hiển thị thông tin\n    student1.displayInfo();\n    \n    // Kiểm tra sinh viên có phải là sinh viên giỏi không\n    if (student1.isHonorStudent()) {\n        std::cout << "Đây là sinh viên giỏi." << std::endl;\n    } else {\n        std::cout << "Đây không phải là sinh viên giỏi." << std::endl;\n    }\n    \n    return 0;\n}',
    '#include <iostream>\n#include <string>\n\nclass Student {\nprivate:\n    std::string name;\n    std::string id;\n    double gpa;\n    \npublic:\n    // Constructor\n    Student(std::string _name, std::string _id, double _gpa) {\n        name = _name;\n        id = _id;\n        gpa = _gpa;\n    }\n    \n    // Getters\n    std::string getName() { return name; }\n    std::string getId() { return id; }\n    double getGpa() { return gpa; }\n    \n    // Setters\n    void setName(std::string _name) { name = _name; }\n    void setId(std::string _id) { id = _id; }\n    void setGpa(double _gpa) { gpa = _gpa; }\n    \n    // Hiển thị thông tin sinh viên\n    void displayInfo() {\n        std::cout << "Thông tin sinh viên:" << std::endl;\n        std::cout << "Tên: " << name << std::endl;\n        std::cout << "MSSV: " << id << std::endl;\n        std::cout << "Điểm trung bình: " << gpa << std::endl;\n    }\n    \n    // Kiểm tra sinh viên giỏi\n    bool isHonorStudent() {\n        return gpa >= 8.0;\n    }\n};\n\nint main() {\n    // Tạo đối tượng Student\n    Student student1("Nguyen Van A", "SV001", 8.5);\n    \n    // Hiển thị thông tin\n    student1.displayInfo();\n    \n    // Kiểm tra sinh viên có phải là sinh viên giỏi không\n    if (student1.isHonorStudent()) {\n        std::cout << "Đây là sinh viên giỏi." << std::endl;\n    } else {\n        std::cout << "Đây không phải là sinh viên giỏi." << std::endl;\n    }\n    \n    return 0;\n}',
    '[{"input":"","expectedOutput":"Thông tin sinh viên:.*?Tên: Nguyen Van A.*?MSSV: SV001.*?Điểm trung bình: 8.5.*?Đây là sinh viên giỏi."}]',
    'medium',
    25
);

use campushubt;
SELECT * from courses;

UPDATE Courses
SET
    Title = N'Lập Trình Web Fullstack',
    Description = N'<p>Khóa học giúp bạn trở thành lập trình viên Fullstack với JavaScript, từ Frontend với React đến Backend với Node.js. Khóa học bao gồm các bài tập thực hành và dự án thực tế để nâng cao kỹ năng của bạn.</p><p>Bạn sẽ học cách xây dựng ứng dụng web hoàn chỉnh từ giao diện người dùng đến API và cơ sở dữ liệu.</p>',
    ShortDescription = N'Trở thành lập trình viên Fullstack với JavaScript, React và Node.js',
    Requirements = N'["Kiến thức cơ bản về HTML, CSS và JavaScript", "Máy tính có kết nối internet", "Hiểu biết cơ bản về lập trình"]',
    Objectives = N'["Xây dựng ứng dụng web đầy đủ với React", "Phát triển RESTful API với Node.js và Express", "Thiết kế và quản lý cơ sở dữ liệu", "Triển khai ứng dụng web lên môi trường thực tế"]'
WHERE CourseID = 1;

select * from CourseAchievements;
select * from CourseModules;
select * from CourseLessons;
select * from CourseEnrollments;
select * from LessonProgress;
select * from CodingExercises;
select * from CodingSubmissions;
