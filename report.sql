
-- Create Reports table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND type in (N'U'))
BEGIN
    CREATE TABLE Reports (
        ReportID BIGINT IDENTITY(1,1) PRIMARY KEY, 
        Title NVARCHAR(255) NOT NULL, 
        Content NVARCHAR(MAX) NOT NULL, 
        Category VARCHAR(50) NOT NULL, 
        ReporterID BIGINT FOREIGN KEY REFERENCES Users(UserID), 
        TargetID BIGINT NOT NULL, 
        TargetType VARCHAR(50) NOT NULL, 
        Status VARCHAR(20) DEFAULT 'PENDING', 
        Notes NVARCHAR(500), 
        CreatedAt DATETIME DEFAULT GETDATE(), 
        UpdatedAt DATETIME DEFAULT GETDATE(), 
        ResolvedAt DATETIME, 
        DeletedAt DATETIME, 
        CONSTRAINT CHK_Report_Category CHECK (Category IN ('USER', 'CONTENT', 'COURSE', 'EVENT', 'COMMENT')), 
        CONSTRAINT CHK_Report_Status CHECK (Status IN ('PENDING', 'RESOLVED', 'REJECTED'))
    );

    -- Create indexes for Reports table
    CREATE INDEX IX_Reports_Status ON Reports(Status);
    CREATE INDEX IX_Reports_ReporterID ON Reports(ReporterID);
    CREATE INDEX IX_Reports_Category ON Reports(Category);
    CREATE INDEX IX_Reports_CreatedAt ON Reports(CreatedAt);

    PRINT 'Reports table created successfully.';
END
ELSE
BEGIN
    PRINT 'Reports table already exists.';
END

-- Insert sample data if table is empty
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT TOP 1 * FROM Reports)
    BEGIN
        -- Insert sample data
        INSERT INTO Reports (Title, Content, Category, ReporterID, TargetID, TargetType, Status, CreatedAt)
        VALUES
            (N'Người dùng đăng bài không phù hợp', N'Người dùng này đã đăng một bài viết có nội dung không phù hợp với tiêu chuẩn cộng đồng.', 'USER', 1, 2, 'USER', 'PENDING', DATEADD(day, -5, GETDATE())),
            (N'Nội dung khóa học không chính xác', N'Khóa học này chứa thông tin kỹ thuật không chính xác về React.', 'COURSE', 2, 1, 'COURSE', 'RESOLVED', DATEADD(day, -10, GETDATE())),
            (N'Bình luận xúc phạm', N'Người dùng đã bình luận với ngôn từ xúc phạm trên bài đăng của tôi.', 'COMMENT', 3, 5, 'COMMENT', 'REJECTED', DATEADD(day, -15, GETDATE())),
            (N'Sự kiện thiếu thông tin', N'Sự kiện này không cung cấp đủ thông tin về địa điểm và thời gian.', 'EVENT', 4, 3, 'EVENT', 'PENDING', DATEADD(day, -2, GETDATE())),
            (N'Bài viết chứa thông tin sai lệch', N'Bài viết này chứa thông tin sai lệch về công nghệ AI hiện tại.', 'CONTENT', 5, 7, 'POST', 'PENDING', DATEADD(day, -1, GETDATE()));

        -- Update some reports to have resolution dates and notes
        UPDATE Reports
        SET 
            ResolvedAt = DATEADD(day, 2, CreatedAt),
            Notes = N'Đã kiểm tra và xác minh báo cáo. Đã liên hệ với người dùng liên quan.'
        WHERE Status = 'RESOLVED';

        UPDATE Reports
        SET 
            ResolvedAt = DATEADD(day, 1, CreatedAt),
            Notes = N'Kiểm tra không phát hiện vi phạm. Báo cáo bị từ chối.'
        WHERE Status = 'REJECTED';

        PRINT 'Sample data inserted successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Reports table already has data.';
    END
END

use campushubt;

-- Check if ActionTaken column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND name = 'ActionTaken')
BEGIN
    ALTER TABLE Reports
    ADD ActionTaken VARCHAR(50) NULL;
    PRINT 'ActionTaken column added to Reports table.';
END
ELSE
BEGIN
    PRINT 'ActionTaken column already exists in Reports table.';
END

-- Make sure the constraint includes all status options
IF EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CHK_Report_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
BEGIN
    -- Drop existing constraint
    ALTER TABLE Reports
    DROP CONSTRAINT CHK_Report_Status;
    
    -- Add updated constraint
    ALTER TABLE Reports
    ADD CONSTRAINT CHK_Report_Status CHECK (Status IN ('PENDING', 'RESOLVED', 'REJECTED'));
    
    PRINT 'Status constraint updated successfully.';
END 