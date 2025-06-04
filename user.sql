use campushubt;
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
    PasskeyCredentials NVARCHAR(MAX), -- Thông tin xác thực sinh trắc học (Passkey)
    HasPasskey BIT DEFAULT 0, -- Đánh dấu người dùng đã thiết lập passkey chưa
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo tài khoản
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật gần nhất
    LastLoginAt DATETIME, -- Thời điểm đăng nhập gần nhất
    DeletedAt DATETIME, -- Thời điểm xóa tài khoản
    CONSTRAINT CHK_User_Role CHECK (Role IN ('STUDENT', 'TEACHER', 'ADMIN')), -- Kiểm tra vai trò hợp lệ
    CONSTRAINT CHK_User_Status CHECK (Status IN ('ONLINE', 'OFFLINE', 'AWAY')), -- Kiểm tra trạng thái hợp lệ
    CONSTRAINT CHK_Account_Status CHECK (AccountStatus IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED')) -- Kiểm tra trạng thái tài khoản hợp lệ
);
GO

ALTER TABLE Users
ADD PasskeyCredentials NVARCHAR(MAX), -- Thông tin xác thực sinh trắc học (Passkey)
    HasPasskey BIT DEFAULT 0;         -- Đánh dấu người dùng đã thiết lập passkey chưa

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