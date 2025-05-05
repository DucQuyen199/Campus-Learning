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
-- Bảng Posts: Quản lý bài đăng của người dùng
CREATE TABLE Posts (
    PostID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của bài đăng
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người đăng
    Content NVARCHAR(MAX), -- Nội dung bài đăng
    Type VARCHAR(20) DEFAULT 'regular', -- Loại bài đăng
    Visibility VARCHAR(20) DEFAULT 'public', -- Quyền xem
    Location NVARCHAR(255), -- Vị trí đăng
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    DeletedAt DATETIME, -- Thời điểm xóa
    LikesCount INT DEFAULT 0, -- Số lượt thích
    CommentsCount INT DEFAULT 0, -- Số bình luận
    SharesCount INT DEFAULT 0, -- Số lượt chia sẻ
    ReportsCount INT DEFAULT 0, -- Số lượt báo cáo
    CONSTRAINT CHK_Post_Type CHECK (Type IN ('regular', 'article', 'question', 'announcement')), -- Kiểm tra loại bài đăng hợp lệ
    CONSTRAINT CHK_Post_Visibility CHECK (Visibility IN ('public', 'private', 'friends')) -- Kiểm tra quyền xem hợp lệ
);
go
-- Bảng PostMedia: Lưu trữ media (ảnh, video) của bài đăng
CREATE TABLE PostMedia (
    MediaID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của media
    PostID BIGINT FOREIGN KEY REFERENCES Posts(PostID), -- Liên kết với bài đăng
    MediaUrl VARCHAR(255) NOT NULL, -- Đường dẫn media
    MediaType VARCHAR(20), -- Loại media
    ThumbnailUrl VARCHAR(255), -- Đường dẫn ảnh thu nhỏ
    Size INT, -- Kích thước file
    Width INT, -- Chiều rộng
    Height INT, -- Chiều cao
    Duration INT, -- Thời lượng (cho video)
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    CONSTRAINT CHK_Media_Type CHECK (MediaType IN ('image', 'video', 'document', 'audio')) -- Kiểm tra loại media hợp lệ
);
go
-- Bảng PostLikes: Quản lý lượt thích của bài đăng
CREATE TABLE PostLikes (
    LikeID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của lượt thích
    PostID BIGINT FOREIGN KEY REFERENCES Posts(PostID), -- Liên kết với bài đăng được thích
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người dùng thực hiện thích
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm thích
    CONSTRAINT UQ_Post_Like UNIQUE (PostID, UserID) -- Đảm bảo mỗi người chỉ thích 1 lần
);
go
-- Bảng Comments: Quản lý bình luận và phản hồi
CREATE TABLE Comments (
    CommentID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của bình luận
    PostID BIGINT FOREIGN KEY REFERENCES Posts(PostID), -- Bài đăng được bình luận
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người bình luận
    ParentCommentID BIGINT FOREIGN KEY REFERENCES Comments(CommentID), -- ID bình luận cha (nếu là phản hồi)
    Content NVARCHAR(MAX), -- Nội dung bình luận
    LikesCount INT DEFAULT 0, -- Số lượt thích bình luận
    RepliesCount INT DEFAULT 0, -- Số lượt phản hồi
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME, -- Thời điểm cập nhật
    DeletedAt DATETIME, -- Thời điểm xóa
    IsEdited BIT DEFAULT 0, -- Đánh dấu đã chỉnh sửa
    IsDeleted BIT DEFAULT 0 -- Đánh dấu đã xóa
);
go
-- Bảng CommentLikes: Quản lý lượt thích của bình luận
CREATE TABLE CommentLikes (
    CommentLikeID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của lượt thích bình luận
    CommentID BIGINT FOREIGN KEY REFERENCES Comments(CommentID), -- Bình luận được thích
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người thích bình luận
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm thích
    CONSTRAINT UQ_Comment_Like UNIQUE (CommentID, UserID) -- Đảm bảo mỗi người chỉ thích 1 lần
);
go
-- Bảng Tags: Quản lý các thẻ tag
CREATE TABLE Tags (
    TagID INT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của tag
    Name NVARCHAR(50) NOT NULL UNIQUE, -- Tên tag, không được trùng
    Description NVARCHAR(255), -- Mô tả về tag
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UsageCount INT DEFAULT 0 -- Số lần sử dụng tag
);
go
-- Bảng PostTags: Liên kết giữa bài đăng và thẻ tag
CREATE TABLE PostTags (
    PostID BIGINT FOREIGN KEY REFERENCES Posts(PostID), -- Bài đăng được gắn tag
    TagID INT FOREIGN KEY REFERENCES Tags(TagID), -- Tag được gắn
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm gắn tag
    PRIMARY KEY (PostID, TagID) -- Khóa chính kết hợp
);
Go

CREATE TABLE [dbo].[Stories] (
    [StoryID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [MediaUrl]        VARCHAR (255)  NULL,
    [MediaType]       VARCHAR (20)   NULL,
    [Duration]        INT            DEFAULT ((15)) NULL,
    [ViewCount]       INT            DEFAULT ((0)) NULL,
    [BackgroundColor] VARCHAR (20)   NULL,
    [TextContent]     NVARCHAR (500) NULL,
    [FontStyle]       VARCHAR (50)   NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]       DATE           NULL,
    [IsDeleted]       BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([StoryID] ASC),
    CONSTRAINT [CHK_Story_MediaType] CHECK ([MediaType]='text' OR [MediaType]='video' OR [MediaType]='image'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);
go
CREATE TABLE [dbo].[StoryViews] (
    [ViewID]   BIGINT   IDENTITY (1, 1) NOT NULL,
    [StoryID]  BIGINT   NULL,
    [ViewerID] BIGINT   NULL,
    [ViewedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ViewID] ASC),
    FOREIGN KEY ([StoryID]) REFERENCES [dbo].[Stories] ([StoryID]),
    FOREIGN KEY ([ViewerID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Story_View] UNIQUE NONCLUSTERED ([StoryID] ASC, [ViewerID] ASC)
);

use campushubt;
-- Bảng PostShares: Quản lý lượt chia sẻ bài đăng
CREATE TABLE [dbo].[PostShares] (
    [ShareID] BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của lượt chia sẻ
    [PostID] BIGINT FOREIGN KEY REFERENCES [dbo].[Posts]([PostID]), -- Bài đăng được chia sẻ
    [UserID] BIGINT FOREIGN KEY REFERENCES [dbo].[Users]([UserID]), -- Người dùng thực hiện chia sẻ
    [ShareType] VARCHAR(20) DEFAULT 'link', -- Loại chia sẻ (link, embed, etc.)
    [SharePlatform] VARCHAR(50), -- Nền tảng chia sẻ (facebook, twitter, etc.)
    [CreatedAt] DATETIME DEFAULT GETDATE(), -- Thời điểm chia sẻ
    CONSTRAINT [CHK_Share_Type] CHECK ([ShareType] IN ('link', 'embed', 'copy'))
);

use campushubt;

-- 1. Xóa index phụ thuộc vào cột ExpiresAt
DROP INDEX [IX_Stories_ExpiresAt] ON [dbo].[Stories];

-- 2. Thay đổi kiểu dữ liệu của cột ExpiresAt
ALTER TABLE [dbo].[Stories]
ALTER COLUMN [ExpiresAt] DATE NULL;

-- 3. (Tuỳ chọn) Tạo lại index nếu bạn cần dùng lại
CREATE INDEX [IX_Stories_ExpiresAt]
ON [dbo].[Stories] ([ExpiresAt]);

use campushubt;
select * from posts;
select * from users;

INSERT INTO Posts (UserID, Content, Type, Visibility, Location, CreatedAt, UpdatedAt)
VALUES 
(1, N'Ngôn ngữ lập trình nào bạn nghĩ sẽ thống trị trong 5 năm tới? Python, Rust, hay một cái tên mới hoàn toàn?', 'regular', 'public', N'Hà Nội', GETDATE(), GETDATE()),

(1, N'Mọi người thường dùng công cụ nào để quản lý source code? Mình thì dùng Git và Visual Studio Code là combo không thể thiếu.', 'regular', 'public', N'Hồ Chí Minh', GETDATE(), GETDATE()),

(1, N'Học AI có cần phải giỏi toán không? Hay chỉ cần biết áp dụng các thư viện là đủ?', 'regular', 'public', N'Đà Nẵng', GETDATE(), GETDATE()),

(1, N'Chia sẻ với mọi người một mẹo nhỏ để cải thiện hiệu suất trong lập trình: Luôn viết unit test song song với code!', 'regular', 'public', N'Cần Thơ', GETDATE(), GETDATE()),

(1, N'Trong lĩnh vực phát triển web, mọi người chuộng backend Node.js hay vẫn trung thành với Java, .NET?', 'regular', 'public', N'Hải Phòng', GETDATE(), GETDATE());

INSERT INTO Posts (UserID, Content, Type, Visibility, Location, CreatedAt, UpdatedAt)
VALUES 
(1, N'Trong năm 2025, ngành công nghệ thông tin tại Việt Nam đang có sự phát triển vượt bậc, đặc biệt là trong lĩnh vực trí tuệ nhân tạo và dữ liệu lớn. Các doanh nghiệp công nghệ không chỉ tập trung vào phát triển phần mềm mà còn đẩy mạnh nghiên cứu và ứng dụng AI vào nhiều lĩnh vực như y tế, giáo dục và thương mại điện tử. Nhu cầu tuyển dụng kỹ sư AI, data scientist và chuyên gia về bảo mật đang tăng cao chưa từng thấy. Tuy nhiên, nguồn nhân lực chất lượng cao vẫn còn khan hiếm, tạo ra cơ hội lớn cho các bạn trẻ đang theo đuổi ngành CNTT.', 'regular', 'public', N'Hà Nội', GETDATE(), GETDATE()),

(1, N'Làn sóng chuyển đổi số tại các doanh nghiệp vừa và nhỏ ở Việt Nam đang diễn ra mạnh mẽ sau đại dịch COVID-19. Việc áp dụng các giải pháp công nghệ như quản lý bằng phần mềm, số hóa dữ liệu và bán hàng đa kênh giúp tăng hiệu quả hoạt động và mở rộng thị trường. Tuy nhiên, một rào cản lớn là chi phí đầu tư ban đầu và thiếu nhân sự IT nội bộ. Các công ty công nghệ vì vậy đang phát triển các giải pháp SaaS đơn giản, dễ dùng và giá rẻ hơn để phục vụ nhóm khách hàng này.', 'regular', 'public', N'Hồ Chí Minh', GETDATE(), GETDATE()),

(1, N'Câu chuyện về bảo mật và quyền riêng tư đang trở thành chủ đề nóng trong ngành IT. Sự gia tăng của các vụ tấn công mạng, lộ lọt dữ liệu khiến các doanh nghiệp buộc phải đầu tư mạnh vào hệ thống bảo mật. Các kỹ thuật như Zero Trust, mã hóa đầu cuối (E2EE), và xác thực đa yếu tố (MFA) đang dần trở thành tiêu chuẩn. Tuy nhiên, nhiều doanh nghiệp nhỏ vẫn xem nhẹ bảo mật, dẫn đến hậu quả nặng nề khi gặp sự cố. Đây là mảnh đất màu mỡ cho các startup an ninh mạng phát triển.', 'regular', 'public', N'Đà Nẵng', GETDATE(), GETDATE()),

(1, N'Ngành công nghiệp phần mềm outsourcing tại Việt Nam vẫn đang tăng trưởng ổn định nhờ vào lực lượng lập trình viên trẻ, chi phí thấp và chất lượng ngày càng nâng cao. Các công ty nước ngoài ngày càng ưu tiên Việt Nam hơn Ấn Độ hay Trung Quốc trong việc thuê ngoài phát triển phần mềm. Các thành phố như Hà Nội, Đà Nẵng và TP.HCM trở thành trung tâm công nghệ sôi động với hàng ngàn việc làm IT mỗi tháng. Tuy nhiên, để giữ chân nhân tài, các công ty cần có chế độ đãi ngộ tốt và môi trường làm việc sáng tạo.', 'regular', 'public', N'Cần Thơ', GETDATE(), GETDATE()),

(1, N'Công nghệ blockchain đang dần chuyển mình từ cơn sốt tiền mã hóa sang các ứng dụng thực tiễn như chuỗi cung ứng, chứng nhận kỹ thuật số, và tài chính phi tập trung (DeFi). Tại Việt Nam, nhiều startup đang nỗ lực xây dựng các ứng dụng blockchain hữu ích hơn thay vì chỉ phát triển token. Chính phủ cũng đang tìm hiểu khung pháp lý cho công nghệ này, giúp thị trường trở nên minh bạch và an toàn hơn. Các lập trình viên blockchain hiện nay có mức lương cao gấp 2–3 lần so với lập trình viên thông thường.', 'regular', 'public', N'Hải Phòng', GETDATE(), GETDATE()),

(1, N'Việc làm trong ngành IT không còn bó hẹp ở các công ty phần mềm nữa, mà đang mở rộng sang ngân hàng, sản xuất, logistics, thương mại điện tử, y tế… Mọi tổ chức đều đang cần kỹ sư phần mềm, chuyên viên phân tích dữ liệu, kỹ sư AI hoặc quản trị hệ thống. Điều này khiến ngành CNTT có sức lan tỏa mạnh mẽ trong toàn nền kinh tế. Sinh viên CNTT sau khi ra trường có thể linh hoạt lựa chọn lĩnh vực mình yêu thích thay vì chỉ giới hạn trong ngành công nghệ.', 'regular', 'public', N'Hà Nội', GETDATE(), GETDATE()),

(1, N'Khái niệm "IT xanh" – sử dụng công nghệ theo cách thân thiện với môi trường – đang trở nên phổ biến hơn bao giờ hết. Các công ty bắt đầu tối ưu hóa hạ tầng đám mây, tiết kiệm năng lượng trung tâm dữ liệu, và giảm phát thải carbon trong quá trình phát triển phần mềm. Các kỹ thuật như coding tối ưu hiệu suất, tính toán tiết kiệm năng lượng, và sử dụng thiết bị tái chế đang được quan tâm tại nhiều quốc gia. Việt Nam cũng không nằm ngoài xu hướng này.', 'regular', 'public', N'Hồ Chí Minh', GETDATE(), GETDATE()),

(1, N'Trí tuệ nhân tạo đang làm thay đổi cách giảng dạy và học tập trong giáo dục hiện đại. Các ứng dụng AI có thể đánh giá năng lực học sinh, gợi ý lộ trình học tập cá nhân hóa và hỗ trợ giáo viên phân tích dữ liệu học tập hiệu quả. Tại Việt Nam, một số startup EdTech đã bắt đầu triển khai hệ thống học tập tích hợp AI vào các trường học, đặc biệt trong môn toán, tiếng Anh và lập trình. Tuy nhiên, thách thức về dữ liệu đầu vào, chi phí phát triển và đào tạo vẫn còn là rào cản lớn.', 'regular', 'public', N'Đà Nẵng', GETDATE(), GETDATE()),

(1, N'Trung tâm dữ liệu (data center) là xương sống của hạ tầng công nghệ, và hiện nay Việt Nam đang đầu tư mạnh vào việc xây dựng các trung tâm dữ liệu mới với tiêu chuẩn quốc tế. Điều này không chỉ phục vụ các doanh nghiệp trong nước mà còn thu hút các tập đoàn quốc tế đến thuê hạ tầng. Việc xây dựng data center yêu cầu vốn lớn, kỹ thuật cao và đội ngũ quản lý chuyên sâu. Đây là xu hướng then chốt để đảm bảo an toàn dữ liệu quốc gia trong bối cảnh số hóa toàn diện.', 'regular', 'public', N'Cần Thơ', GETDATE(), GETDATE()),

(1, N'Trong bối cảnh AI phát triển quá nhanh, nhu cầu về đạo đức công nghệ đang ngày càng cấp thiết. Các hệ thống AI nếu không được kiểm soát tốt có thể tạo ra thiên kiến, sai lệch và ảnh hưởng tiêu cực đến xã hội. Việt Nam đang bắt đầu xây dựng các khung đạo đức cho AI, hướng đến việc phát triển công nghệ có trách nhiệm. Các chuyên gia IT hiện nay không chỉ cần giỏi kỹ thuật mà còn phải hiểu về luật pháp, đạo đức và các tác động xã hội từ sản phẩm mà họ phát triển.', 'regular', 'public', N'Hải Phòng', GETDATE(), GETDATE());
