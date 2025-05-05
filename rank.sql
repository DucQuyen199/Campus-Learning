-- Bảng UserRankings: Quản lý xếp hạng và thành tích của người dùng
CREATE TABLE UserRankings (
    RankingID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của xếp hạng
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với bảng Users
    Tier VARCHAR(20), -- Hạng: Master, Diamond, Platinum, Gold, Silver, Bronze
    TotalPoints INT DEFAULT 0, -- Tổng điểm
    EventPoints INT DEFAULT 0, -- Điểm từ sự kiện
    CoursePoints INT DEFAULT 0, -- Điểm từ khóa học
    ProblemsSolved INT DEFAULT 0, -- Số bài tập đã giải
    Accuracy DECIMAL(5,2) DEFAULT 0, -- Độ chính xác
    Wins INT DEFAULT 0, -- Số lần chiến thắng
    MonthlyScore INT DEFAULT 0, -- Điểm tháng
    WeeklyScore INT DEFAULT 0, -- Điểm tuần
    LastCalculatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tính toán gần nhất
    CONSTRAINT CHK_Ranking_Tier CHECK (Tier IN ('MASTER', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE')) -- Kiểm tra hạng hợp lệ
);
GO

use campushubt;
-- Bảng Achievements: Quản lý các loại thành tích và huy hiệu có thể đạt được
CREATE TABLE Achievements (
    AchievementID INT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của thành tích
    Name NVARCHAR(100) NOT NULL, -- Tên thành tích
    Description NVARCHAR(500), -- Mô tả thành tích
    Type VARCHAR(50), -- Loại thành tích
    Icon VARCHAR(255), -- Đường dẫn icon
    Points INT DEFAULT 0, -- Điểm thưởng
    Criteria NVARCHAR(MAX), -- Tiêu chí đạt thành tích dạng JSON
    CreatedAt DATETIME DEFAULT GETDATE() -- Thời điểm tạo
);
GO

-- Bảng UserAchievements: Lưu trữ thành tích đã đạt được của người dùng
CREATE TABLE UserAchievements (
    UserAchievementID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với bảng Users
    AchievementID INT FOREIGN KEY REFERENCES Achievements(AchievementID), -- Liên kết với bảng Achievements
    EarnedAt DATETIME DEFAULT GETDATE(), -- Thời điểm đạt được
    Progress INT DEFAULT 0, -- Tiến độ hoàn thành
    CONSTRAINT UQ_User_Achievement UNIQUE (UserID, AchievementID) -- Đảm bảo không trùng lặp thành tích
);
GO

-- Thành tích liên quan đến sự kiện
CREATE TABLE EventAchievements (
    EventAchievementID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID),
    AchievementID INT FOREIGN KEY REFERENCES Achievements(AchievementID),
    AwardedAt DATETIME DEFAULT GETDATE()
);
GO

-- Thành tích liên quan đến khóa học
CREATE TABLE CourseAchievements (
    CourseAchievementID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID),
    CourseID BIGINT FOREIGN KEY REFERENCES Courses(CourseID),
    AchievementID INT FOREIGN KEY REFERENCES Achievements(AchievementID),
    AwardedAt DATETIME DEFAULT GETDATE()
);
GO

-- Chi tiết giải thưởng
CREATE TABLE EventPrizes (
    PrizeID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của giải thưởng
    EventID BIGINT FOREIGN KEY REFERENCES Events(EventID), -- Liên kết với sự kiện
    Rank INT, -- Thứ hạng
    PrizeAmount DECIMAL(10,2), -- Giá trị giải thưởng
    Description NVARCHAR(500), -- Mô tả giải thưởng
    CONSTRAINT CHK_Prize_Rank CHECK (Rank > 0) -- Kiểm tra thứ hạng hợp lệ
);
GO

-- Bảng lịch sử điểm ranking
CREATE TABLE RankingHistory (
    HistoryID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của lịch sử
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    Type VARCHAR(20), -- Loại hoạt động (EVENT hoặc COURSE)
    RelatedID BIGINT, -- ID của sự kiện hoặc khóa học liên quan
    PointsEarned INT, -- Số điểm đạt được
    Reason NVARCHAR(255), -- Lý do được cộng điểm
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo bản ghi
    CONSTRAINT CHK_Ranking_Type CHECK (Type IN ('EVENT', 'COURSE')) -- Kiểm tra loại hoạt động hợp lệ
);
GO

-- Bảng thống kê theo thời gian
CREATE TABLE RankingStats (
    StatID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của thống kê
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    PeriodType VARCHAR(20), -- Loại kỳ thống kê (WEEKLY, MONTHLY, ALL_TIME)
    StartDate DATE, -- Ngày bắt đầu kỳ thống kê
    EndDate DATE, -- Ngày kết thúc kỳ thống kê
    TotalPoints INT DEFAULT 0, -- Tổng điểm trong kỳ
    EventsParticipated INT DEFAULT 0, -- Số sự kiện đã tham gia
    CoursesCompleted INT DEFAULT 0, -- Số khóa học đã hoàn thành
    AverageAccuracy DECIMAL(5,2), -- Độ chính xác trung bình
    CONSTRAINT CHK_Period_Type CHECK (PeriodType IN ('WEEKLY', 'MONTHLY', 'ALL_TIME')) -- Kiểm tra loại kỳ thống kê hợp lệ
);
GO

-- Indexes for Ranking System
CREATE INDEX IX_UserRankings_TotalPoints ON UserRankings(TotalPoints DESC); -- Index cho cột TotalPoints để tối ưu sắp xếp theo điểm
CREATE INDEX IX_UserRankings_Tier ON UserRankings(Tier); -- Index cho cột Tier để tối ưu tìm kiếm theo hạng
CREATE INDEX IX_EventAchievements_UserID ON EventAchievements(UserID); -- Index cho cột UserID trong bảng EventAchievements để tối ưu join
CREATE INDEX IX_CourseAchievements_UserID ON CourseAchievements(UserID); -- Index cho cột UserID trong bảng CourseAchievements để tối ưu join
CREATE INDEX IX_RankingHistory_UserID ON RankingHistory(UserID); -- Index cho cột UserID trong bảng RankingHistory để tối ưu join
CREATE INDEX IX_RankingStats_UserID_PeriodType ON RankingStats(UserID, PeriodType); -- Index kết hợp cho UserID và PeriodType để tối ưu tìm kiếm thống kê
GO

-- Trigger để cập nhật điểm ranking khi có thành tích mới
CREATE TRIGGER TR_UpdateRankingPoints
ON RankingHistory
AFTER INSERT -- Kích hoạt sau khi thêm bản ghi mới vào RankingHistory
AS
BEGIN
    UPDATE ur -- Cập nhật bảng UserRankings
    SET TotalPoints = ur.TotalPoints + i.PointsEarned, -- Cộng điểm mới vào tổng điểm
        LastCalculatedAt = GETDATE() -- Cập nhật thời điểm tính toán
    FROM UserRankings ur
    INNER JOIN inserted i ON ur.UserID = i.UserID; -- Join với bản ghi mới thêm vào
END;
GO

-- Trigger để tự động tính toán và cập nhật tier
CREATE TRIGGER TR_UpdateUserTier
ON UserRankings
AFTER UPDATE -- Kích hoạt sau khi cập nhật bảng UserRankings
AS
BEGIN
    IF UPDATE(TotalPoints) -- Chỉ thực hiện khi TotalPoints bị thay đổi
    BEGIN
        UPDATE ur
        SET Tier = -- Cập nhật tier dựa trên tổng điểm
            CASE
                WHEN TotalPoints >= 10000 THEN 'MASTER'
                WHEN TotalPoints >= 5000 THEN 'DIAMOND'
                WHEN TotalPoints >= 2500 THEN 'PLATINUM'
                WHEN TotalPoints >= 1000 THEN 'GOLD'
                WHEN TotalPoints >= 500 THEN 'SILVER'
                ELSE 'BRONZE'
            END
        FROM UserRankings ur
        INNER JOIN inserted i ON ur.RankingID = i.RankingID; -- Join với bản ghi bị cập nhật
    END;
END;
GO