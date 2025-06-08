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

CREATE TABLE [dbo].[UserPresence] (
    [PresenceID]      BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [Status]          VARCHAR (20)   DEFAULT ('offline') NULL,
    [LastActiveAt]    DATETIME       DEFAULT (getdate()) NULL,
    [CurrentDeviceID] VARCHAR (255)  NULL,
    [LastLocation]    NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([PresenceID] ASC),
    CONSTRAINT [CHK_Presence_Status] CHECK ([Status]='in_call' OR [Status]='busy' OR [Status]='away' OR [Status]='offline' OR [Status]='online'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);

CREATE TABLE UserEmails (
    EmailID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Email VARCHAR(255) NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    IsVerified BIT NOT NULL DEFAULT 0,
    Visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    VerificationToken VARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    VerifiedAt DATETIME NULL,
    CONSTRAINT UQ_UserEmails_User_Email UNIQUE (UserID, Email)
);

-- Table for SSH keys
CREATE TABLE UserSSHKeys (
    KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(100) NOT NULL,
    KeyType VARCHAR(20) NOT NULL,
    KeyValue NVARCHAR(MAX) NOT NULL,
    Fingerprint VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastUsedAt DATETIME NULL,
    DeletedAt DATETIME NULL,
    CONSTRAINT UQ_UserSSHKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
);

-- Table for GPG keys
CREATE TABLE UserGPGKeys (
    KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(100) NOT NULL,
    KeyType VARCHAR(20) NOT NULL,
    KeyValue NVARCHAR(MAX) NOT NULL,
    Fingerprint VARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NULL,
    DeletedAt DATETIME NULL,
    CONSTRAINT UQ_UserGPGKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
);

-- Tạo bảng EmailVerifications nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailVerifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE EmailVerifications (
        VerificationID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID BIGINT NOT NULL,
        Email VARCHAR(100) NOT NULL,
        OTP VARCHAR(6) NOT NULL,
        ExpiresAt DATETIME NOT NULL,
        IsUsed BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_EmailVerifications_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
    
    CREATE INDEX IX_EmailVerifications_UserID ON EmailVerifications(UserID);
    CREATE INDEX IX_EmailVerifications_Email ON EmailVerifications(Email);
    CREATE INDEX IX_EmailVerifications_OTP ON EmailVerifications(OTP);
    
    PRINT 'Bảng EmailVerifications đã được tạo thành công';
END
ELSE
BEGIN
    PRINT 'Bảng EmailVerifications đã tồn tại';
END 

use campushubt;

-- Add SSH keys table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSSHKeys')
BEGIN
    CREATE TABLE UserSSHKeys (
        KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
        Title NVARCHAR(100) NOT NULL,
        KeyType VARCHAR(20) NOT NULL,
        KeyValue NVARCHAR(MAX) NOT NULL,
        Fingerprint VARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        LastUsedAt DATETIME NULL,
        DeletedAt DATETIME NULL,
        CONSTRAINT UQ_UserSSHKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
    );
    
    PRINT 'Created UserSSHKeys table';
END
ELSE
BEGIN
    PRINT 'UserSSHKeys table already exists';
END

-- Add GPG keys table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGPGKeys')
BEGIN
    CREATE TABLE UserGPGKeys (
        KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
        Title NVARCHAR(100) NOT NULL,
        KeyType VARCHAR(20) NOT NULL,
        KeyValue NVARCHAR(MAX) NOT NULL,
        Fingerprint VARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        ExpiresAt DATETIME NULL,
        DeletedAt DATETIME NULL,
        CONSTRAINT UQ_UserGPGKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
    );
    
    PRINT 'Created UserGPGKeys table';
END
ELSE
BEGIN
    PRINT 'UserGPGKeys table already exists';
END

USE campushubt;

-- Add Type column to EmailVerifications table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'EmailVerifications' AND COLUMN_NAME = 'Type'
)
BEGIN
    ALTER TABLE EmailVerifications
    ADD Type VARCHAR(20) NULL DEFAULT 'email_verification';
    
    PRINT 'Type column added to EmailVerifications table';
END
ELSE
BEGIN
    -- Check if the Type column size should be increased
    DECLARE @TypeColumnLength INT;
    SELECT @TypeColumnLength = CHARACTER_MAXIMUM_LENGTH 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'EmailVerifications' AND COLUMN_NAME = 'Type';
    
    IF @TypeColumnLength < 20
    BEGIN
        ALTER TABLE EmailVerifications
        ALTER COLUMN Type VARCHAR(20);
        
        PRINT 'Type column modified to VARCHAR(20)';
    END
    ELSE
    BEGIN
        PRINT 'Type column already exists with sufficient length';
    END
END;

use campushubt;

SELECT * from users;