-- Corrected SQL to safely update security course information
USE campushubt;
GO

-- Create a separate transaction for updating the security course
BEGIN TRANSACTION;
BEGIN TRY
    -- First, verify if the security course exists
    DECLARE @SecurityCourseID BIGINT;
    SELECT @SecurityCourseID = CourseID FROM Courses WHERE Title = N'Bảo Mật Thông Tin và An Toàn Mạng';
    
    IF @SecurityCourseID IS NOT NULL
    BEGIN
        -- Update ratings and enrollment count for security course
        UPDATE Courses
        SET Rating = 4.8,
            RatingCount = 126,
            EnrolledCount = 1840
        WHERE CourseID = @SecurityCourseID;
        
        PRINT 'Security course updated successfully';
    END
    ELSE
    BEGIN
        PRINT 'Security course not found. Please create it first.';
    END
    
    -- Commit the transaction if everything is successful
    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully.';
END TRY
BEGIN CATCH
    -- If an error occurs, roll back the transaction
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    PRINT 'An error occurred. Transaction rolled back.';
    PRINT ERROR_MESSAGE();
END CATCH; 