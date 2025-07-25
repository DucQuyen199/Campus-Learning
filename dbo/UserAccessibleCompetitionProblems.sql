/*-----------------------------------------------------------------
* File: UserAccessibleCompetitionProblems.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/



CREATE   VIEW UserAccessibleCompetitionProblems AS
SELECT 
    cp.ProblemID,
    cp.CompetitionID,
    cp.Title,
    cp.Description,
    cp.Difficulty,
    cp.Points,
    cp.TimeLimit,
    cp.MemoryLimit,
    cp.InputFormat,
    cp.OutputFormat,
    cp.Constraints,
    cp.SampleInput,
    cp.SampleOutput,
    cp.Explanation,
    cp.ImageURL,
    cp.StarterCode,
    cp.TestCasesVisible,
    cp.Instructions,
    pa.UserID,
    c.Title AS CompetitionTitle,
    c.StartTime,
    c.EndTime,
    c.Status AS CompetitionStatus,
    pa.Status AS ParticipationStatus
FROM CompetitionProblems cp
INNER JOIN Competitions c ON cp.CompetitionID = c.CompetitionID
INNER JOIN CompetitionParticipants pa ON c.CompetitionID = pa.CompetitionID
WHERE c.Status = 'active'
AND c.StartTime <= GETDATE()
AND c.EndTime >= GETDATE()
AND pa.Status IN ('registered', 'participating');

GO

