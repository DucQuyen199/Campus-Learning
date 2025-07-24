/*-----------------------------------------------------------------
* File: event_1.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE Users (
    UserID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của người dùng
    Username VARCHAR(50) NOT NULL UNIQUE, -- Tên đăng nhập, không được trùng
    Email VARCHAR(100) NOT NULL UNIQUE, -- Email, không được trùng
    Password VARCHAR(255) NOT NULL, -- Mật khẩu đã được mã hóa
    FullName NVARCHAR(100) NOT NULL, -- Họ tên đầy đủ
    DateOfBirth DATE, -- Ngày sinh
    School NVARCHAR(255), -- Trường học
    Role VARCHAR(20) DEFAULT 'STUDENT', -- Vai trò: học sinh, giáo viên hoặc admin
    Status VARCHAR(20) DEFAULT 'ONLINE', -- Trạng thái hoạt động
    AccountStatus VARCHAR(20) DEFAULT 'ACTIVE', -- Trạng thái tài khoản
    Image VARCHAR(255), -- Đường dẫn ảnh đại diện
    Bio NVARCHAR(500), -- Tiểu sử/giới thiệu
    Provider VARCHAR(20) DEFAULT 'local', -- Phương thức đăng nhập (local/google/facebook...)
    ProviderID VARCHAR(100), -- ID từ nhà cung cấp đăng nhập
    EmailVerified BIT DEFAULT 0, -- Đánh dấu email đã xác thực chưa
    PhoneNumber VARCHAR(15), -- Số điện thoại
    Address NVARCHAR(255), -- Địa chỉ
    City NVARCHAR(100), -- Thành phố
    Country NVARCHAR(100), -- Quốc gia
    LastLoginIP VARCHAR(45), -- IP đăng nhập gần nhất
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo tài khoản
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật gần nhất
    LastLoginAt DATETIME, -- Thời điểm đăng nhập gần nhất
    DeletedAt DATETIME, -- Thời điểm xóa tài khoản
    CONSTRAINT CHK_User_Role CHECK (Role IN ('STUDENT', 'TEACHER', 'ADMIN')), -- Kiểm tra vai trò hợp lệ
    CONSTRAINT CHK_User_Status CHECK (Status IN ('ONLINE', 'OFFLINE', 'AWAY')), -- Kiểm tra trạng thái hợp lệ
    CONSTRAINT CHK_Account_Status CHECK (AccountStatus IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED')) -- Kiểm tra trạng thái tài khoản hợp lệ
);
GO

-- Bảng UserProfiles: Lưu thông tin bổ sung của người dùng như học vấn, kinh nghiệm làm việc
CREATE TABLE UserProfiles (
    ProfileID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của profile
    UserID BIGINT UNIQUE FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với bảng Users
    Education NVARCHAR(MAX), -- Thông tin học vấn
    WorkExperience NVARCHAR(MAX), -- Kinh nghiệm làm việc
    Skills NVARCHAR(MAX), -- Kỹ năng
    Interests NVARCHAR(MAX), -- Sở thích
    SocialLinks NVARCHAR(MAX), -- Liên kết mạng xã hội dạng JSON
    Achievements NVARCHAR(MAX), -- Thành tích và huy hiệu dạng JSON
    PreferredLanguage VARCHAR(10) DEFAULT 'vi', -- Ngôn ngữ ưa thích
    TimeZone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh', -- Múi giờ
    NotificationPreferences NVARCHAR(MAX), -- Cài đặt thông báo dạng JSON
    UpdatedAt DATETIME DEFAULT GETDATE() -- Thời điểm cập nhật gần nhất
);
GO
CREATE TABLE Events (
    EventID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của sự kiện
    Title NVARCHAR(255) NOT NULL, -- Tên sự kiện
    Description NVARCHAR(MAX), -- Mô tả chi tiết
    Category VARCHAR(50), -- Loại sự kiện
    EventDate DATE NOT NULL, -- Ngày diễn ra
    EventTime TIME NOT NULL, -- Thời gian bắt đầu
    Location NVARCHAR(255), -- Địa điểm
    ImageUrl VARCHAR(500), -- Ảnh bìa sự kiện
    MaxAttendees INT, -- Số lượng người tham gia tối đa
    CurrentAttendees INT DEFAULT 0, -- Số người đã đăng ký
    Price DECIMAL(10,2), -- Giá vé
    Organizer NVARCHAR(255), -- Đơn vị tổ chức
    Difficulty VARCHAR(20), -- Mức độ khó
    Status VARCHAR(20) DEFAULT 'upcoming', -- Trạng thái sự kiện
    CreatedBy BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người tạo
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME, -- Thời điểm cập nhật
    DeletedAt DATETIME, -- Thời điểm xóa
    CONSTRAINT CHK_Event_Status CHECK (Status IN ('upcoming', 'ongoing', 'completed', 'cancelled')), -- Kiểm tra trạng thái hợp lệ
    CONSTRAINT CHK_Event_Difficulty CHECK (Difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')), -- Kiểm tra độ khó hợp lệ
    CONSTRAINT CHK_Event_Category CHECK (Category IN ( -- Kiểm tra loại sự kiện hợp lệ
        'Competitive Programming', 'Hackathon', 'Web Development', 
        'AI/ML', 'Mobile Development', 'DevOps', 'Security'
    ))
);
go
-- Chi tiết giải thưởng
CREATE TABLE EventPrizes (
    PrizeID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của giải thưởng
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    Rank INT, -- Thứ hạng
    PrizeAmount DECIMAL(10,2), -- Giá trị giải thưởng
    Description NVARCHAR(500), -- Mô tả giải thưởng
    CONSTRAINT CHK_Prize_Rank CHECK (Rank > 0) -- Kiểm tra thứ hạng hợp lệ
);
go
-- Ngôn ngữ lập trình được sử dụng trong sự kiện
CREATE TABLE EventProgrammingLanguages (
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    Language VARCHAR(50), -- Tên ngôn ngữ lập trình
    PRIMARY KEY (EventID, Language) -- Khóa chính kết hợp
);
go
-- Công nghệ sử dụng trong sự kiện
CREATE TABLE EventTechnologies (
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    Technology VARCHAR(100), -- Tên công nghệ
    PRIMARY KEY (EventID, Technology) -- Khóa chính kết hợp
);
go
-- Vòng thi/Tracks của sự kiện
CREATE TABLE EventRounds (
    RoundID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của vòng thi
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    Name NVARCHAR(255), -- Tên vòng thi
    Duration INT, -- Thời lượng (phút)
    Problems INT, -- Số lượng bài tập
    Description NVARCHAR(MAX), -- Mô tả vòng thi
    StartTime DATETIME, -- Thời gian bắt đầu
    EndTime DATETIME -- Thời gian kết thúc
);
go
-- Người tham gia sự kiện
CREATE TABLE EventParticipants (
    ParticipantID BIGINT IDENTITY(1,1) PRIMARY KEY,
    EventID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    RegistrationDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'registered', -- Trạng thái đăng ký
    TeamName NVARCHAR(100), -- Tên nhóm (nếu có)
    PaymentStatus VARCHAR(20), -- Trạng thái thanh toán
    AttendanceStatus VARCHAR(20), -- Trạng thái tham gia
    CONSTRAINT CHK_Participant_Status CHECK (Status IN ('registered', 'confirmed', 'cancelled', 'attended')),
    CONSTRAINT CHK_Payment_Status CHECK (PaymentStatus IN ('pending', 'completed', 'refunded', 'free')),
    CONSTRAINT CHK_Attendance_Status CHECK (AttendanceStatus IN ('pending', 'present', 'absent')),
    CONSTRAINT UQ_Event_User UNIQUE (EventID, UserID),
    CONSTRAINT FK_EventParticipants_Events FOREIGN KEY (EventID) REFERENCES Events(EventID),
    CONSTRAINT FK_EventParticipants_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
go
-- Lịch trình sự kiện
CREATE TABLE EventSchedule (
    ScheduleID BIGINT IDENTITY(1,1) PRIMARY KEY,
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID),
    ActivityName NVARCHAR(255), -- Tên hoạt động
    StartTime DATETIME, -- Thời gian bắt đầu
    EndTime DATETIME, -- Thời gian kết thúc
    Description NVARCHAR(MAX), -- Mô tả hoạt động
    Location NVARCHAR(255), -- Địa điểm cụ thể
    Type VARCHAR(50), -- Loại hoạt động
    CONSTRAINT CHK_Schedule_Type CHECK (Type IN (
        'registration', 'opening', 'main_event', 
        'break', 'networking', 'closing'
    ))
);
go
-- Indexes
CREATE INDEX IX_Events_Date ON Events(EventDate); -- Index cho cột EventDate trong bảng Events để tối ưu tìm kiếm theo ngày
CREATE INDEX IX_Events_Category ON Events(Category); -- Index cho cột Category để tối ưu tìm kiếm theo danh mục sự kiện
CREATE INDEX IX_Events_Status ON Events(Status); -- Index cho cột Status để tối ưu tìm kiếm theo trạng thái sự kiện
CREATE INDEX IX_EventParticipants_EventID ON EventParticipants(EventID); -- Index cho cột EventID trong bảng EventParticipants để tối ưu join với bảng Events
CREATE INDEX IX_EventSchedule_EventID ON EventSchedule(EventID); -- Index cho cột EventID trong bảng EventSchedule để tối ưu join với bảng Events
go  
-- Bảng thành tích sự kiện
CREATE TABLE EventAchievements (
    AchievementID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của thành tích
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng đạt thành tích
    Position INT, -- Thứ hạng đạt được trong sự kiện
    Points INT, -- Điểm thưởng cho thành tích
    BadgeType VARCHAR(50), -- Loại huy hiệu đạt được
    AwardedAt DATETIME DEFAULT GETDATE(), -- Thời điểm đạt thành tích
    CONSTRAINT CHK_Badge_Type CHECK (BadgeType IN ( -- Kiểm tra loại huy hiệu hợp lệ
        'GOLD_MEDAL', 'SILVER_MEDAL', 'BRONZE_MEDAL',
        'FIRST_PLACE', 'TOP_3', 'TOP_10',
        'PERFECT_SCORE', 'FAST_SOLVER', 'TEAM_WINNER'
    ))
);

select * from Events;
-- Thêm 2 sự kiện bắt đầu từ ngày 20/4/2025 kết thúc ngày 30/5/2025
INSERT INTO Events (Title, Description, Category, EventDate, EventTime, Location, MaxAttendees, 
                   Price, Organizer, Difficulty, Status, CreatedBy, UpdatedAt, Image)
VALUES ('Hackathon Mùa Xuân 2025', 
        N'Cuộc thi lập trình 48 giờ với chủ đề phát triển ứng dụng giáo dục thông minh',
        'Hackathon', 
        '2025-04-20', 
        '08:00:00', 
        N'Đại học Bách Khoa Hà Nội', 
        200, 
        100000.00, 
        N'CodeVN Community', 
        'intermediate', 
        'upcoming', 
        1, 
        GETDATE(),
        '/images/events/hackathon-spring-2025.jpg');

INSERT INTO Events (Title, Description, Category, EventDate, EventTime, Location, MaxAttendees, 
                   Price, Organizer, Difficulty, Status, CreatedBy, UpdatedAt, Image)
VALUES ('AI Challenge 2025', 
        N'Cuộc thi phát triển mô hình AI giải quyết các vấn đề môi trường',
        'AI/ML', 
        '2025-04-25', 
        '09:30:00', 
        N'Trung tâm Hội nghị Quốc gia', 
        150, 
        150000.00, 
        N'Vietnam AI Association', 
        'advanced', 
        'upcoming', 
        1, 
        GETDATE(),
        '/images/events/ai-challenge-2025.jpg');

-- Thêm lịch trình cho sự kiện Hackathon
INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY()-1, N'Đăng ký và check-in', '2025-04-20 07:00:00', '2025-04-20 08:30:00', 
        N'Đăng ký và nhận tài liệu', N'Sảnh chính', 'registration');

INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY()-1, N'Lễ khai mạc', '2025-04-20 09:00:00', '2025-04-20 10:00:00', 
        N'Giới thiệu cuộc thi và các quy tắc', N'Hội trường A', 'opening');

INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY()-1, N'Vòng chung kết', '2025-05-30 14:00:00', '2025-05-30 17:00:00', 
        N'Thuyết trình và demo sản phẩm', N'Hội trường lớn', 'main_event');

-- Thêm lịch trình cho sự kiện AI Challenge
INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY(), N'Đăng ký và check-in', '2025-04-25 08:00:00', '2025-04-25 09:00:00', 
        N'Đăng ký và nhận tài liệu', N'Sảnh chính', 'registration');

INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY(), N'Workshop AI', '2025-04-25 10:00:00', '2025-04-25 12:00:00', 
        N'Hướng dẫn về các công nghệ AI mới nhất', N'Phòng hội thảo B', 'main_event');

INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
VALUES (SCOPE_IDENTITY(), N'Trao giải', '2025-05-30 15:00:00', '2025-05-30 16:30:00', 
        N'Lễ trao giải và kết thúc cuộc thi', N'Hội trường chính', 'closing');

UPDATE events
SET imageurl = 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'
WHERE eventid = 1;

UPDATE events
SET imageurl = 'https://ntt-supercare365.com/wp-content/uploads/2021/05/bao-mat-he-thong-thong-tin-min.jpg'
WHERE eventid = 2;
