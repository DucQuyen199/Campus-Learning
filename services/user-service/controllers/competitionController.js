const axios = require('axios');
const { pool, sql } = require('../config/db');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const judgeConfig = require('../config/judge0Config');
const executionConfig = require('../config/executionConfig');

// Judge0 API configuration
const JUDGE0_API_URL = judgeConfig.JUDGE0_API_URL;
const JUDGE0_API_KEY = judgeConfig.JUDGE0_API_KEY;
const JUDGE0_API_HOST = judgeConfig.JUDGE0_API_HOST;

// Local execution service configuration
const EXECUTION_SERVICE_URL = executionConfig.EXECUTION_SERVICE_URL;
const USE_EXECUTION_SERVICE = executionConfig.USE_EXECUTION_SERVICE;

// Flag to determine if Judge0 API is available
const isJudge0Available = !!JUDGE0_API_KEY;

console.log(`Judge0 API ${isJudge0Available ? 'is available' : 'is NOT available'}`);
console.log(`Local execution service ${USE_EXECUTION_SERVICE ? 'is enabled' : 'is disabled'}`);

/**
 * Get list of all competitions
 */
exports.getAllCompetitions = async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          CompetitionID, Title, Description, StartTime, EndTime, 
          Duration, Difficulty, Status, MaxParticipants, 
          CurrentParticipants, ThumbnailUrl, CoverImageURL 
        FROM Competitions 
        WHERE DeletedAt IS NULL
        ORDER BY StartTime DESC
      `);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching competitions',
      error: error.message
    });
  }
};

/**
 * Get competition details by ID
 */
exports.getCompetitionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[getCompetitionDetails] Fetching details for competition ${id}`);
    
    const result = await pool.request()
      .input('competitionId', sql.BigInt, id)
      .query(`
        SELECT 
          c.CompetitionID, c.Title, c.Description, c.StartTime, c.EndTime, 
          c.Duration, c.Difficulty, c.Status, c.MaxParticipants, 
          c.CurrentParticipants, c.ThumbnailUrl, c.CoverImageURL,
          u.FullName as OrganizerName, u.Image as OrganizerImage
        FROM Competitions c
        LEFT JOIN Users u ON c.OrganizedBy = u.UserID
        WHERE c.CompetitionID = @competitionId AND c.DeletedAt IS NULL
      `);
    
    if (result.recordset.length === 0) {
      console.log(`[getCompetitionDetails] Competition ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
    // Get competition data and explicitly log participant count
    const competition = result.recordset[0];
    const participantCount = competition.CurrentParticipants;
    console.log(`[getCompetitionDetails] Competition ${id} has ${participantCount}/${competition.MaxParticipants} participants`);
    
    // Get competition problems
    const problemsResult = await pool.request()
      .input('competitionId', sql.BigInt, id)
      .query(`
        SELECT 
          ProblemID, Title, Description, Difficulty, Points,
          TimeLimit, MemoryLimit, InputFormat, OutputFormat,
          Constraints, SampleInput, SampleOutput, Explanation,
          ImageURL, Tags
        FROM CompetitionProblems
        WHERE CompetitionID = @competitionId
        ORDER BY Points ASC
      `);
    
    // Check if user is registered for this competition
    const userId = req.user?.id;
    let isRegistered = false;
    let participantStatus = null;
    
    if (userId) {
      const participantResult = await pool.request()
        .input('competitionId', sql.BigInt, id)
        .input('userId', sql.BigInt, userId)
        .query(`
          SELECT ParticipantID, Status, StartTime, EndTime, Score
          FROM CompetitionParticipants
          WHERE CompetitionID = @competitionId AND UserID = @userId
        `);
      
      isRegistered = participantResult.recordset.length > 0;
      participantStatus = isRegistered ? participantResult.recordset[0] : null;
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...competition,
        problems: problemsResult.recordset,
        isRegistered,
        participantStatus
      }
    });
  } catch (error) {
    console.error('Error fetching competition details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching competition details',
      error: error.message
    });
  }
};

/**
 * Get competition problem details
 */
exports.getProblemDetails = async (req, res) => {
  try {
    const { competitionId, problemId } = req.params;
    
    console.log(`Request params: competitionId=${competitionId}, problemId=${problemId}`);
    
    // Check if the competition is valid
    const competitionResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT CompetitionID, Status, StartTime, EndTime
        FROM Competitions
        WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
      `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
    const competition = competitionResult.recordset[0];
    const now = new Date();
    
    // User comes from auth middleware, safely extract isAdmin property
    const isAdmin = req.user?.isAdmin || false;
    
    // Check if competition has started - only for non-admin users
    if (!isAdmin && competition.Status !== 'ongoing' && now < competition.StartTime) {
      return res.status(403).json({
        success: false,
        message: 'Competition has not started yet'
      });
    }
    
    // Check if user is registered for the competition
    const userId = req.user.id;
    
    const participantResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT ParticipantID, Status
        FROM CompetitionParticipants
        WHERE CompetitionID = @competitionId AND UserID = @userId
      `);
    
    if (participantResult.recordset.length === 0 && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this competition'
      });
    }
    
    // Get problem details
    const problemResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .query(`
        SELECT 
            p.ProblemID, p.Title, p.Description, p.Difficulty, 
            p.Points, p.TimeLimit, p.MemoryLimit, 
            p.InputFormat, p.OutputFormat, p.Constraints, p.SampleInput,
            p.SampleOutput, p.Explanation, p.StarterCode, p.Tags,
            p.TestCasesVisible, p.TestCasesHidden
        FROM CompetitionProblems p
        WHERE p.CompetitionID = @competitionId AND p.ProblemID = @problemId
      `);
    
    if (problemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found or not active in this competition'
      });
    }
    
    const problem = problemResult.recordset[0];
    
    // Get test cases (Admin only - regular users only see sample cases)
    let testCases = [];
    
    if (isAdmin) {
      try {
        const testCaseResult = await pool.request()
          .input('problemId', sql.BigInt, problemId)
          .query(`
            SELECT TestCaseID, Input, Output, IsHidden
            FROM ProblemTestCases
            WHERE ProblemID = @problemId
            ORDER BY TestCaseID
          `);
        
        testCases = testCaseResult.recordset;
      } catch (error) {
        console.error('Error fetching test cases:', error);
        // Continue without test cases, don't fail the entire request
      }
    }

    // Format sample input/output for display
    try {
      if (problem.SampleInput && problem.SampleOutput) {
        let sampleInput, sampleOutput;
        
        try {
          sampleInput = JSON.parse(problem.SampleInput);
        } catch (err) {
          console.log('Sample input is not valid JSON, treating as plain text:', problem.SampleInput);
          sampleInput = [problem.SampleInput];
        }
        
        try {
          sampleOutput = JSON.parse(problem.SampleOutput);
        } catch (err) {
          console.log('Sample output is not valid JSON, treating as plain text:', problem.SampleOutput);
          sampleOutput = [problem.SampleOutput];
        }
        
        // Ensure both are arrays
        if (!Array.isArray(sampleInput)) sampleInput = [sampleInput];
        if (!Array.isArray(sampleOutput)) sampleOutput = [sampleOutput];
        
        problem.Samples = sampleInput.map((input, i) => ({
          input,
          output: sampleOutput[i] || ''
        }));
      } else {
        problem.Samples = [];
      }
    } catch (error) {
      console.error('Error parsing sample input/output:', error);
      problem.Samples = [];
    }
    
    // Get user submissions for this problem
    let userSubmissions = [];
    
    if (participantResult.recordset.length > 0) {
      const participant = participantResult.recordset[0];
      
      const submissionsResult = await pool.request()
        .input('participantId', sql.BigInt, participant.ParticipantID)
        .input('problemId', sql.BigInt, problemId)
        .query(`
          SELECT 
            SubmissionID, Status, Score, Language, 
            SubmittedAt, JudgedAt, ErrorMessage,
            ExecutionTime, MemoryUsed
          FROM CompetitionSubmissions
          WHERE ParticipantID = @participantId AND ProblemID = @problemId
          ORDER BY SubmissionID DESC
        `);
      
      userSubmissions = submissionsResult.recordset;
    }
    
    // Hide test cases that should not be visible to users
    const formattedProblem = {
      ...problem,
      testCases: isAdmin ? testCases : undefined
    };
    
    return res.status(200).json({
      success: true,
      data: formattedProblem,
      userSubmissions
    });
  } catch (error) {
    console.error('Error fetching problem details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching problem details',
      error: error.message
    });
  }
};

/**
 * Register for a competition
 */
exports.registerForCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user?.id;
    
    console.log(`[registerForCompetition] Attempt to register user ${userId} for competition ${competitionId}`);
    
    if (!userId) {
      console.log('[registerForCompetition] No userId found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Validate the competition ID
    if (!competitionId || isNaN(Number(competitionId))) {
      console.log(`[registerForCompetition] Invalid competition ID: ${competitionId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid competition ID'
      });
    }
    
    // Ensure data types match the schema
    let bigIntCompetitionId, bigIntUserId;
    try {
      bigIntCompetitionId = BigInt(competitionId);
      bigIntUserId = BigInt(userId);
    } catch (error) {
      console.error(`[registerForCompetition] Invalid ID format: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid competition or user ID format'
      });
    }
    
    // First check if competition exists before doing anything else
    const competitionResult = await pool.request()
      .input('competitionId', sql.BigInt, bigIntCompetitionId)
      .query(`
        SELECT CompetitionID, Status, MaxParticipants, CurrentParticipants, StartTime, EndTime
        FROM Competitions
        WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
      `);
    
    if (competitionResult.recordset.length === 0) {
      console.log(`[registerForCompetition] Competition ${competitionId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
    const competition = competitionResult.recordset[0];
    
    // Check if user is already registered
    const participantResult = await pool.request()
      .input('competitionId', sql.BigInt, bigIntCompetitionId)
      .input('userId', sql.BigInt, bigIntUserId)
      .query(`
        SELECT ParticipantID 
        FROM CompetitionParticipants
        WHERE CompetitionID = @competitionId AND UserID = @userId
      `);
    
    if (participantResult.recordset.length > 0) {
      console.log(`[registerForCompetition] User ${userId} is already registered for competition ${competitionId}`);
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this competition',
        code: 'ALREADY_REGISTERED'
      });
    }
    
    // Check competition status
    if (competition.Status !== 'upcoming' && competition.Status !== 'ongoing') {
      console.log(`[registerForCompetition] Competition ${competitionId} is not open for registration (status: ${competition.Status})`);
      return res.status(400).json({
        success: false,
        message: 'Competition is not open for registration'
      });
    }
    
    // Check if competition is full
    if (competition.CurrentParticipants >= competition.MaxParticipants) {
      console.log(`[registerForCompetition] Competition ${competitionId} is full (${competition.CurrentParticipants}/${competition.MaxParticipants})`);
      return res.status(400).json({
        success: false,
        message: 'Competition is already full'
      });
    }
    
    // Register user for the competition
    const now = new Date();
    await pool.request()
      .input('competitionId', sql.BigInt, bigIntCompetitionId)
      .input('userId', sql.BigInt, bigIntUserId)
      .input('now', sql.DateTime, now)
      .query(`
        INSERT INTO CompetitionParticipants
          (CompetitionID, UserID, Status, RegistrationTime, CreatedAt, UpdatedAt)
        VALUES
          (@competitionId, @userId, 'registered', @now, @now, @now)
      `);
    
    // Update competition participant count with explicit debugging
    console.log(`[registerForCompetition] Updating participant count for competition ${competitionId}`);
    try {
      const updateResult = await pool.request()
        .input('competitionId', sql.BigInt, bigIntCompetitionId)
        .query(`
          UPDATE Competitions
          SET CurrentParticipants = CurrentParticipants + 1, UpdatedAt = GETDATE()
          WHERE CompetitionID = @competitionId;

          SELECT CurrentParticipants 
          FROM Competitions 
          WHERE CompetitionID = @competitionId;
        `);
      
      // Log the updated participant count
      const updatedCount = updateResult.recordset[0]?.CurrentParticipants;
      console.log(`[registerForCompetition] Updated participant count: ${updatedCount}`);
    } catch (updateError) {
      console.error(`[registerForCompetition] Error updating participant count: ${updateError.message}`);
    }
    
    console.log(`[registerForCompetition] Successfully registered user ${userId} for competition ${competitionId}`);
    return res.status(200).json({
      success: true,
      message: 'Successfully registered for the competition'
    });
  } catch (error) {
    console.error(`[registerForCompetition] Unexpected error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message
    });
  }
};

/**
 * Start a competition
 */
exports.startCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const userId = req.user.id;
    
    console.log(`Starting competition: competitionId=${competitionId}, userId=${userId}`);
    
    // Ensure data types match the schema
    let bigIntCompetitionId;
    let bigIntUserId;
    
    try {
      bigIntCompetitionId = BigInt(competitionId);
      bigIntUserId = BigInt(userId);
    } catch (error) {
      console.error('Invalid ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid competition or user ID format',
        error: error.message
      });
    }
    
    // Check if competition exists - allow any competition that's not deleted
    const competitionRequest = pool.request();
    competitionRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    
    const competitionResult = await competitionRequest.query(`
      SELECT CompetitionID, Status, Duration, StartTime, EndTime, MaxParticipants, CurrentParticipants
      FROM Competitions
      WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
    `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
    const competition = competitionResult.recordset[0];
    
    // Auto-promote competition to 'ongoing' status if needed
    // This will allow users to start competitions in any state (except deleted)
    if (competition.Status !== 'ongoing') {
      await pool.request()
        .input('competitionId', sql.BigInt, bigIntCompetitionId)
        .query(`
          UPDATE Competitions
          SET Status = 'ongoing', UpdatedAt = GETDATE()
          WHERE CompetitionID = @competitionId
        `);
      
      console.log(`Updated competition ${competitionId} status from '${competition.Status}' to 'ongoing'`);
      competition.Status = 'ongoing'; // Update local object too
    }
    
    // Check if user is registered
    const participantRequest = pool.request();
    participantRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    participantRequest.input('userId', sql.BigInt, bigIntUserId);
    
    const participantResult = await participantRequest.query(`
      SELECT ParticipantID, Status, StartTime, EndTime
      FROM CompetitionParticipants
      WHERE CompetitionID = @competitionId AND UserID = @userId
    `);
    
    if (participantResult.recordset.length === 0) {
      // Auto-register the user if there is capacity
      if (competition.CurrentParticipants >= competition.MaxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Competition is full, cannot start.'
        });
      }

      const now = new Date();
      const endTimeAuto = new Date(now.getTime() + competition.Duration * 60000);

      await pool.request()
        .input('competitionId', sql.BigInt, bigIntCompetitionId)
        .input('userId', sql.BigInt, bigIntUserId)
        .input('now', sql.DateTime, now)
        .input('endTime', sql.DateTime, endTimeAuto)
        .query(`
          INSERT INTO CompetitionParticipants
            (CompetitionID, UserID, Status, RegistrationTime, StartTime, EndTime, CreatedAt, UpdatedAt)
          VALUES
            (@competitionId, @userId, 'active', @now, @now, @endTime, @now, @now);
          UPDATE Competitions
            SET CurrentParticipants = CurrentParticipants + 1, UpdatedAt = GETDATE()
          WHERE CompetitionID = @competitionId;
        `);

      console.log(`Auto-registered and started competition ${competitionId} for user ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Competition started successfully',
        data: { startTime: now, endTime: endTimeAuto, duration: competition.Duration }
      });
    }
    
    const participant = participantResult.recordset[0];
    
    // If participant already started and active, return success instead of error
    if (participant.Status === 'active' && participant.StartTime) {
      console.log(`User ${userId} has already started competition ${competitionId}`);
      return res.status(200).json({
        success: true,
        message: 'Competition is already started',
        data: {
          startTime: participant.StartTime,
          endTime: participant.EndTime,
          duration: competition.Duration
        }
      });
    }
    
    // Even if the competition is completed, allow restart
    // Update participant status to active and set start/end times
    const now = new Date();
    const endTime = new Date(now.getTime() + competition.Duration * 60000); // Duration is in minutes
    
    const updateRequest = pool.request();
    updateRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    updateRequest.input('userId', sql.BigInt, bigIntUserId);
    updateRequest.input('now', sql.DateTime, now);
    updateRequest.input('endTime', sql.DateTime, endTime);
    
    await updateRequest.query(`
      UPDATE CompetitionParticipants
      SET Status = 'active', StartTime = @now, EndTime = @endTime, UpdatedAt = @now
      WHERE CompetitionID = @competitionId AND UserID = @userId
    `);
    
    return res.status(200).json({
      success: true,
      message: 'Competition started successfully',
      data: {
        startTime: now,
        endTime: endTime,
        duration: competition.Duration
      }
    });
  } catch (error) {
    console.error('Error starting competition:', error);
    
    // Provide more detailed error for debugging
    let errorMessage = 'Error starting competition';
    if (error.name === 'RangeError') {
      errorMessage = 'Invalid competition or user ID format';
    } else if (error.code && error.message) {
      errorMessage = `${error.message} (Code: ${error.code})`;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Submit solution for a competition problem
 */
exports.submitSolution = async (req, res) => {
  try {
    const { competitionId, problemId } = req.params;
    const { sourceCode, language } = req.body;
    const userId = req.user.id;
    
    console.log(`Submitting solution: competitionId=${competitionId}, problemId=${problemId}, userId=${userId}, language=${language}`);
    
    // Ensure data types match the schema
    let bigIntCompetitionId, bigIntProblemId, bigIntUserId;
    
    try {
      bigIntCompetitionId = BigInt(competitionId);
      bigIntProblemId = BigInt(problemId);
      bigIntUserId = BigInt(userId);
    } catch (error) {
      console.error('Invalid ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid competition, problem, or user ID format',
        error: error.message
      });
    }
    
    // Validate request
    if (!sourceCode || !language) {
      return res.status(400).json({
        success: false,
        message: 'Source code and language are required'
      });
    }
    
    // Check if competition exists and is ongoing
    const competitionRequest = pool.request();
    competitionRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    
    const competitionResult = await competitionRequest.query(`
      SELECT CompetitionID, Status
      FROM Competitions
      WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
    `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
    // Check if problem exists and is part of the competition
    const problemRequest = pool.request();
    problemRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    problemRequest.input('problemId', sql.BigInt, bigIntProblemId);
    
    const problemResult = await problemRequest.query(`
      SELECT ProblemID, Title, Description, Points, TimeLimit, MemoryLimit, 
             TestCasesVisible, TestCasesHidden
      FROM CompetitionProblems
      WHERE CompetitionID = @competitionId AND ProblemID = @problemId
    `);
    
    if (problemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found or not part of this competition'
      });
    }
    
    const problem = problemResult.recordset[0];
    
    // Check if user is registered and active
    const participantRequest = pool.request();
    participantRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    participantRequest.input('userId', sql.BigInt, bigIntUserId);
    
    const participantResult = await participantRequest.query(`
      SELECT ParticipantID, Status, StartTime, EndTime
      FROM CompetitionParticipants
      WHERE CompetitionID = @competitionId AND UserID = @userId
    `);
    
    if (participantResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this competition'
      });
    }
    
    const participant = participantResult.recordset[0];
    
    // Check if the competition time window is valid for this participant
    const now = new Date();
    
    if (participant.Status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'You have not started this competition yet'
      });
    }
    
    if (now > participant.EndTime) {
      return res.status(400).json({
        success: false,
        message: 'Your competition time has expired'
      });
    }
    
    // Get the Judge0 language ID
    const languageId = getJudge0LanguageId(language);
    
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported programming language: ${language}`
      });
    }
    
    // Parse test cases from the problem
    let testCases = [];
    
    try {
      // Try to parse visible test cases
      if (problem.TestCasesVisible) {
        try {
          const visibleCases = JSON.parse(problem.TestCasesVisible);
          if (Array.isArray(visibleCases)) {
            testCases = testCases.concat(visibleCases.map(tc => ({
              ...tc,
              IsHidden: false
            })));
          }
        } catch (err) {
          console.error('Error parsing visible test cases:', err);
        }
      }
      
      // Try to parse hidden test cases
      if (problem.TestCasesHidden) {
        try {
          const hiddenCases = JSON.parse(problem.TestCasesHidden);
          if (Array.isArray(hiddenCases)) {
            testCases = testCases.concat(hiddenCases.map(tc => ({
              ...tc,
              IsHidden: true
            })));
          }
        } catch (err) {
          console.error('Error parsing hidden test cases:', err);
        }
      }
    } catch (error) {
      console.error('Error parsing test cases:', error);
    }
    
    // Check if we have test cases
    if (testCases.length === 0) {
      console.warn(`No test cases found for problem ${problemId}`);
      // Create a single default test case if none exist
      testCases = [{ 
        TestCaseID: 1, 
        input: '', 
        output: '', 
        IsHidden: false 
      }];
    }
    
    console.log(`Found ${testCases.length} test cases for problem ${problemId}`);
    
    // Create a record for the submission
    const submissionRequest = pool.request();
    submissionRequest.input('problemId', sql.BigInt, bigIntProblemId);
    submissionRequest.input('participantId', sql.BigInt, participant.ParticipantID);
    submissionRequest.input('sourceCode', sql.NText, sourceCode);
    submissionRequest.input('language', sql.NVarChar, language);
    
    const submissionResult = await submissionRequest.query(`
      INSERT INTO CompetitionSubmissions
      (ProblemID, ParticipantID, SourceCode, Language, Status, SubmittedAt)
      OUTPUT INSERTED.SubmissionID
      VALUES (@problemId, @participantId, @sourceCode, @language, 'pending', GETDATE())
    `);
    
    const submissionId = submissionResult.recordset[0].SubmissionID;
    
    // Process the submission asynchronously
    processSubmission(submissionId, sourceCode, languageId, testCases, problem)
      .catch(error => {
        console.error(`Error in submission processing: ${error.message}`, error);
      });
    
    return res.status(200).json({
      success: true,
      message: 'Solution submitted successfully',
      data: {
        submissionId,
        status: 'pending',
        language,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting solution',
      error: error.message
    });
  }
};

/**
 * Get submission details
 */
exports.getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    
    // Get submission details
    const result = await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .query(`
        SELECT 
          s.SubmissionID, s.ProblemID, s.ParticipantID, s.Language, 
          s.Status, s.Score, s.ExecutionTime, s.MemoryUsed, 
          s.ErrorMessage, s.SubmittedAt, s.JudgedAt,
          p.UserID, p.CompetitionID,
          cp.Title as ProblemTitle
        FROM CompetitionSubmissions s
        JOIN CompetitionParticipants p ON s.ParticipantID = p.ParticipantID
        JOIN CompetitionProblems cp ON s.ProblemID = cp.ProblemID
        WHERE s.SubmissionID = @submissionId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check if the submission belongs to the user
    const submission = result.recordset[0];
    if (submission.UserID !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this submission'
      });
    }
    
    // For completed submissions, get source code
    if (['accepted', 'wrong_answer', 'compilation_error', 'runtime_error', 'time_limit_exceeded', 'memory_limit_exceeded'].includes(submission.Status)) {
      const codeResult = await pool.request()
        .input('submissionId', sql.BigInt, submissionId)
        .query(`
          SELECT SourceCode
          FROM CompetitionSubmissions
          WHERE SubmissionID = @submissionId
        `);
      
      submission.SourceCode = codeResult.recordset[0].SourceCode;
    }
    
    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching submission details',
      error: error.message
    });
  }
};

/**
 * Get competition scoreboard
 */
exports.getScoreboard = async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Get all participants for the competition
    const participantsResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT 
          p.ParticipantID, p.UserID, p.Score, p.TotalProblemsSolved,
          p.Status, p.StartTime, p.EndTime, p.Rank,
          u.FullName, u.Image
        FROM CompetitionParticipants p
        JOIN Users u ON p.UserID = u.UserID
        WHERE p.CompetitionID = @competitionId
        ORDER BY p.Score DESC, p.TotalProblemsSolved DESC, p.EndTime ASC
      `);
    
    // Get all problems for the competition
    const problemsResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT ProblemID, Title, Points
        FROM CompetitionProblems
        WHERE CompetitionID = @competitionId
        ORDER BY Points ASC
      `);
    
    // Get submissions for each participant
    const submissionsResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT 
          s.SubmissionID, s.ProblemID, s.ParticipantID, s.Status, 
          s.Score, s.SubmittedAt, s.JudgedAt
        FROM CompetitionSubmissions s
        JOIN CompetitionParticipants p ON s.ParticipantID = p.ParticipantID
        WHERE p.CompetitionID = @competitionId
        ORDER BY s.JudgedAt DESC
      `);
    
    // Organize submissions by participant and problem
    const submissionsByParticipant = {};
    submissionsResult.recordset.forEach(submission => {
      if (!submissionsByParticipant[submission.ParticipantID]) {
        submissionsByParticipant[submission.ParticipantID] = {};
      }
      
      if (!submissionsByParticipant[submission.ParticipantID][submission.ProblemID]) {
        submissionsByParticipant[submission.ParticipantID][submission.ProblemID] = [];
      }
      
      submissionsByParticipant[submission.ParticipantID][submission.ProblemID].push(submission);
    });
    
    // Format data for frontend
    const scoreboard = {
      participants: participantsResult.recordset.map((participant, index) => {
        // Get the best submission for each problem
        const problemSubmissions = {};
        
        if (submissionsByParticipant[participant.ParticipantID]) {
          problemsResult.recordset.forEach(problem => {
            const submissions = submissionsByParticipant[participant.ParticipantID][problem.ProblemID] || [];
            const bestSubmission = submissions
              .filter(s => s.Status === 'accepted')
              .sort((a, b) => b.Score - a.Score)[0];
            
            problemSubmissions[problem.ProblemID] = bestSubmission ? {
              accepted: true,
              score: bestSubmission.Score,
              submissionId: bestSubmission.SubmissionID,
              submittedAt: bestSubmission.SubmittedAt
            } : {
              accepted: false,
              attempts: submissions.length
            };
          });
        }
        
        return {
          rank: index + 1,
          ...participant,
          problems: problemSubmissions
        };
      }),
      problems: problemsResult.recordset
    };
    
    return res.status(200).json({
      success: true,
      data: scoreboard
    });
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching scoreboard',
      error: error.message
    });
  }
};

/**
 * Get Judge0 language ID based on language name
 */
function getJudge0LanguageId(language) {
  // Updated language IDs for Judge0 CE on RapidAPI
  // Reference: https://rapidapi.com/judge0-official/api/judge0-ce/
  const languageMap = {
    'c': 50,             // C (GCC 9.2.0)
    'cpp': 54,           // C++ (GCC 9.2.0)
    'java': 62,          // Java (OpenJDK 13.0.1)
    'python': 71,        // Python (3.8.1)
    'python2': 70,       // Python (2.7.17)
    'python3': 71,       // Python (3.8.1)
    'javascript': 63,    // JavaScript (Node.js 12.14.0)
    'nodejs': 63,        // JavaScript (Node.js 12.14.0)
    'csharp': 51,        // C# (Mono 6.6.0.161)
    'php': 68,           // PHP (7.4.1)
    'ruby': 72,          // Ruby (2.7.0)
    'go': 60,            // Go (1.13.5)
    'rust': 73,          // Rust (1.40.0)
    'kotlin': 78,        // Kotlin (1.3.70)
    'swift': 83,         // Swift (5.2.3)
    'typescript': 74,    // TypeScript (3.7.4)
    'bash': 46,          // Bash (5.0.0)
    'r': 80,             // R (4.0.0)
    'scala': 81,         // Scala (2.13.2)
    'sql': 82,           // SQL (SQLite 3.27.2)
    'perl': 67,          // Perl (5.28.1)
    'objectivec': 79,    // Objective-C (Clang 7.0.1)
    'clojure': 86,       // Clojure (1.10.1)
    'pascal': 67,        // Pascal (FPC 3.0.4)
    'fortran': 59,       // Fortran (GFortran 9.2.0)
    'haskell': 61,       // Haskell (GHC 8.8.1)
    'lua': 64,           // Lua (5.3.5)
    'assembly': 45,      // Assembly (NASM 2.14.02)
    'elixir': 57,        // Elixir (1.9.4)
    'erlang': 58,        // Erlang (OTP 22.2)
    'd': 55,             // D (DMD 2.089.1)
    'lisp': 84,          // Common Lisp (SBCL 2.0.0)
    'prolog': 69         // Prolog (GNU Prolog 1.4.5)
  };
  
  // Convert input language to lowercase and handle common aliases
  const lang = language.toLowerCase();
  
  // Log language detection
  console.log(`Mapping language '${language}' to Judge0 language ID: ${languageMap[lang] || 'Unknown'}`);
  
  return languageMap[lang] || 54; // Default to C++ if language not found
}

/**
 * Process submission with Judge0 or local evaluation
 */
async function processSubmission(submissionId, sourceCode, languageId, testCases, problem) {
  try {
    console.log(`Processing submission ${submissionId} with ${testCases.length} test cases`);
    
    // Update submission status to processing
    await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .query(`
        UPDATE CompetitionSubmissions
        SET Status = 'running'
        WHERE SubmissionID = @submissionId
      `);
    
    let totalScore = 0;
    let maxExecutionTime = 0;
    let maxMemoryUsed = 0;
    let overallStatus = 'accepted';
    let errorMessage = null;
    
    // Check if Judge0 API is available, otherwise use local evaluation
    if (isJudge0Available) {
      console.log(`Using Judge0 API: ${JUDGE0_API_URL}`);
      
      // Process each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        try {
          console.log(`Submitting test case ${i + 1}/${testCases.length} to Judge0`);
          
          // Set up headers for RapidAPI
          const headers = {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': JUDGE0_API_HOST
          };
          
          // Add API key if available
          if (JUDGE0_API_KEY) {
            headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
          }
          
          // Get input and output from the test case
          const stdin = testCase.input || testCase.Input || '';
          const expectedOutput = testCase.output || testCase.Output || '';
          
          // Submit to Judge0
          const response = await axios.post(`${JUDGE0_API_URL}/submissions`, {
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin,
            expected_output: expectedOutput,
            cpu_time_limit: problem.TimeLimit || 2,
            memory_limit: (problem.MemoryLimit || 128) * 1024
          }, {
            headers: headers,
            params: { base64_encoded: false, wait: true }  // Wait for the result directly
          });
          
          // Log the response for debugging
          console.log(`Judge0 response for test case ${i + 1}:`, JSON.stringify(response.data));
          
          const result = response.data;
          
          // Update execution metrics
          const executionTime = parseFloat(result.time) || 0;
          const memoryUsed = parseInt(result.memory) || 0;
          
          if (executionTime > maxExecutionTime) maxExecutionTime = executionTime;
          if (memoryUsed > maxMemoryUsed) maxMemoryUsed = memoryUsed;
          
          // Check submission status
          const status = result.status?.id;
          console.log(`Test case ${i + 1} status: ${status}, status description: ${result.status?.description}`);
          
          // Status codes from Judge0:
          // 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded, 6: Compilation Error,
          // 7: Runtime Error (SIGSEGV), 8: Runtime Error (SIGXFSZ), etc.
          
          if (status === 3) {
            // Test case passed
            totalScore += Math.floor(problem.Points / testCases.length);
            console.log(`Test case ${i + 1} passed. Score: +${Math.floor(problem.Points / testCases.length)}`);
          } else {
            // Test case failed - update overall status based on the error
            if (status === 4) {
              overallStatus = 'wrong_answer';
              errorMessage = 'Your output did not match the expected output.';
            } else if (status === 5) {
              overallStatus = 'time_limit_exceeded';
              errorMessage = `Your solution took too long to execute. Time limit: ${problem.TimeLimit}s.`;
            } else if (status === 6) {
              overallStatus = 'compilation_error';
              errorMessage = result.compile_output || 'Compilation error';
              console.log(`Compilation error: ${result.compile_output}`);
              break; // Stop processing more test cases on compilation error
            } else if (status >= 7 && status <= 12) {
              overallStatus = 'runtime_error';
              errorMessage = result.stderr || 'Runtime error';
              console.log(`Runtime error: ${result.stderr}`);
            } else if (status === 13) {
              overallStatus = 'memory_limit_exceeded';
              errorMessage = `Your solution used too much memory. Memory limit: ${problem.MemoryLimit}MB.`;
            } else {
              overallStatus = 'runtime_error'; // Changed from 'error' to 'runtime_error'
              errorMessage = `Unknown error. Status: ${result.status?.description || status}`;
            }
            console.log(`Test case ${i + 1} failed. Status: ${overallStatus}, Error: ${errorMessage}`);
          }
        } catch (error) {
          console.error(`Error processing test case ${i + 1} for submission ${submissionId}:`, error);
          
          // Extract the most relevant error information
          let errorDetails = error.message;
          if (error.response) {
            console.error('Error response:', {
              status: error.response.status,
              data: error.response.data
            });
            errorDetails = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
          } else if (error.request) {
            console.error('No response received:', error.request);
            errorDetails = 'No response from Judge0 service. The service may be down.';
          }
          
          overallStatus = 'runtime_error'; // Changed from 'error' to 'runtime_error'
          errorMessage = `Error evaluating submission: ${errorDetails}`;
          break;
        }
      }
    } else if (USE_EXECUTION_SERVICE) {
      // Local evaluation using our executionService
      console.log('Using local execution service for evaluation');
      
      try {
        // Get the language name from the languageId
        const languageName = Object.keys(getJudge0LanguageMap()).find(key => 
          getJudge0LanguageMap()[key] === languageId
        ) || 'cpp';
        
        // Create test case array in the format expected by executionService
        const formattedTestCases = testCases.map(tc => ({
          input: tc.input || tc.Input || '',
          output: tc.output || tc.Output || ''
        }));
        
        // Call our executionService API
        const response = await axios.post(`${EXECUTION_SERVICE_URL}/api/code-execution/execute-tests`, {
          code: sourceCode,
          language: languageName,
          testCases: formattedTestCases
        });
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Execution service error');
        }
        
        const result = response.data.data;
        console.log(`Local execution results: ${result.passedCount}/${result.totalCount} test cases passed`);
        
        // Check if all test cases passed
        if (result.passedCount === result.totalCount) {
          totalScore = problem.Points;
          overallStatus = 'accepted';
        } else {
          // Not all test cases passed, find the first failing test to get the error
          const failedTest = result.results.find(r => !r.passed);
          
          if (failedTest) {
            if (failedTest.error) {
              // Compilation or runtime error
              overallStatus = failedTest.error.includes('Compilation') ? 'compilation_error' : 'runtime_error';
              errorMessage = failedTest.error;
            } else {
              // Wrong answer
              overallStatus = 'wrong_answer';
              errorMessage = 'Your output did not match the expected output';
              
              // Add detailed diff information if available
              if (failedTest.diffInfo) {
                errorMessage += `\n${failedTest.diffInfo.message}`;
                if (failedTest.diffInfo.type === 'content_mismatch') {
                  errorMessage += `\nExpected: "${failedTest.diffInfo.expectedContext}"`;
                  errorMessage += `\nActual: "${failedTest.diffInfo.actualContext}"`;
                }
              }
            }
          } else {
            overallStatus = 'wrong_answer';
            errorMessage = 'Your solution failed some test cases';
          }
          
          // Calculate partial score based on passed test cases
          totalScore = Math.floor((result.passedCount / result.totalCount) * problem.Points);
        }
        
        // Set execution metrics from the result
        const executionTimes = result.results.map(r => r.executionTime || 0);
        maxExecutionTime = Math.max(...executionTimes) / 1000; // Convert to seconds
        maxMemoryUsed = 10000; // Placeholder since we don't track memory usage precisely
        
      } catch (error) {
        console.error('Error in local evaluation:', error);
        overallStatus = 'runtime_error';
        errorMessage = `Error evaluating submission: ${error.message}`;
        
        // Log more details if available
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            data: error.response.data
          });
        }
      }
    } else {
      // Simple pass-through evaluation (for development only)
      console.log('WARNING: Both Judge0 and local execution service are disabled. Using pass-through evaluation (all submissions accepted).');
      
      totalScore = problem.Points;
      maxExecutionTime = 0.1; // Fake execution time
      maxMemoryUsed = 10000; // Fake memory usage (10MB)
      overallStatus = 'accepted';
      errorMessage = null;
    }
    
    // Ensure score is not negative
    if (totalScore < 0) totalScore = 0;
    
    console.log(`Submission ${submissionId} final results: status=${overallStatus}, score=${totalScore}, executionTime=${maxExecutionTime}, memoryUsed=${maxMemoryUsed}`);
    
    // Update submission with final results
    const updateResult = await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .input('status', sql.NVarChar, overallStatus)
      .input('score', sql.Int, totalScore)
      .input('executionTime', sql.Decimal(10, 3), maxExecutionTime)
      .input('memoryUsed', sql.Int, maxMemoryUsed)
      .input('errorMessage', sql.NText, errorMessage)
      .input('judgedAt', sql.DateTime, new Date())
      .query(`
        UPDATE CompetitionSubmissions
        SET 
          Status = @status,
          Score = @score,
          ExecutionTime = @executionTime,
          MemoryUsed = @memoryUsed,
          ErrorMessage = @errorMessage,
          JudgedAt = @judgedAt
        WHERE SubmissionID = @submissionId
      `);
    
    // If the submission was accepted, update participant score and problems solved
    if (overallStatus === 'accepted') {
      // Get participant info
      const participantResult = await pool.request()
        .input('submissionId', sql.BigInt, submissionId)
        .query(`
          SELECT 
            s.ParticipantID, p.Score as CurrentScore, 
            p.TotalProblemsSolved, p.TotalProblemsAttempted,
            s.ProblemID
          FROM CompetitionSubmissions s
          JOIN CompetitionParticipants p ON s.ParticipantID = p.ParticipantID
          WHERE s.SubmissionID = @submissionId
        `);
      
      if (participantResult.recordset.length > 0) {
        const participant = participantResult.recordset[0];
        
        // Check if this problem was already solved by this participant
        const existingSolutionResult = await pool.request()
          .input('participantId', sql.BigInt, participant.ParticipantID)
          .input('problemId', sql.BigInt, participant.ProblemID)
          .input('submissionId', sql.BigInt, submissionId)
          .query(`
            SELECT SubmissionID
            FROM CompetitionSubmissions
            WHERE 
              ParticipantID = @participantId AND 
              ProblemID = @problemId AND 
              Status = 'accepted' AND
              SubmissionID <> @submissionId
          `);
        
        const problemAlreadySolved = existingSolutionResult.recordset.length > 0;
        
        // Only update if this is the first accepted solution for this problem
        if (!problemAlreadySolved) {
          await pool.request()
            .input('participantId', sql.BigInt, participant.ParticipantID)
            .input('score', sql.Int, participant.CurrentScore + totalScore)
            .input('problemsSolved', sql.Int, participant.TotalProblemsSolved + 1)
            .query(`
              UPDATE CompetitionParticipants
              SET 
                Score = @score,
                TotalProblemsSolved = @problemsSolved,
                UpdatedAt = GETDATE()
              WHERE ParticipantID = @participantId
            `);
        }
        
        // If this is the first attempt for this problem, update problems attempted
        const attemptsResult = await pool.request()
          .input('participantId', sql.BigInt, participant.ParticipantID)
          .input('problemId', sql.BigInt, participant.ProblemID)
          .query(`
            SELECT COUNT(*) as AttemptCount
            FROM CompetitionSubmissions
            WHERE 
              ParticipantID = @participantId AND 
              ProblemID = @problemId
          `);
        
        if (attemptsResult.recordset[0].AttemptCount === 1) {
          await pool.request()
            .input('participantId', sql.BigInt, participant.ParticipantID)
            .input('problemsAttempted', sql.Int, participant.TotalProblemsAttempted + 1)
            .query(`
              UPDATE CompetitionParticipants
              SET 
                TotalProblemsAttempted = @problemsAttempted,
                UpdatedAt = GETDATE()
              WHERE ParticipantID = @participantId
            `);
        }
      }
    }
    
    console.log(`Submission ${submissionId} processed with status: ${overallStatus}, score: ${totalScore}`);
  } catch (error) {
    console.error(`Error processing submission ${submissionId}:`, error);
    
    // Update submission as failed
    try {
      await pool.request()
        .input('submissionId', sql.BigInt, submissionId)
        .input('errorMessage', sql.NText, error.message)
        .query(`
          UPDATE CompetitionSubmissions
          SET 
            Status = 'runtime_error',
            ErrorMessage = @errorMessage,
            JudgedAt = GETDATE()
          WHERE SubmissionID = @submissionId
        `);
    } catch (updateError) {
      console.error(`Error updating failed submission ${submissionId}:`, updateError);
    }
  }
}

// Helper function to get the language map
function getJudge0LanguageMap() {
  return {
    'c': 50,
    'cpp': 54,
    'java': 62,
    'python': 71,
    'javascript': 63,
    // ... other languages ...
  };
}

/**
 * Get user's competition history
 */
exports.getUserCompetitions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get competitions the user has participated in
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 
          c.CompetitionID, c.Title, c.Description, c.StartTime, c.EndTime,
          c.Duration, c.Difficulty, c.Status, c.ThumbnailUrl,
          p.ParticipantID, p.Status as ParticipantStatus, p.Score,
          p.StartTime as UserStartTime, p.EndTime as UserEndTime,
          p.TotalProblemsSolved, p.TotalProblemsAttempted, p.Rank
        FROM CompetitionParticipants p
        JOIN Competitions c ON p.CompetitionID = c.CompetitionID
        WHERE p.UserID = @userId AND c.DeletedAt IS NULL
        ORDER BY c.StartTime DESC
      `);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching user competitions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user competitions',
      error: error.message
    });
  }
}; 