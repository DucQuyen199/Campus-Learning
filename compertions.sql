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

use campushubt;
-- Check competition ID 2's status
SELECT CompetitionID, Title, Status, StartTime, EndTime, CurrentParticipants, MaxParticipants
FROM Competitions
WHERE CompetitionID = 2;

-- Update competition ID 2's status to 'upcoming' if it's not already
UPDATE Competitions
SET Status = 'upcoming', 
    UpdatedAt = GETDATE()
WHERE CompetitionID = 2 
AND Status NOT IN ('upcoming', 'ongoing'); 

-- Check current status of competition ID 2
SELECT CompetitionID, Title, Status, StartTime, EndTime, CurrentParticipants, MaxParticipants
FROM Competitions
WHERE CompetitionID = 2;

-- Update competition ID 2's status to 'ongoing'
UPDATE Competitions
SET Status = 'ongoing', 
    UpdatedAt = GETDATE()
WHERE CompetitionID = 2; 

-- Tạo cuộc thi 2: Lập trình Python cơ bản
INSERT INTO [dbo].[Competitions] (
    [Title], [Description], [StartTime], [EndTime], [Duration], 
    [Difficulty], [Status], [MaxParticipants], [CurrentParticipants],
    [CreatedAt], [UpdatedAt]
)
VALUES (
    N'Cuộc Thi Lập Trình Python Cơ Bản', 
    N'Cuộc thi dành cho người mới học Python, gồm 3 bài tập cơ bản giúp nắm vững kiến thức nền tảng về ngôn ngữ.',
    DATEADD(day, 2, GETDATE()), -- Bắt đầu sau 2 ngày
    DATEADD(day, 9, GETDATE()), -- Kết thúc sau 7 ngày từ ngày bắt đầu
    120, -- Thời gian làm bài 120 phút
    N'Dễ',
    'upcoming',
    100,
    0,
    GETDATE(),
    GETDATE()
);

-- Lấy ID của cuộc thi Python vừa tạo
DECLARE @pythonCompetitionId BIGINT = SCOPE_IDENTITY();

-- Bài tập 1: Hello Python
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [SampleInput], [SampleOutput], [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pythonCompetitionId,
    N'Hello Python',
    N'Viết chương trình Python đầu tiên để hiển thị dòng chữ "Hello, Python!"',
    N'Dễ',
    50,
    1,
    256,
    N'Không có đầu vào',
    N'In ra dòng chữ "Hello, Python!"',
    N'',
    N'Hello, Python!',
    N'# Viết code của bạn tại đây

',
    '[{"input":"","output":"Hello, Python!"}]',
    '[{"input":"","output":"Hello, Python!"}]'
);

-- Bài tập 2: Tính tổng dãy số
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation], 
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pythonCompetitionId,
    N'Tổng Dãy Số',
    N'Viết chương trình nhập vào một dãy số nguyên và tính tổng của chúng.',
    N'Dễ',
    75,
    1,
    256,
    N'Dòng đầu tiên chứa số nguyên n là số lượng phần tử. Dòng thứ hai chứa n số nguyên cách nhau bởi dấu cách.',
    N'In ra một số nguyên duy nhất là tổng của dãy số.',
    N'1 ≤ n ≤ 100, -1000 ≤ a[i] ≤ 1000',
    N'5
1 2 3 4 5',
    N'15',
    N'1 + 2 + 3 + 4 + 5 = 15',
    N'# Viết code của bạn tại đây

',
    '[{"input":"5\n1 2 3 4 5","output":"15"},{"input":"3\n10 20 30","output":"60"}]',
    '[{"input":"10\n1 2 3 4 5 6 7 8 9 10","output":"55"},{"input":"4\n-5 0 5 10","output":"10"}]'
);

-- Bài tập 3: Số nguyên tố trong khoảng
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation],
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pythonCompetitionId,
    N'Số Nguyên Tố Trong Khoảng',
    N'Viết chương trình tìm tất cả các số nguyên tố trong khoảng từ a đến b.',
    N'Trung bình',
    100,
    1,
    256,
    N'Hai số nguyên a và b, cách nhau bởi dấu cách.',
    N'In ra tất cả các số nguyên tố trong khoảng từ a đến b, mỗi số trên một dòng.',
    N'1 ≤ a ≤ b ≤ 10000, b - a ≤ 100',
    N'10 20',
    N'11
13
17
19',
    N'Các số nguyên tố trong khoảng từ 10 đến 20 là 11, 13, 17 và 19.',
    N'# Viết code của bạn tại đây

',
    '[{"input":"10 20","output":"11\n13\n17\n19"},{"input":"1 10","output":"2\n3\n5\n7"}]',
    '[{"input":"50 60","output":"53\n59"},{"input":"7 7","output":"7"}]'
);

-- Cập nhật hình ảnh cho cuộc thi Python
UPDATE [dbo].[Competitions]
SET 
    [ThumbnailUrl] = N'https://placehold.co/600x400?text=Python+Programming',
    [CoverImageURL] = N'https://placehold.co/1200x400?text=Python+Programming+Course',
    [UpdatedAt] = GETDATE()
WHERE [CompetitionID] = @pythonCompetitionId;

-- Tạo cuộc thi 3: Lập trình JavaScript
INSERT INTO [dbo].[Competitions] (
    [Title], [Description], [StartTime], [EndTime], [Duration], 
    [Difficulty], [Status], [MaxParticipants], [CurrentParticipants],
    [CreatedAt], [UpdatedAt]
)
VALUES (
    N'Cuộc Thi Lập Trình JavaScript', 
    N'Cuộc thi lập trình JavaScript cơ bản dành cho người mới bắt đầu, tìm hiểu về syntax và cách xử lý dữ liệu.',
    DATEADD(day, 5, GETDATE()), -- Bắt đầu sau 5 ngày
    DATEADD(day, 12, GETDATE()), -- Kết thúc sau 7 ngày từ ngày bắt đầu
    90, -- Thời gian làm bài 90 phút
    N'Trung bình',
    'upcoming',
    80,
    0,
    GETDATE(),
    GETDATE()
);

-- Lấy ID của cuộc thi JavaScript vừa tạo
DECLARE @jsCompetitionId BIGINT = SCOPE_IDENTITY();

-- Bài tập 1: Hello JavaScript
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [SampleInput], [SampleOutput], [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @jsCompetitionId,
    N'Hello JavaScript',
    N'Viết một hàm trong JavaScript để hiển thị "Hello, JavaScript!"',
    N'Dễ',
    50,
    1,
    256,
    N'Không có đầu vào',
    N'In ra dòng chữ "Hello, JavaScript!"',
    N'',
    N'Hello, JavaScript!',
    N'function greeting() {
    // Viết code của bạn tại đây
    
}

// Không sửa code bên dưới
console.log(greeting());',
    '[{"input":"","output":"Hello, JavaScript!"}]',
    '[{"input":"","output":"Hello, JavaScript!"}]'
);

-- Bài tập 2: Tìm số lớn nhất
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation], 
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @jsCompetitionId,
    N'Tìm Số Lớn Nhất',
    N'Viết một hàm findMax nhận vào một mảng số nguyên và trả về số lớn nhất trong mảng.',
    N'Dễ',
    75,
    1,
    256,
    N'Một mảng các số nguyên.',
    N'Số nguyên lớn nhất trong mảng.',
    N'-1000 ≤ a[i] ≤ 1000, độ dài mảng tối đa là 100',
    N'[1, 5, 3, 9, 2]',
    N'9',
    N'Số lớn nhất trong mảng [1, 5, 3, 9, 2] là 9.',
    N'function findMax(arr) {
    // Viết code của bạn tại đây
    
}

// Không sửa code bên dưới
const input = JSON.parse(readline());
console.log(findMax(input));',
    '[{"input":"[1, 5, 3, 9, 2]","output":"9"},{"input":"[-5, -10, -3, -1]","output":"-1"}]',
    '[{"input":"[100, 50, 75, 99]","output":"100"},{"input":"[0, 0, 0, 0]","output":"0"}]'
);

-- Bài tập 3: Đếm từ
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation],
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @jsCompetitionId,
    N'Đếm Từ',
    N'Viết hàm đếm số từ trong một chuỗi. Các từ được phân tách bởi dấu cách.',
    N'Trung bình',
    100,
    1,
    256,
    N'Một chuỗi string.',
    N'Số từ trong chuỗi.',
    N'Độ dài chuỗi không quá 1000 ký tự.',
    N'Hello world JavaScript',
    N'3',
    N'Chuỗi "Hello world JavaScript" có 3 từ.',
    N'function countWords(text) {
    // Viết code của bạn tại đây
    
}

// Không sửa code bên dưới
const input = readline();
console.log(countWords(input));',
    '[{"input":"Hello world JavaScript","output":"3"},{"input":"This is a test","output":"4"}]',
    '[{"input":"Programming is fun","output":"3"},{"input":"JavaScript","output":"1"}]'
);

-- Cập nhật hình ảnh cho cuộc thi JavaScript
UPDATE [dbo].[Competitions]
SET 
    [ThumbnailUrl] = N'https://placehold.co/600x400?text=JavaScript+Programming',
    [CoverImageURL] = N'https://placehold.co/1200x400?text=JavaScript+Fundamentals',
    [UpdatedAt] = GETDATE()
WHERE [CompetitionID] = @jsCompetitionId; 

use campushubt;

select * from Competitions;

update Competitions set ThumbnailUrl = 'https://static.wixstatic.com/media/460abf_cae92f05928a44fa9775e1c544aa3577~mv2.jpg/v1/fill/w_556,h_312,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/460abf_cae92f05928a44fa9775e1c544aa3577~mv2.jpg', CoverImageURL = 'https://static.wixstatic.com/media/460abf_cae92f05928a44fa9775e1c544aa3577~mv2.jpg/v1/fill/w_556,h_312,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/460abf_cae92f05928a44fa9775e1c544aa3577~mv2.jpg' where CompetitionID = 4;


-- Tạo cuộc thi 4: Giải Thuật Cơ Bản (Đa ngôn ngữ)
INSERT INTO [dbo].[Competitions] (
    [Title], [Description], [StartTime], [EndTime], [Duration], 
    [Difficulty], [Status], [MaxParticipants], [CurrentParticipants],
    [CreatedAt], [UpdatedAt]
)
VALUES (
    N'Giải Thuật Cơ Bản (Đa ngôn ngữ)', 
    N'Cuộc thi dành cho người học lập trình, tập trung vào các giải thuật cơ bản. Thí sinh có thể sử dụng bất kỳ ngôn ngữ lập trình nào (C, C++, Java, Python, JavaScript, PHP, Go, Ruby...).',
    DATEADD(day, 3, GETDATE()), -- Bắt đầu sau 3 ngày
    DATEADD(day, 10, GETDATE()), -- Kết thúc sau 7 ngày từ ngày bắt đầu
    150, -- Thời gian làm bài 150 phút
    N'Trung bình',
    'upcoming',
    120,
    0,
    GETDATE(),
    GETDATE()
);

-- Lấy ID của cuộc thi Giải Thuật vừa tạo
DECLARE @algoCompetitionId BIGINT = SCOPE_IDENTITY();

-- Bài tập 1: Đảo ngược chuỗi
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [SampleInput], [SampleOutput], [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @algoCompetitionId,
    N'Đảo Ngược Chuỗi',
    N'Viết một chương trình để đảo ngược một chuỗi đầu vào. Bạn có thể sử dụng bất kỳ ngôn ngữ lập trình nào được hỗ trợ.',
    N'Dễ',
    50,
    1,
    256,
    N'Một chuỗi text.',
    N'Chuỗi text đã đảo ngược.',
    N'hello',
    N'olleh',
    N'// Code mẫu cho Java:
public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>
#include <string>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"hello","output":"olleh"},{"input":"algorithm","output":"mhtirogla"}]',
    '[{"input":"programming","output":"gnimmargorp"},{"input":"competition","output":"noititepmoc"}]'
);

-- Bài tập 2: Kiểm tra số palindrome
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation], 
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @algoCompetitionId,
    N'Kiểm Tra Số Palindrome',
    N'Viết một chương trình để kiểm tra xem một số có phải là palindrome hay không. Một số palindrome là số đọc từ trái sang phải hay từ phải sang trái đều giống nhau (ví dụ: 121, 1221).',
    N'Dễ',
    75,
    1,
    256,
    N'Một số nguyên dương n.',
    N'In ra "true" nếu số là palindrome, ngược lại in ra "false".',
    N'1 ≤ n ≤ 10^9',
    N'121',
    N'true',
    N'121 đọc từ trái sang phải hoặc từ phải sang trái đều là 121.',
    N'// Code mẫu cho Java:
public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"121","output":"true"},{"input":"123","output":"false"}]',
    '[{"input":"12321","output":"true"},{"input":"12345","output":"false"}]'
);

-- Bài tập 3: Tính số Fibonacci
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation],
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @algoCompetitionId,
    N'Số Fibonacci',
    N'Viết chương trình tính số Fibonacci thứ n. Dãy Fibonacci bắt đầu từ 0 và 1, mỗi số tiếp theo là tổng của hai số trước đó (ví dụ: 0, 1, 1, 2, 3, 5, 8, ...).',
    N'Trung bình',
    100,
    2,
    256,
    N'Một số nguyên dương n.',
    N'Số Fibonacci thứ n.',
    N'0 ≤ n ≤ 45',
    N'5',
    N'5',
    N'Dãy Fibonacci: 0, 1, 1, 2, 3, 5, ... Vị trí thứ 5 có giá trị là 5.',
    N'// Code mẫu cho Java:
public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"5","output":"5"},{"input":"10","output":"55"}]',
    '[{"input":"0","output":"0"},{"input":"1","output":"1"},{"input":"20","output":"6765"}]'
);

-- Cập nhật hình ảnh cho cuộc thi Giải Thuật
UPDATE [dbo].[Competitions]
SET 
    [ThumbnailUrl] = N'https://placehold.co/600x400?text=Algoritms+Competition',
    [CoverImageURL] = N'https://placehold.co/1200x400?text=Algorithms+Fundamentals',
    [UpdatedAt] = GETDATE()
WHERE [CompetitionID] = @algoCompetitionId;

-- Tạo cuộc thi 5: Ứng Dụng Thực Tế (Đa ngôn ngữ)
INSERT INTO [dbo].[Competitions] (
    [Title], [Description], [StartTime], [EndTime], [Duration], 
    [Difficulty], [Status], [MaxParticipants], [CurrentParticipants],
    [CreatedAt], [UpdatedAt]
)
VALUES (
    N'Ứng Dụng Thực Tế (Đa ngôn ngữ)', 
    N'Cuộc thi tập trung vào các bài toán ứng dụng thực tế. Thí sinh có thể sử dụng bất kỳ ngôn ngữ lập trình nào phù hợp với bài toán.',
    DATEADD(day, 7, GETDATE()), -- Bắt đầu sau 7 ngày
    DATEADD(day, 14, GETDATE()), -- Kết thúc sau 7 ngày từ ngày bắt đầu
    180, -- Thời gian làm bài 180 phút
    N'Trung bình',
    'upcoming',
    90,
    0,
    GETDATE(),
    GETDATE()
);

-- Lấy ID của cuộc thi Ứng dụng vừa tạo
DECLARE @pracCompetitionId BIGINT = SCOPE_IDENTITY();

-- Bài tập 1: Trình quản lý danh bạ
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [SampleInput], [SampleOutput], [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pracCompetitionId,
    N'Trình Quản Lý Danh Bạ',
    N'Viết chương trình quản lý danh bạ với các chức năng thêm, sửa, xóa và tìm kiếm liên hệ. Mỗi liên hệ bao gồm tên và số điện thoại.',
    N'Trung bình',
    70,
    3,
    512,
    N'Các lệnh theo định dạng: ADD [name] [phone], FIND [name], DELETE [name], EDIT [name] [new_phone], LIST',
    N'Kết quả tương ứng với từng lệnh.',
    N'ADD John 0123456789
FIND John
ADD Mary 0987654321
LIST
DELETE John
LIST',
    N'Contact added
John: 0123456789
Contact added
John: 0123456789
Mary: 0987654321
Contact deleted
Mary: 0987654321',
    N'// Code mẫu cho Java:
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>
#include <string>
#include <map>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"ADD John 0123456789\nFIND John\nADD Mary 0987654321\nLIST\nDELETE John\nLIST","output":"Contact added\nJohn: 0123456789\nContact added\nJohn: 0123456789\nMary: 0987654321\nContact deleted\nMary: 0987654321"}]',
    '[{"input":"ADD Alice 0111222333\nADD Bob 0444555666\nEDIT Alice 0999888777\nFIND Alice\nLIST","output":"Contact added\nContact added\nContact updated\nAlice: 0999888777\nAlice: 0999888777\nBob: 0444555666"}]'
);

-- Bài tập 2: Quản lý sinh viên
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation], 
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pracCompetitionId,
    N'Quản Lý Sinh Viên',
    N'Viết chương trình quản lý sinh viên với các chức năng thêm sinh viên, thêm điểm cho sinh viên, tính điểm trung bình và hiển thị danh sách sinh viên theo điểm.',
    N'Khó',
    100,
    3,
    512,
    N'Các lệnh theo định dạng: ADD_STUDENT [id] [name], ADD_GRADE [id] [course] [grade], GET_AVG [id], RANK',
    N'Kết quả tương ứng với từng lệnh.',
    N'Mỗi sinh viên có tối đa 10 môn học với điểm từ 0-10.',
    N'ADD_STUDENT 1 John
ADD_STUDENT 2 Mary
ADD_GRADE 1 Math 8.5
ADD_GRADE 1 Physics 7.0
ADD_GRADE 2 Math 9.0
GET_AVG 1
RANK',
    N'Student added
Student added
Grade added
Grade added
Grade added
7.75
1. Mary: 9.00
2. John: 7.75',
    N'Điểm trung bình của John là (8.5 + 7.0) / 2 = 7.75',
    N'// Code mẫu cho Java:
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>
#include <string>
#include <map>
#include <vector>
#include <algorithm>
#include <iomanip>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"ADD_STUDENT 1 John\nADD_STUDENT 2 Mary\nADD_GRADE 1 Math 8.5\nADD_GRADE 1 Physics 7.0\nADD_GRADE 2 Math 9.0\nGET_AVG 1\nRANK","output":"Student added\nStudent added\nGrade added\nGrade added\nGrade added\n7.75\n1. Mary: 9.00\n2. John: 7.75"}]',
    '[{"input":"ADD_STUDENT 1 Alice\nADD_STUDENT 2 Bob\nADD_STUDENT 3 Charlie\nADD_GRADE 1 Math 8.0\nADD_GRADE 2 Math 7.0\nADD_GRADE 3 Math 9.0\nADD_GRADE 1 Physics 9.0\nADD_GRADE 2 Physics 8.0\nADD_GRADE 3 Physics 7.0\nRANK","output":"Student added\nStudent added\nStudent added\nGrade added\nGrade added\nGrade added\nGrade added\nGrade added\nGrade added\n1. Alice: 8.50\n2. Charlie: 8.00\n3. Bob: 7.50"}]'
);

-- Bài tập 3: Phân tích văn bản
INSERT INTO [dbo].[CompetitionProblems] (
    [CompetitionID], [Title], [Description], [Difficulty], [Points],
    [TimeLimit], [MemoryLimit], [InputFormat], [OutputFormat],
    [Constraints], [SampleInput], [SampleOutput], [Explanation],
    [StarterCode], [TestCasesVisible], [TestCasesHidden]
)
VALUES (
    @pracCompetitionId,
    N'Phân Tích Văn Bản',
    N'Viết chương trình phân tích văn bản: đếm số từ, số câu, từ xuất hiện nhiều nhất, và độ dài trung bình của câu.',
    N'Khó',
    120,
    3,
    512,
    N'Một văn bản có thể bao gồm nhiều dòng. Kết thúc đầu vào bằng dòng "END".',
    N'Số từ, số câu, từ xuất hiện nhiều nhất và số lần xuất hiện của nó, độ dài trung bình của câu (số từ).',
    N'Văn bản có thể chứa tối đa 5000 từ.',
    N'This is a sample text. It contains two sentences.
END',
    N'Words: 9
Sentences: 2
Most frequent: is (1)
Average sentence length: 4.5',
    N'Có 9 từ, 2 câu. Từ "is" xuất hiện 1 lần. Độ dài trung bình của câu là 4.5 từ.',
    N'// Code mẫu cho Java:
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Viết code của bạn tại đây
        
    }
}

# Code mẫu cho Python:
# Viết code của bạn tại đây

// Code mẫu cho JavaScript:
// Viết code của bạn tại đây

// Code mẫu cho C++:
#include <iostream>
#include <string>
#include <map>
#include <vector>
#include <sstream>
#include <algorithm>
#include <iomanip>

int main() {
    // Viết code của bạn tại đây
    
    return 0;
}',
    '[{"input":"This is a sample text. It contains two sentences.\nEND","output":"Words: 9\nSentences: 2\nMost frequent: is (1)\nAverage sentence length: 4.5"}]',
    '[{"input":"The quick brown fox jumps over the lazy dog. The fox is quick and brown. The dog is lazy.\nEND","output":"Words: 19\nSentences: 3\nMost frequent: the (4)\nAverage sentence length: 6.33"}]'
);

-- Cập nhật hình ảnh cho cuộc thi Ứng dụng thực tế
UPDATE [dbo].[Competitions]
SET 
    [ThumbnailUrl] = N'https://funix.edu.vn/wp-content/uploads/2022/04/lap-trinh-c-co-ban-1.png',
    [CoverImageURL] = N'https://funix.edu.vn/wp-content/uploads/2022/04/lap-trinh-c-co-ban-1.png',
    [UpdatedAt] = GETDATE()
WHERE [CompetitionID] = 6;

select * from Competitions;
-- Đảm bảo tất cả các cuộc thi có trạng thái đúng
UPDATE [dbo].[Competitions]
SET 
    Status = 'ongoing',
    UpdatedAt = GETDATE()
WHERE CompetitionID IN (2, 3, 4, @algoCompetitionId, @pracCompetitionId);

