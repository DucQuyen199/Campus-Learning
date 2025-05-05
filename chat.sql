-- Bảng Conversations: Quản lý cuộc trò chuyện
CREATE TABLE Conversations (
    ConversationID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của cuộc trò chuyện
    Type VARCHAR(20) DEFAULT 'private', -- Loại cuộc trò chuyện
    Title NVARCHAR(255), -- Tiêu đề (cho nhóm chat)
    CreatedBy BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người tạo
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    LastMessageAt DATETIME, -- Thời điểm tin nhắn cuối
    IsActive BIT DEFAULT 1, -- Trạng thái hoạt động
    CONSTRAINT CHK_Conversation_Type CHECK (Type IN ('private', 'group')) -- Kiểm tra loại cuộc trò chuyện hợp lệ
);
go
-- Bảng ConversationParticipants: Quản lý người tham gia cuộc trò chuyện
CREATE TABLE ConversationParticipants (
    ParticipantID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của người tham gia
    ConversationID BIGINT FOREIGN KEY REFERENCES Conversations(ConversationID), -- Liên kết với cuộc trò chuyện
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    JoinedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tham gia
    LeftAt DATETIME, -- Thời điểm rời đi
    Role VARCHAR(20) DEFAULT 'member', -- Vai trò trong cuộc trò chuyện
    LastReadMessageID BIGINT, -- ID tin nhắn cuối cùng đã đọc
    IsAdmin BIT DEFAULT 0, -- Có phải admin không
    IsMuted BIT DEFAULT 0, -- Có bị tắt thông báo không
    CONSTRAINT CHK_Participant_Role CHECK (Role IN ('member', 'admin', 'moderator')) -- Kiểm tra vai trò hợp lệ
);
go
-- Bảng Messages: Quản lý tin nhắn trong cuộc trò chuyện
CREATE TABLE Messages (
    MessageID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của tin nhắn
    ConversationID BIGINT FOREIGN KEY REFERENCES Conversations(ConversationID), -- Liên kết với cuộc trò chuyện
    SenderID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người gửi tin nhắn
    Type VARCHAR(20) DEFAULT 'text', -- Loại tin nhắn
    Content NVARCHAR(MAX), -- Nội dung tin nhắn
    MediaUrl VARCHAR(255), -- Đường dẫn media đính kèm
    MediaType VARCHAR(20), -- Loại media
    ReplyToMessageID BIGINT FOREIGN KEY REFERENCES Messages(MessageID), -- Tin nhắn được trả lời
    IsEdited BIT DEFAULT 0, -- Đã chỉnh sửa chưa
    IsDeleted BIT DEFAULT 0, -- Đã xóa chưa
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    UpdatedAt DATETIME, -- Thời điểm cập nhật
    DeletedAt DATETIME, -- Thời điểm xóa
    CONSTRAINT CHK_Message_Type CHECK (Type IN ('text', 'image', 'video', 'file', 'audio', 'location')) -- Kiểm tra loại tin nhắn hợp lệ
);
go
-- Bảng Calls: Quản lý cuộc gọi video/audio
CREATE TABLE Calls (
    CallID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của cuộc gọi
    ConversationID BIGINT FOREIGN KEY REFERENCES Conversations(ConversationID), -- Liên kết với cuộc trò chuyện
    InitiatorID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người bắt đầu cuộc gọi
    Type VARCHAR(20), -- Loại cuộc gọi
    StartTime DATETIME DEFAULT GETDATE(), -- Thời điểm bắt đầu
    EndTime DATETIME, -- Thời điểm kết thúc
    Status VARCHAR(20) DEFAULT 'initiated', -- Trạng thái cuộc gọi
    Duration INT, -- Thời lượng (giây)
    Quality VARCHAR(20), -- Chất lượng cuộc gọi
    RecordingUrl VARCHAR(255), -- Đường dẫn bản ghi
    CONSTRAINT CHK_Call_Type CHECK (Type IN ('audio', 'video')), -- Kiểm tra loại cuộc gọi hợp lệ
    CONSTRAINT CHK_Call_Status CHECK (Status IN ('initiated', 'ringing', 'ongoing', 'ended', 'missed', 'rejected')) -- Kiểm tra trạng thái hợp lệ
);
go
-- Bảng CallParticipants: Quản lý người tham gia cuộc gọi
CREATE TABLE CallParticipants (
    CallParticipantID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của người tham gia
    CallID BIGINT FOREIGN KEY REFERENCES Calls(CallID), -- Liên kết với cuộc gọi
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    JoinTime DATETIME, -- Thời điểm tham gia
    LeaveTime DATETIME, -- Thời điểm rời đi
    Status VARCHAR(20), -- Trạng thái tham gia
    DeviceInfo NVARCHAR(255), -- Thông tin thiết bị
    NetworkQuality VARCHAR(20), -- Chất lượng mạng
    CONSTRAINT CHK_CallParticipant_Status CHECK (Status IN ('invited', 'joined', 'left', 'declined')) -- Kiểm tra trạng thái hợp lệ
);
go
-- Bảng MessageStatus: Theo dõi trạng thái tin nhắn
CREATE TABLE MessageStatus (
    StatusID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của trạng thái
    MessageID BIGINT FOREIGN KEY REFERENCES Messages(MessageID), -- Liên kết với tin nhắn
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    Status VARCHAR(20) DEFAULT 'sent', -- Trạng thái tin nhắn
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm cập nhật
    CONSTRAINT CHK_Message_Status CHECK (Status IN ('sent', 'delivered', 'read')), -- Kiểm tra trạng thái hợp lệ
    CONSTRAINT UQ_Message_User_Status UNIQUE (MessageID, UserID) -- Đảm bảo không trùng lặp
);

-- Bảng UserPresence: Theo dõi trạng thái hoạt động của người dùng
CREATE TABLE UserPresence (
    PresenceID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của trạng thái
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Liên kết với người dùng
    Status VARCHAR(20) DEFAULT 'offline', -- Trạng thái hoạt động
    LastActiveAt DATETIME DEFAULT GETDATE(), -- Thời điểm hoạt động cuối
    CurrentDeviceID VARCHAR(255), -- ID thiết bị đang sử dụng
    LastLocation NVARCHAR(MAX), -- Vị trí cuối cùng (định dạng JSON)
    CONSTRAINT CHK_Presence_Status CHECK (Status IN ('online', 'offline', 'away', 'busy', 'in_call')) -- Kiểm tra trạng thái hợp lệ
);
go
-- Bảng Notifications: Quản lý thông báo
CREATE TABLE Notifications (
    NotificationID BIGINT IDENTITY(1,1) PRIMARY KEY, -- ID tự tăng của thông báo
    UserID BIGINT FOREIGN KEY REFERENCES Users(UserID), -- Người nhận thông báo
    Type VARCHAR(50), -- Loại thông báo
    Title NVARCHAR(255), -- Tiêu đề thông báo
    Content NVARCHAR(MAX), -- Nội dung thông báo
    RelatedID BIGINT, -- ID tham chiếu liên quan
    RelatedType VARCHAR(50), -- Tên bảng tham chiếu
    IsRead BIT DEFAULT 0, -- Đã đọc chưa
    CreatedAt DATETIME DEFAULT GETDATE(), -- Thời điểm tạo
    ExpiresAt DATETIME, -- Thời điểm hết hạn
    Priority VARCHAR(20) DEFAULT 'normal', -- Độ ưu tiên
    CONSTRAINT CHK_Notification_Type CHECK (Type IN ( -- Kiểm tra loại thông báo hợp lệ
        'message', 'call', 'missed_call', 'comment', 
        'reply', 'story_view', 'mention', 'reaction'
    ))
);
go
-- Tạo các chỉ mục (Index) cho tính năng real-time
CREATE INDEX IX_Messages_ConversationID ON Messages(ConversationID); -- Tối ưu truy vấn tin nhắn theo cuộc trò chuyện
CREATE INDEX IX_Messages_CreatedAt ON Messages(CreatedAt DESC); -- Tối ưu sắp xếp tin nhắn theo thời gian
CREATE INDEX IX_Calls_Status ON Calls(Status); -- Tối ưu truy vấn cuộc gọi theo trạng thái
CREATE INDEX IX_UserPresence_Status ON UserPresence(Status); -- Tối ưu truy vấn trạng thái người dùng
CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead); -- Tối ưu truy vấn thông báo chưa đọc
CREATE INDEX IX_Stories_ExpiresAt ON Stories(ExpiresAt); -- Tối ưu truy vấn story hết hạn
CREATE INDEX IX_ConversationParticipants_UserID ON ConversationParticipants(UserID); -- Tối ưu truy vấn cuộc trò chuyện của người dùng
go

use campushubt
select * from Messages;
-- User 1 và User 2
INSERT INTO Conversations (Type, CreatedBy) VALUES ('private', 1);
DECLARE @Convo1_2 BIGINT = SCOPE_IDENTITY();

-- User 1 và User 3
INSERT INTO Conversations (Type, CreatedBy) VALUES ('private', 1);
DECLARE @Convo1_3 BIGINT = SCOPE_IDENTITY();

-- User 2 và User 3
INSERT INTO Conversations (Type, CreatedBy) VALUES ('private', 2);
DECLARE @Convo2_3 BIGINT = SCOPE_IDENTITY();

-- Cuộc trò chuyện giữa 1 và 2
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo1_2, 1);
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo1_2, 2);

-- Cuộc trò chuyện giữa 1 và 3
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo1_3, 1);
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo1_3, 3);

-- Cuộc trò chuyện giữa 2 và 3
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo2_3, 2);
INSERT INTO ConversationParticipants (ConversationID, UserID) VALUES (@Convo2_3, 3);

-- User 1 nhắn user 2
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo1_2, 1, N'Chào bạn 2!');

-- User 2 nhắn user 1
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo1_2, 2, N'Chào bạn 1!');

-- User 1 nhắn user 3
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo1_3, 1, N'Chào bạn 3!');

-- User 3 nhắn user 1
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo1_3, 3, N'Chào bạn 1!');

-- User 2 nhắn user 3
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo2_3, 2, N'Chào bạn 3!');

-- User 3 nhắn user 2
INSERT INTO Messages (ConversationID, SenderID, Content) VALUES (@Convo2_3, 3, N'Chào bạn 2!');
