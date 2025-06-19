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
use campushubt;
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

-- Insert TTHCM Exam
INSERT INTO [dbo].[Exams] (
    [CourseID], [Title], [Description], [Type], 
    [Duration], [TotalPoints], [PassingScore], 
    [StartTime], [EndTime], [Instructions], 
    [AllowReview], [ShuffleQuestions], [Status], [CreatedBy]
)
VALUES (
    1, -- Replace with actual CourseID
    N'Tư tưởng Hồ Chí Minh', 
    N'Bài kiểm tra kiến thức về tư tưởng Hồ Chí Minh và các giá trị cốt lõi', 
    'multiple_choice', 
    60, -- 60 minutes duration
    100, -- Total points
    70, -- Passing score
    DATEADD(DAY, 1, GETDATE()), -- Starts tomorrow
    DATEADD(DAY, 1, DATEADD(HOUR, 2, GETDATE())), -- Ends 2 hours after start
    N'Hãy đọc kỹ từng câu hỏi và chọn đáp án đúng nhất. Không được phép tham khảo tài liệu.',
    1, -- Allow review
    1, -- Shuffle questions
    'upcoming',
    1 -- Replace with actual CreatorID
);

DECLARE @ExamID BIGINT;
SET @ExamID = SCOPE_IDENTITY();

-- Multiple Choice Questions
INSERT INTO [dbo].[ExamQuestions] (
    [ExamID], [Type], [Content], [Points], 
    [OrderIndex], [Options], [CorrectAnswer], [Explanation]
)
VALUES 
-- Question 1
(
    @ExamID, 
    'multiple_choice',
    N'Tư tưởng Hồ Chí Minh được hình thành trên cơ sở nào?',
    5,
    1,
    N'["Chủ nghĩa Mác - Lênin", "Truyền thống văn hóa dân tộc Việt Nam", "Tinh hoa văn hóa nhân loại", "Tất cả các phương án trên"]',
    N'Tất cả các phương án trên',
    N'Tư tưởng Hồ Chí Minh được hình thành trên cơ sở chủ nghĩa Mác - Lênin, truyền thống văn hóa dân tộc Việt Nam và tinh hoa văn hóa nhân loại.'
),
-- Question 2
(
    @ExamID, 
    'multiple_choice',
    N'Tư tưởng Hồ Chí Minh về độc lập dân tộc gắn liền với yếu tố nào?',
    5,
    2,
    N'["Chủ nghĩa xã hội", "Tư bản chủ nghĩa", "Phong kiến", "Thực dân mới"]',
    N'Chủ nghĩa xã hội',
    N'Theo tư tưởng Hồ Chí Minh, độc lập dân tộc phải gắn liền với chủ nghĩa xã hội mới có thể giải phóng hoàn toàn dân tộc và nhân dân lao động.'
),
-- Question 3
(
    @ExamID, 
    'multiple_choice',
    N'Hồ Chí Minh xác định động lực của cách mạng Việt Nam là gì?',
    5,
    3,
    N'["Đại đoàn kết toàn dân", "Giai cấp công nhân", "Giai cấp nông dân", "Tầng lớp trí thức"]',
    N'Đại đoàn kết toàn dân',
    N'Theo Hồ Chí Minh, đại đoàn kết toàn dân dựa trên nền tảng liên minh công - nông - trí thức dưới sự lãnh đạo của Đảng là động lực to lớn của cách mạng Việt Nam.'
),
-- Question 4
(
    @ExamID, 
    'multiple_choice',
    N'Theo tư tưởng Hồ Chí Minh, nền văn hóa mới của Việt Nam có mấy tính chất?',
    5,
    4,
    N'["2 tính chất", "3 tính chất", "4 tính chất", "5 tính chất"]',
    N'3 tính chất',
    N'Theo tư tưởng Hồ Chí Minh, nền văn hóa mới của Việt Nam có 3 tính chất: dân tộc, khoa học và đại chúng.'
),
-- Question 5
(
    @ExamID, 
    'multiple_choice',
    N'Hồ Chí Minh khẳng định "Đảng là đạo đức, là văn minh" vào thời gian nào?',
    5,
    5,
    N'["Năm 1947", "Năm 1953", "Năm 1959", "Năm 1969"]',
    N'Năm 1969',
    N'Hồ Chí Minh khẳng định "Đảng là đạo đức, là văn minh" trong Di chúc được viết năm 1969.'
),
-- Question 6
(
    @ExamID, 
    'essay',
    N'Phân tích quan điểm của Hồ Chí Minh về vai trò của đoàn kết quốc tế trong sự nghiệp giải phóng dân tộc và xây dựng chủ nghĩa xã hội ở Việt Nam.',
    15,
    6,
    NULL,
    N'Hồ Chí Minh coi đoàn kết quốc tế là một chiến lược cơ bản, nhất quán, là nguồn lực quan trọng cho cách mạng Việt Nam. Người khẳng định: "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công." Quan điểm này thể hiện qua:
- Kết hợp sức mạnh dân tộc với sức mạnh thời đại
- Đoàn kết với các nước xã hội chủ nghĩa, phong trào công nhân quốc tế
- Đoàn kết với phong trào giải phóng dân tộc và các lực lượng hòa bình, dân chủ trên thế giới
- Thực hiện chính sách ngoại giao rộng mở, hòa bình, hữu nghị và hợp tác
- Vận dụng linh hoạt nguyên tắc "dĩ bất biến, ứng vạn biến" trong quan hệ quốc tế',
    N'Câu trả lời cần phân tích rõ quan điểm của Hồ Chí Minh về tầm quan trọng của đoàn kết quốc tế và cách Người vận dụng trong thực tiễn cách mạng Việt Nam.'
),
-- Question 7
(
    @ExamID, 
    'multiple_choice',
    N'Tư tưởng Hồ Chí Minh về xây dựng nhà nước của dân, do dân, vì dân được thể hiện qua yếu tố nào?',
    5,
    7,
    N'["Nhà nước do nhân dân lao động làm chủ", "Nhà nước của giai cấp công nhân", "Nhà nước của giai cấp tư sản", "Nhà nước phong kiến"]',
    N'Nhà nước do nhân dân lao động làm chủ',
    N'Tư tưởng Hồ Chí Minh khẳng định nhà nước của dân, do dân, vì dân là nhà nước do nhân dân lao động làm chủ, thực hiện quyền làm chủ thông qua nhà nước do họ bầu ra và kiểm soát.'
),
-- Question 8
(
    @ExamID, 
    'multiple_choice',
    N'Theo tư tưởng Hồ Chí Minh, mục tiêu của chủ nghĩa xã hội ở Việt Nam là gì?',
    5,
    8,
    N'["Xóa bỏ áp bức, bất công", "Nhân dân có ăn, có mặc, có chỗ ở và được học hành", "Ai cũng được học hành", "Cả B và C"]',
    N'Cả B và C',
    N'Theo Hồ Chí Minh, mục tiêu của chủ nghĩa xã hội ở Việt Nam là nhân dân có ăn, có mặc, có chỗ ở, ai cũng được học hành, người già yếu có người chăm sóc, làm cho dân giàu nước mạnh, mọi người đều được tự do, hạnh phúc.'
),
-- Question 9
(
    @ExamID, 
    'essay',
    N'Phân tích tư tưởng Hồ Chí Minh về đạo đức cách mạng và ý nghĩa của nó đối với việc xây dựng đạo đức con người Việt Nam hiện nay.',
    15,
    9,
    NULL,
    N'Tư tưởng Hồ Chí Minh về đạo đức cách mạng bao gồm:
1. Quan niệm về vai trò của đạo đức cách mạng:
- Đạo đức là gốc, là nền tảng của người cách mạng
- Có tài mà không có đức thì không thể lãnh đạo nhân dân
- Đạo đức là nhân tố tạo nên sức hấp dẫn của chủ nghĩa xã hội

2. Những chuẩn mực đạo đức cách mạng:
- Trung với nước, hiếu với dân
- Cần, kiệm, liêm, chính, chí công vô tư
- Thương yêu con người, sống có tình nghĩa
- Tinh thần quốc tế trong sáng

3. Phương pháp rèn luyện đạo đức cách mạng:
- Nói đi đôi với làm, phải nêu gương về đạo đức
- Xây đi đôi với chống
- Tu dưỡng đạo đức suốt đời

Ý nghĩa đối với việc xây dựng đạo đức con người Việt Nam hiện nay:
- Là cơ sở để phát triển con người toàn diện
- Góp phần xây dựng nền văn hóa tiên tiến, đậm đà bản sắc dân tộc
- Là nền tảng để chống lại các biểu hiện tiêu cực, tham nhũng, lãng phí
- Tạo động lực nội sinh cho sự phát triển bền vững của đất nước',
    N'Câu trả lời cần phân tích rõ nội dung tư tưởng Hồ Chí Minh về đạo đức cách mạng và liên hệ thực tiễn với việc xây dựng đạo đức con người Việt Nam trong giai đoạn hiện nay.'
),
-- Question 10
(
    @ExamID, 
    'multiple_choice',
    N'Theo Hồ Chí Minh, đặc trưng bản chất của Đảng Cộng sản Việt Nam là gì?',
    5,
    10,
    N'["Đảng của giai cấp công nhân", "Đảng của nhân dân lao động", "Đảng của dân tộc Việt Nam", "Cả A, B và C"]',
    N'Cả A, B và C',
    N'Theo tư tưởng Hồ Chí Minh, Đảng Cộng sản Việt Nam vừa là Đảng của giai cấp công nhân, vừa là Đảng của nhân dân lao động và của cả dân tộc Việt Nam.'
),
-- Question 11
(
    @ExamID, 
    'multiple_choice',
    N'Hồ Chí Minh đánh giá thế nào về vai trò của thanh niên?',
    5,
    11,
    N'["Người chủ tương lai của nước nhà", "Lực lượng xung kích cách mạng", "Người kế tục sự nghiệp cách mạng", "Tất cả các phương án trên"]',
    N'Tất cả các phương án trên',
    N'Hồ Chí Minh đánh giá thanh niên là người chủ tương lai của nước nhà, là lực lượng xung kích cách mạng và là người kế tục trung thành sự nghiệp cách mạng của Đảng và của dân tộc.'
),
-- Question 12
(
    @ExamID, 
    'essay',
    N'Phân tích quan điểm của Hồ Chí Minh về mối quan hệ giữa độc lập dân tộc và chủ nghĩa xã hội. Liên hệ với công cuộc đổi mới ở Việt Nam hiện nay.',
    20,
    12,
    NULL,
    N'Quan điểm của Hồ Chí Minh về mối quan hệ giữa độc lập dân tộc và chủ nghĩa xã hội:

1. Độc lập dân tộc là tiền đề, điều kiện tiên quyết để tiến lên chủ nghĩa xã hội:
- Độc lập dân tộc là mục tiêu trước mắt, là nhiệm vụ hàng đầu của cách mạng
- "Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thật đã thành một nước tự do, độc lập"

2. Chủ nghĩa xã hội là điều kiện để bảo đảm nền độc lập dân tộc vững chắc:
- "Muốn cứu nước và giải phóng dân tộc không có con đường nào khác con đường cách mạng vô sản"
- "Chỉ có chủ nghĩa xã hội, chủ nghĩa cộng sản mới giải phóng được các dân tộc bị áp bức và những người lao động trên thế giới khỏi ách nô lệ"

3. Độc lập dân tộc gắn liền với chủ nghĩa xã hội là quy luật phát triển của cách mạng Việt Nam:
- Độc lập dân tộc phải đi liền với chủ nghĩa xã hội
- Chủ nghĩa xã hội là phương hướng, mục tiêu để phát huy nền độc lập dân tộc

Liên hệ với công cuộc đổi mới ở Việt Nam hiện nay:
- Giữ vững độc lập, chủ quyền dân tộc trong bối cảnh hội nhập quốc tế sâu rộng
- Kiên định mục tiêu độc lập dân tộc gắn liền với chủ nghĩa xã hội
- Đổi mới mô hình phát triển kinh tế thị trường định hướng xã hội chủ nghĩa
- Mở rộng hợp tác quốc tế trên nguyên tắc tôn trọng độc lập, chủ quyền
- Xây dựng nền kinh tế độc lập, tự chủ và hội nhập quốc tế',
    N'Câu trả lời cần phân tích sâu sắc quan điểm của Hồ Chí Minh về mối quan hệ biện chứng giữa độc lập dân tộc và chủ nghĩa xã hội, đồng thời liên hệ rõ ràng với thực tiễn đổi mới ở Việt Nam hiện nay.'
);

-- Insert template for essay questions
INSERT INTO [dbo].[ExamAnswerTemplates] (
    [ExamID], [QuestionID], [Content], [Keywords], [MinimumMatchPercentage], [CreatedBy]
)
SELECT 
    @ExamID,
    QuestionID,
    CorrectAnswer,
    JSON_QUERY(CASE 
        WHEN QuestionID = 6 THEN '["đoàn kết quốc tế", "sức mạnh dân tộc", "sức mạnh thời đại", "ngoại giao", "hòa bình", "phong trào giải phóng dân tộc"]'
        WHEN QuestionID = 9 THEN '["đạo đức cách mạng", "trung với nước", "hiếu với dân", "cần kiệm liêm chính", "nêu gương", "tu dưỡng đạo đức"]'
        WHEN QuestionID = 12 THEN '["độc lập dân tộc", "chủ nghĩa xã hội", "giải phóng dân tộc", "cách mạng", "đổi mới", "hội nhập quốc tế"]'
    END),
    70,
    1 -- Replace with actual CreatorID
FROM [dbo].[ExamQuestions]
WHERE ExamID = @ExamID AND Type = 'essay';


UPDATE [dbo].[Exams]
SET 
    [StartTime] = '2025-04-27 00:00:00', 
    [EndTime] = '2026-04-28 23:59:59'
WHERE 
    [Title] = N'Tư tưởng Hồ Chí Minh';

-- Cập nhật khoá học để tất cả câu hỏi là tự luận
UPDATE [dbo].[Exams]
SET [Type] = 'essay'
WHERE [Title] = N'Tư tưởng Hồ Chí Minh';

-- Xoá tất cả câu hỏi trắc nghiệm
DELETE FROM [dbo].[ExamAnswers]
WHERE [QuestionID] IN (
  SELECT q.[QuestionID] 
  FROM [dbo].[ExamQuestions] q
  JOIN [dbo].[Exams] e ON q.[ExamID] = e.[ExamID]
  WHERE e.[Title] = N'Tư tưởng Hồ Chí Minh' AND q.[Type] = 'multiple_choice'
);

DELETE FROM [dbo].[ExamQuestions]
WHERE [ExamID] IN (SELECT [ExamID] FROM [dbo].[Exams] WHERE [Title] = N'Tư tưởng Hồ Chí Minh')
AND [Type] = 'multiple_choice';

-- Giữ lại chỉ 3 câu hỏi tự luận
WITH RankedQuestions AS (
    SELECT 
        [QuestionID],
        ROW_NUMBER() OVER (ORDER BY [QuestionID]) AS RowNum
    FROM [dbo].[ExamQuestions]
    WHERE [ExamID] IN (SELECT [ExamID] FROM [dbo].[Exams] WHERE [Title] = N'Tư tưởng Hồ Chí Minh')
    AND [Type] = 'essay'
)
DELETE FROM [dbo].[ExamQuestions]
WHERE [QuestionID] IN (
    SELECT [QuestionID] FROM RankedQuestions WHERE RowNum > 3
);

-- Cập nhật thứ tự và điểm số cho 3 câu hỏi còn lại
WITH EssayQuestions AS (
    SELECT 
        [QuestionID],
        ROW_NUMBER() OVER (ORDER BY [QuestionID]) AS NewOrderIndex
    FROM [dbo].[ExamQuestions]
    WHERE [ExamID] IN (SELECT [ExamID] FROM [dbo].[Exams] WHERE [Title] = N'Tư tưởng Hồ Chí Minh')
)
UPDATE [dbo].[ExamQuestions]
SET 
    [OrderIndex] = q.NewOrderIndex,
    [Points] = CASE 
                  WHEN q.NewOrderIndex = 1 THEN 3
                  WHEN q.NewOrderIndex = 2 THEN 3
                  WHEN q.NewOrderIndex = 3 THEN 4
                  ELSE [Points]
               END
FROM [dbo].[ExamQuestions] eq
JOIN EssayQuestions q ON eq.[QuestionID] = q.[QuestionID];

-- Cập nhật tổng điểm của kỳ thi
UPDATE [dbo].[Exams]
SET [TotalPoints] = 10
WHERE [Title] = N'Tư tưởng Hồ Chí Minh';

-- Xoá các templates cho câu hỏi không còn tồn tại
DELETE FROM [dbo].[ExamAnswerTemplates]
WHERE [QuestionID] NOT IN (
    SELECT [QuestionID] FROM [dbo].[ExamQuestions]
);

-- Update existing exams to allow retakes
UPDATE [dbo].[Exams]
SET [AllowRetakes] = 1, [MaxRetakes] = 3
WHERE [ExamID] IN (5, 6);

-- Make sure the "Tư tưởng Hồ Chí Minh" exam allows retakes
UPDATE [dbo].[Exams]
SET [AllowRetakes] = 1, [MaxRetakes] = 3
WHERE [Title] = N'Tư tưởng Hồ Chí Minh';

-- Optional: Reset any in-progress registrations to allow testing
DELETE FROM [dbo].[ExamParticipants]
WHERE [ExamID] IN (5, 6) 
AND [Status] NOT IN ('completed', 'reviewed');

-- Add SQL statement to ensure the AllowRetakes and MaxRetakes columns have correct default values
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE Name = N'AllowRetakes' 
    AND Object_ID = Object_ID(N'[dbo].[Exams]')
    AND default_object_id <> 0
)
BEGIN
    ALTER TABLE [dbo].[Exams]
    ADD CONSTRAINT [DF_Exams_AllowRetakes] DEFAULT ((0)) FOR [AllowRetakes]
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE Name = N'MaxRetakes' 
    AND Object_ID = Object_ID(N'[dbo].[Exams]')
    AND default_object_id <> 0
)
BEGIN
    ALTER TABLE [dbo].[Exams]
    ADD CONSTRAINT [DF_Exams_MaxRetakes] DEFAULT ((0)) FOR [MaxRetakes]
END
