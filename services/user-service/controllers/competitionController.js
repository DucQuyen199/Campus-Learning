const axios = require('axios');
const { pool, sql } = require('../config/db');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Judge0 API configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

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
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }
    
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
        ...result.recordset[0],
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
    
    // Get problem details - Ensure we're using input binding correctly
    const problemRequest = pool.request();
    problemRequest.input('problemId', sql.BigInt, problemId);
    problemRequest.input('competitionId', sql.BigInt, competitionId);
    
    const problemResult = await problemRequest.query(`
      SELECT 
        ProblemID, CompetitionID, Title, Description, Difficulty, Points,
        TimeLimit, MemoryLimit, InputFormat, OutputFormat,
        Constraints, SampleInput, SampleOutput, Explanation,
        ImageURL, StarterCode, TestCasesVisible, Tags, Instructions
      FROM CompetitionProblems
      WHERE ProblemID = @problemId AND CompetitionID = @competitionId
    `);
    
    if (problemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Get user's submissions for this problem if authenticated
    const userId = req.user?.id;
    let userSubmissions = [];
    
    if (userId) {
      // Check if user is registered for this competition
      const participantRequest = pool.request();
      participantRequest.input('competitionId', sql.BigInt, competitionId);
      participantRequest.input('userId', sql.BigInt, userId);
      
      const participantResult = await participantRequest.query(`
        SELECT ParticipantID, Status
        FROM CompetitionParticipants
        WHERE CompetitionID = @competitionId AND UserID = @userId
      `);
      
      if (participantResult.recordset.length > 0) {
        const participantId = participantResult.recordset[0].ParticipantID;
        
        // Get user's submissions
        const submissionsRequest = pool.request();
        submissionsRequest.input('problemId', sql.BigInt, problemId);
        submissionsRequest.input('participantId', sql.BigInt, participantId);
        
        const submissionsResult = await submissionsRequest.query(`
          SELECT 
            SubmissionID, Status, Score, ExecutionTime, MemoryUsed,
            ErrorMessage, SubmittedAt, Language
          FROM CompetitionSubmissions
          WHERE ProblemID = @problemId AND ParticipantID = @participantId
          ORDER BY SubmittedAt DESC
        `);
        
        userSubmissions = submissionsResult.recordset;
      }
    }
    
    // Parse test cases if they exist
    const problem = problemResult.recordset[0];
    if (problem.TestCasesVisible) {
      try {
        problem.TestCasesVisible = JSON.parse(problem.TestCasesVisible);
      } catch (e) {
        console.error('Error parsing test cases:', e);
        problem.TestCasesVisible = [];
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        ...problem,
        userSubmissions
      }
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
    if (competition.Status !== 'upcoming' && competition.Status !== 'draft' && competition.Status !== 'ongoing') {
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
    
    // Update competition participant count
    await pool.request()
      .input('competitionId', sql.BigInt, bigIntCompetitionId)
      .query(`
        UPDATE Competitions
        SET CurrentParticipants = CurrentParticipants + 1, UpdatedAt = GETDATE()
        WHERE CompetitionID = @competitionId
      `);
    
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
    
    // Check if competition exists and is ongoing
    const competitionRequest = pool.request();
    competitionRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    
    const competitionResult = await competitionRequest.query(`
      SELECT CompetitionID, Status, Duration, StartTime, EndTime
      FROM Competitions
      WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
            AND Status = 'ongoing'
    `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found or not currently ongoing'
      });
    }
    
    const competition = competitionResult.recordset[0];
    
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
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this competition'
      });
    }
    
    const participant = participantResult.recordset[0];
    
    // Check if the participant has already started or completed the competition
    if (participant.Status === 'active' && participant.StartTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already started this competition'
      });
    }
    
    if (participant.Status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this competition'
      });
    }
    
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
    
    // If not active or time has expired
    const now = new Date();
    if (participant.Status !== 'active' || now > new Date(participant.EndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Competition time has ended or you have not started'
      });
    }
    
    // Check if problem exists and belongs to this competition
    const problemRequest = pool.request();
    problemRequest.input('problemId', sql.BigInt, bigIntProblemId);
    problemRequest.input('competitionId', sql.BigInt, bigIntCompetitionId);
    
    const problemResult = await problemRequest.query(`
      SELECT 
        ProblemID, TimeLimit, MemoryLimit, TestCasesVisible, TestCasesHidden, Points
      FROM CompetitionProblems
      WHERE ProblemID = @problemId AND CompetitionID = @competitionId
    `);
    
    if (problemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    const problem = problemResult.recordset[0];
    
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
    
    // Update participant stats
    await pool.request()
      .input('participantId', sql.BigInt, participant.ParticipantID)
      .query(`
        UPDATE CompetitionParticipants
        SET TotalProblemsAttempted = CASE 
                                       WHEN EXISTS (SELECT 1 FROM CompetitionSubmissions WHERE ParticipantID = @participantId AND ProblemID = ${bigIntProblemId}) 
                                       THEN TotalProblemsAttempted 
                                       ELSE TotalProblemsAttempted + 1 
                                     END,
            UpdatedAt = GETDATE()
        WHERE ParticipantID = @participantId
      `);
    
    // Process submission in the background
    try {
      // Parse test cases
      let testCases = [];
      if (problem.TestCasesVisible) {
        try {
          const visibleCases = JSON.parse(problem.TestCasesVisible);
          testCases = testCases.concat(visibleCases);
        } catch (e) {
          console.error('Error parsing visible test cases:', e);
        }
      }
      if (problem.TestCasesHidden) {
        try {
          const hiddenCases = JSON.parse(problem.TestCasesHidden);
          testCases = testCases.concat(hiddenCases);
        } catch (e) {
          console.error('Error parsing hidden test cases:', e);
        }
      }
      
      // Execute asynchronously
      const languageId = getJudge0LanguageId(language);
      processSubmission(submissionId, sourceCode, languageId, testCases, problem)
        .catch(err => console.error(`Error processing submission ${submissionId}:`, err));
    } catch (err) {
      console.error('Error preparing submission for execution:', err);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Solution submitted successfully',
      data: { submissionId }
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    
    // Provide more detailed error for debugging
    let errorMessage = 'Error submitting solution';
    if (error.name === 'RangeError') {
      errorMessage = 'Invalid competition, problem, or user ID format';
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
 * Helper function to get Judge0 language ID
 */
function getJudge0LanguageId(language) {
  // This mapping might need adjustments based on the actual Judge0 configuration
  const languageMap = {
    'c': 50,          // C (GCC 9.2.0)
    'cpp': 54,        // C++ (GCC 9.2.0)
    'java': 62,       // Java (OpenJDK 13.0.1)
    'python': 71,     // Python (3.8.1)
    'javascript': 63, // JavaScript (Node.js 12.14.0)
    'csharp': 51,     // C# (Mono 6.6.0.161)
    'php': 68,        // PHP (7.4.1)
    'ruby': 72,       // Ruby (2.7.0)
    'go': 60,         // Go (1.13.5)
    'rust': 73        // Rust (1.40.0)
  };
  
  return languageMap[language.toLowerCase()];
}

/**
 * Process submission with Judge0
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
    
    // Process each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // Submit to Judge0
        const response = await axios.post(`${JUDGE0_API_URL}/submissions`, {
          source_code: sourceCode,
          language_id: languageId,
          stdin: testCase.input || '',
          expected_output: testCase.output || '',
          cpu_time_limit: problem.TimeLimit,
          memory_limit: problem.MemoryLimit * 1024
        }, {
          headers: JUDGE0_API_KEY ? { 'X-Auth-Token': JUDGE0_API_KEY } : {},
          params: { base64_encoded: false, wait: true }  // Wait for the result directly
        });
        
        const result = response.data;
        
        // Update execution metrics
        const executionTime = parseFloat(result.time) || 0;
        const memoryUsed = parseInt(result.memory) || 0;
        
        if (executionTime > maxExecutionTime) maxExecutionTime = executionTime;
        if (memoryUsed > maxMemoryUsed) maxMemoryUsed = memoryUsed;
        
        // Check submission status
        const status = result.status?.id;
        
        // Status codes from Judge0:
        // 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded, 6: Compilation Error,
        // 7: Runtime Error (SIGSEGV), 8: Runtime Error (SIGXFSZ), etc.
        
        if (status === 3) {
          // Test case passed
          totalScore += Math.floor(problem.Points / testCases.length);
        } else {
          // Test case failed - update overall status based on the error
          if (status === 4) overallStatus = 'wrong_answer';
          else if (status === 5) overallStatus = 'time_limit_exceeded';
          else if (status === 6) {
            overallStatus = 'compilation_error';
            errorMessage = result.compile_output || 'Compilation error';
            break; // Stop processing more test cases on compilation error
          } else if (status >= 7 && status <= 12) {
            overallStatus = 'runtime_error';
            errorMessage = result.stderr || 'Runtime error';
          } else if (status === 13) {
            overallStatus = 'memory_limit_exceeded';
          }
        }
      } catch (error) {
        console.error(`Error processing test case ${i} for submission ${submissionId}:`, error);
        overallStatus = 'runtime_error';
        errorMessage = error.message;
        break;
      }
    }
    
    // Ensure score is not negative
    if (totalScore < 0) totalScore = 0;
    
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