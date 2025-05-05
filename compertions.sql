
CREATE TABLE [dbo].[CompetitionProblems] (
    [ProblemID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [CompetitionID]    BIGINT         NOT NULL,
    [Title]            NVARCHAR (200) NOT NULL,
    [Description]      NTEXT          NOT NULL,
    [Difficulty]       NVARCHAR (20)  DEFAULT (N'Trung bình') NOT NULL,
    [Points]           INT            DEFAULT ((100)) NOT NULL,
    [TimeLimit]        INT            DEFAULT ((1)) NOT NULL,
    [MemoryLimit]      INT            DEFAULT ((256)) NOT NULL,
    [InputFormat]      NTEXT          NULL,
    [OutputFormat]     NTEXT          NULL,
    [Constraints]      NTEXT          NULL,
    [SampleInput]      NTEXT          NULL,
    [SampleOutput]     NTEXT          NULL,
    [Explanation]      NTEXT          NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [ImageURL]         NVARCHAR (500) NULL,
    [StarterCode]      NVARCHAR (MAX) NULL,
    [TestCasesVisible] NVARCHAR (MAX) NULL,
    [TestCasesHidden]  NVARCHAR (MAX) NULL,
    [Tags]             NVARCHAR (500) NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([ProblemID] ASC),
    CONSTRAINT [CHK_Problem_Difficulty] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    FOREIGN KEY ([CompetitionID]) REFERENCES [dbo].[Competitions] ([CompetitionID])
);


CREATE TABLE [dbo].[CompetitionSubmissions] (
    [SubmissionID]  BIGINT          IDENTITY (1, 1) NOT NULL,
    [ProblemID]     BIGINT          NOT NULL,
    [ParticipantID] BIGINT          NOT NULL,
    [SourceCode]    NTEXT           NOT NULL,
    [Language]      NVARCHAR (50)   NOT NULL,
    [Status]        NVARCHAR (50)   DEFAULT ('pending') NOT NULL,
    [Score]         INT             DEFAULT ((0)) NOT NULL,
    [ExecutionTime] DECIMAL (10, 3) NULL,
    [MemoryUsed]    INT             NULL,
    [ErrorMessage]  NTEXT           NULL,
    [SubmittedAt]   DATETIME        DEFAULT (getdate()) NOT NULL,
    [JudgedAt]      DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [CHK_Submission_Status_New] CHECK ([Status]='compilation_error' OR [Status]='runtime_error' OR [Status]='memory_limit_exceeded' OR [Status]='time_limit_exceeded' OR [Status]='wrong_answer' OR [Status]='accepted' OR [Status]='running' OR [Status]='compiling' OR [Status]='pending'),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionParticipants] FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[CompetitionParticipants] ([ParticipantID]),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionProblems] FOREIGN KEY ([ProblemID]) REFERENCES [dbo].[CompetitionProblems] ([ProblemID])
);


GO

CREATE TABLE [dbo].[CompetitionParticipants] (
    [ParticipantID]          BIGINT        IDENTITY (1, 1) NOT NULL,
    [CompetitionID]          BIGINT        NOT NULL,
    [UserID]                 BIGINT        NOT NULL,
    [RegistrationTime]       DATETIME      DEFAULT (getdate()) NOT NULL,
    [Score]                  INT           DEFAULT ((0)) NOT NULL,
    [Rank]                   INT           NULL,
    [Status]                 NVARCHAR (20) DEFAULT ('registered') NOT NULL,
    [StartTime]              DATETIME      NULL,
    [EndTime]                DATETIME      NULL,
    [TotalProblemsAttempted] INT           DEFAULT ((0)) NOT NULL,
    [TotalProblemsSolved]    INT           DEFAULT ((0)) NOT NULL,
    [Feedback]               NTEXT         NULL,
    [CreatedAt]              DATETIME      DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]              DATETIME      DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_Participant_Status_New] CHECK ([Status]='disqualified' OR [Status]='completed' OR [Status]='active' OR [Status]='registered'),
    CONSTRAINT [FK_CompetitionParticipants_Competitions] FOREIGN KEY ([CompetitionID]) REFERENCES [dbo].[Competitions] ([CompetitionID]),
    CONSTRAINT [FK_CompetitionParticipants_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UC_Competition_User_New] UNIQUE NONCLUSTERED ([CompetitionID] ASC, [UserID] ASC)
);


CREATE TABLE [dbo].[CompetitionRegistrations] (
    [RegistrationID]   INT           IDENTITY (1, 1) NOT NULL,
    [UserID]           INT           NOT NULL,
    [CompetitionID]    INT           NOT NULL,
    [RegistrationDate] DATETIME      CONSTRAINT [DF_CompetitionRegistrations_RegistrationDate] DEFAULT (getdate()) NULL,
    [Status]           NVARCHAR (20) DEFAULT ('REGISTERED') NOT NULL,
    [Score]            INT           DEFAULT ((0)) NULL,
    [ProblemsSolved]   INT           DEFAULT ((0)) NULL,
    [Ranking]          INT           NULL,
    [CreatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_CreatedAt] DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_UpdatedAt] DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC)
);

select * from [dbo].[CompetitionRegistrations];
CREATE TABLE [dbo].[Competitions] (
    [CompetitionID]       BIGINT          IDENTITY (1, 1) NOT NULL,
    [Title]               NVARCHAR (200)  NOT NULL,
    [Description]         NTEXT           NOT NULL,
    [StartTime]           DATETIME        NOT NULL,
    [EndTime]             DATETIME        NOT NULL,
    [Duration]            INT             NOT NULL,
    [Difficulty]          NVARCHAR (20)   DEFAULT (N'Trung bình') NOT NULL,
    [Status]              NVARCHAR (20)   DEFAULT ('draft') NOT NULL,
    [MaxParticipants]     INT             DEFAULT ((100)) NOT NULL,
    [CurrentParticipants] INT             DEFAULT ((0)) NOT NULL,
    [PrizePool]           DECIMAL (12, 2) DEFAULT ((0)) NOT NULL,
    [OrganizedBy]         BIGINT          NULL,
    [ThumbnailUrl]        NVARCHAR (500)  NULL,
    [CreatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [DeletedAt]           DATETIME        NULL,
    [CoverImageURL]       NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([CompetitionID] ASC),
    CONSTRAINT [CHK_Competition_Difficulty] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    CONSTRAINT [CHK_Competition_Difficulty_New] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    CONSTRAINT [CHK_Competition_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming' OR [Status]='draft'),
    CONSTRAINT [CHK_Competition_Status_New] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming' OR [Status]='draft'),
    FOREIGN KEY ([OrganizedBy]) REFERENCES [dbo].[Users] ([UserID])
);

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
-- Tạo cuộc thi mới
INSERT INTO [dbo].[Competitions] (
    [Title], [Description], [StartTime], [EndTime], [Duration], 
    [Difficulty], [Status], [MaxParticipants], [CurrentParticipants],
    [CreatedAt], [UpdatedAt]
)
VALUES (
    N'Cuộc Thi Lập Trình C++ Cơ Bản', 
    N'Cuộc thi dành cho người mới học C++, gồm 3 bài tập cơ bản giúp nắm vững kiến thức nền tảng về ngôn ngữ.',
    DATEADD(day, 1, GETDATE()), -- Bắt đầu vào ngày mai
    DATEADD(day, 8, GETDATE()), -- Kết thúc sau 7 ngày
    120, -- Thời gian làm bài 120 phút
    N'Dễ',
    'upcoming',
    100,
    0,
    GETDATE(),
    GETDATE()
);

-- Lấy ID của cuộc thi vừa tạo
DECLARE @competitionId BIGINT = SCOPE_IDENTITY();

-- Bài tập 1: Hello World
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [SampleInput], [SampleOutput], [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @competitionId,
    N'Hello C++',
    N'Viết chương trình C++ đầu tiên để hiển thị dòng chữ "Hello, C++!"',
    N'Dễ',
    50,
    1,
    256,
    N'Không có đầu vào',
    N'In ra dòng chữ "Hello, C++!"',
    N'',
    N'Hello, C++!',
    N'#include <iostream>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"","output":"Hello, C++!"}]',
    '[{"input":"","output":"Hello, C++!"}]'
);

-- Bài tập 2: Tính tổng hai số
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation], 
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @competitionId,
    N'Tổng Hai Số',
    N'Viết chương trình nhập vào hai số nguyên a và b, sau đó in ra tổng của chúng.',
    N'Dễ',
    75,
    1,
    256,
    N'Dòng đầu tiên chứa hai số nguyên a và b.',
    N'In ra một số nguyên duy nhất là tổng của a và b.',
    N'-1000 ≤ a, b ≤ 1000',
    N'5 7',
    N'12',
    N'5 + 7 = 12',
    N'#include <iostream>

int main() {
    int a, b;
    // Nhập dữ liệu và tính tổng
    
    return 0;
}',
    '[{"input":"5 7","output":"12"},{"input":"10 20","output":"30"},{"input":"-5 10","output":"5"}]',
    '[{"input":"0 0","output":"0"},{"input":"-100 100","output":"0"},{"input":"999 1","output":"1000"}]'
);

-- Bài tập 3: Số nguyên tố
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation],
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @competitionId,
    N'Kiểm Tra Số Nguyên Tố',
    N'Viết chương trình kiểm tra một số nguyên n có phải là số nguyên tố hay không. Nếu n là số nguyên tố, in ra "YES", ngược lại in ra "NO".',
    N'Dễ',
    100,
    1,
    256,
    N'Một số nguyên dương n.',
    N'In ra "YES" nếu n là số nguyên tố, ngược lại in ra "NO".',
    N'1 ≤ n ≤ 10^6',
    N'7',
    N'YES',
    N'7 là số nguyên tố vì chỉ chia hết cho 1 và chính nó.',
    N'#include <iostream>

int main() {
    int n;
    std::cin >> n;
    
    // Viết code kiểm tra số nguyên tố
    
    return 0;
}',
    '[{"input":"7","output":"YES"},{"input":"1","output":"NO"},{"input":"4","output":"NO"}]',
    '[{"input":"2","output":"YES"},{"input":"97","output":"YES"},{"input":"100","output":"NO"},{"input":"10001","output":"NO"}]'
);

-- Cập nhật hình ảnh cho cuộc thi C++
UPDATE [dbo].[Competitions]
SET 
    [ThumbnailUrl] = N'https://images.careerviet.vn/content/images/ngon-ngu-lap-trinh-c%2B%2B-CareerBuilder-3.png',
    [CoverImageURL] = N'https://glints.com/vn/blog/wp-content/uploads/2022/09/C-La-Gi-Ung-Dung-Ngon-Ngu-Lap-Trinh-C-Trong-Thuc-Te-.jpg',
    [UpdatedAt] = GETDATE()
WHERE [Title] = N'Cuộc Thi Lập Trình C++ Cơ Bản';

-- Cập nhật thời gian bắt đầu, kết thúc và thời lượng cho cuộc thi C++
UPDATE [dbo].[Competitions]
SET 
    [StartTime] = '2025-04-28 00:00:00',
    [EndTime] = '2025-07-30 00:00:00',
    [Duration] = 100000,
    [UpdatedAt] = GETDATE()
WHERE [Title] = N'Cuộc Thi Lập Trình C++ Cơ Bản';