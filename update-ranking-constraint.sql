use campushubt;
-- Script to update the CHK_Ranking_Type constraint to include EXAM type
USE campushubt;  -- Make sure to use the correct database name
GO

-- Safely drop and recreate the constraint to include EXAM type
BEGIN TRY
    -- First, disable the trigger that uses the RankingHistory table
    IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_UpdateExamScoreAfterEssay')
    BEGIN
        DISABLE TRIGGER TR_UpdateExamScoreAfterEssay ON EssayAnswerAnalysis;
        PRINT 'Trigger TR_UpdateExamScoreAfterEssay has been disabled.';
    END

    -- Now update the constraint
    -- First, check if the constraint exists
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Ranking_Type' AND parent_object_id = OBJECT_ID('RankingHistory'))
    BEGIN
        -- Drop the existing constraint
        PRINT 'Dropping existing constraint CHK_Ranking_Type...';
        ALTER TABLE RankingHistory DROP CONSTRAINT CHK_Ranking_Type;
        
        -- Add the new constraint with EXAM included
        PRINT 'Adding new constraint CHK_Ranking_Type with EXAM included...';
        ALTER TABLE RankingHistory ADD CONSTRAINT CHK_Ranking_Type CHECK (Type IN ('EVENT', 'COURSE', 'EXAM'));
        
        PRINT 'Constraint CHK_Ranking_Type has been updated to include EXAM type.';
    END
    ELSE
    BEGIN
        PRINT 'Constraint CHK_Ranking_Type not found on RankingHistory table.';
    END
    
    -- Re-enable the trigger
    IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_UpdateExamScoreAfterEssay')
    BEGIN
        ENABLE TRIGGER TR_UpdateExamScoreAfterEssay ON EssayAnswerAnalysis;
        PRINT 'Trigger TR_UpdateExamScoreAfterEssay has been re-enabled.';
    END
    
    PRINT 'Script completed successfully.';
END TRY
BEGIN CATCH
    PRINT 'Error: ' + ERROR_MESSAGE();
    
    -- Make sure we re-enable the trigger if it exists
    IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_UpdateExamScoreAfterEssay')
    BEGIN
        ENABLE TRIGGER TR_UpdateExamScoreAfterEssay ON EssayAnswerAnalysis;
        PRINT 'Trigger TR_UpdateExamScoreAfterEssay has been re-enabled.';
    END
END CATCH
GO 