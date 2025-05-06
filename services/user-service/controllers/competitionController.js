const User = require('../models/User');
const Competition = require('../models/Competition');
const CompetitionRegistration = require('../models/CompetitionRegistration');
const CompetitionParticipant = require('../models/CompetitionParticipant');
const CompetitionProblem = require('../models/CompetitionProblem');
const CompetitionSubmission = require('../models/CompetitionSubmission');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const rankingController = require('./rankingController');
const { ValidationError } = require('sequelize');

/**
 * Get all competitions with optional filters
 */
exports.getAllCompetitions = async (req, res) => {
  try {
    const { status, difficulty, registered } = req.query;
    const userId = req.user?.id || req.user?.userId || req.user?.UserID;

    const whereClause = {};

    if (status) {
      whereClause.Status = status;
    }

    if (difficulty) {
      whereClause.Difficulty = difficulty;
    }

    // Get basic competition data first
    const competitions = await Competition.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Organizer',
          attributes: ['UserID', 'Username', 'FullName', 'Email', 'Image']
        }
      ],
      order: [['StartTime', 'ASC']]
    });

    // Now get the participant counts and registration status for each competition
    const competitionsWithCounts = await Promise.all(competitions.map(async (competition) => {
      const competitionData = competition.toJSON();
      const competitionId = competitionData.CompetitionID || competitionData.ID;

      // Count participants by counting registrations
      const participantCount = await CompetitionRegistration.count({
        where: { CompetitionID: competitionId }
      });

      // Check if the current user is registered
      let isRegistered = false;
      let registrationStatus = null;

      if (userId) {
        const registration = await CompetitionRegistration.findOne({
          where: { UserID: userId, CompetitionID: competitionId }
        });

        if (registration) {
          isRegistered = true;
          registrationStatus = registration.Status;
        }
      }

      return {
        ...competitionData,
        ParticipantCount: participantCount,
        CurrentParticipants: participantCount,
        IsRegistered: isRegistered,
        RegistrationStatus: registrationStatus
      };
    }));

    // Filter for registered competitions if requested
    let result = competitionsWithCounts;
    if (registered === 'true' && userId) {
      result = competitionsWithCounts.filter(comp => comp.IsRegistered);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải danh sách cuộc thi',
      error: error.message
    });
  }
};

/**
 * Get competition by ID
 */
exports.getCompetitionById = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const competition = await Competition.findByPk(competitionId, {
      include: [
        {
          model: User,
          as: 'Organizer',
          attributes: ['UserID', 'Username', 'FullName', 'Email', 'Image']
        },
        {
          model: CompetitionProblem,
          attributes: [
            'ProblemID',
            'Title',
            'Difficulty',
            'Points',
            'Description',
            'ImageURL',
            'Instructions',
            'Tags'
          ]
        }
      ]
    });

    if (!competition) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc thi' });
    }

    // Get participant count
    const participantCount = await CompetitionParticipant.count({
      where: { CompetitionID: competitionId }
    });

    // Calculate real-time status based on current time and competition dates
    const now = new Date();
    const startTime = new Date(competition.StartTime);
    const endTime = new Date(competition.EndTime);

    let realTimeStatus = competition.Status;

    // Override the stored status with the calculated real-time status
    if (now < startTime) {
      realTimeStatus = 'upcoming';
    } else if (now >= startTime && now < endTime) {
      realTimeStatus = 'ongoing';
    } else if (now >= endTime) {
      realTimeStatus = 'completed';
    }

    // Format response
    const result = {
      ...competition.toJSON(),
      participantCount,
      Status: realTimeStatus // Override with the real-time status
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching competition:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải thông tin cuộc thi',
      error: error.message
    });
  }
};

/**
 * Register for a competition
 */
exports.registerCompetition = async (req, res) => {
  let transaction;

  try {
    const { competitionId } = req.params;

    // Check for user identification in the request
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Extract userId, supporting different field names
    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      console.error('Cannot determine user ID from req.user:', req.user);
      return res.status(400).json({ message: 'Invalid user identification' });
    }

    console.log(`Registering user ${userId} for competition ${competitionId}`);

    // Fetch the user for validation
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Start a transaction
    transaction = await sequelize.transaction();

    // Fetch the competition
    const competition = await Competition.findByPk(competitionId, { transaction });
    if (!competition) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Use current time on server
    const now = new Date();
    console.log(`Current server time: ${now.toISOString()}`);

    // Check if competition has a registration period defined
    if (competition.RegistrationEnd && new Date(competition.RegistrationEnd) < now) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Registration period has ended' });
    }

    if (competition.RegistrationStart && new Date(competition.RegistrationStart) > now) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Registration period has not started yet' });
    }

    // Ensure the user has a ranking record
    try {
      await rankingController.ensureUserRanking(userId);
    } catch (error) {
      console.error('Failed to ensure user ranking:', error);
      // Continue with registration even if ranking creation fails
    }

    // Check if user is already registered
    const existingRegistration = await CompetitionRegistration.findOne({
      where: { UserID: userId, CompetitionID: competitionId },
      transaction
    });

    if (existingRegistration) {
      await transaction.rollback();
      return res.status(400).json({ message: 'You are already registered for this competition' });
    }

    console.log('Inserting new registration record...');
    // Format the current date to a SQL Server compatible format
    const currentDate = now.toISOString().slice(0, 19).replace('T', ' ');

    try {
      // Use a properly formatted date that SQL Server can handle
      await sequelize.query(
        `INSERT INTO CompetitionRegistrations (UserID, CompetitionID, Status, Score, ProblemsSolved, RegistrationDate, CreatedAt, UpdatedAt)
         VALUES (:userId, :competitionId, 'REGISTERED', 0, 0, :currentDate, :currentDate, :currentDate)`,
        {
          replacements: {
            userId,
            competitionId,
            currentDate
          },
          type: sequelize.QueryTypes.INSERT,
          transaction
        }
      );
      console.log('Insert successful');

      // Also create or update a participant record to ensure participant counts are consistent
      const existingParticipant = await CompetitionParticipant.findOne({
        where: { UserID: userId, CompetitionID: competitionId },
        transaction
      });

      if (!existingParticipant) {
        // Skip the model and use direct SQL query to avoid date formatting issues
        console.log('Creating participant record with SQL query using date:', currentDate);
        await sequelize.query(
          `INSERT INTO CompetitionParticipants
           (UserID, CompetitionID, Status, RegistrationTime, Score,
            TotalProblemsAttempted, TotalProblemsSolved, CreatedAt, UpdatedAt)
           VALUES
           (:userId, :competitionId, 'registered', :currentDate, 0, 0, 0, :currentDate, :currentDate)`,
          {
            replacements: {
              userId,
              competitionId,
              currentDate
            },
            type: sequelize.QueryTypes.INSERT,
            transaction
          }
        );
        console.log('Participant record created successfully with SQL query');
      }
    } catch (error) {
      console.error('Error during INSERT operation:', error);
      throw error;
    }

    console.log(`User ${userId} successfully registered for competition ${competitionId}`);

    await transaction.commit();
    res.status(201).json({
      message: 'Successfully registered for the competition',
      success: true
    });
  } catch (error) {
    console.error('Error registering for competition:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
        success: false
      });
    }

    res.status(500).json({
      message: 'Failed to register for competition',
      error: error.message,
      success: false
    });
  }
};

/**
 * Get competition leaderboard
 */
exports.getCompetitionLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Verify competition exists
    const competition = await Competition.findByPk(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc thi' });
    }

    // Sử dụng truy vấn SQL trực tiếp để đảm bảo kết quả nhất quán với cách cập nhật thứ hạng
    const participants = await sequelize.query(`
      SELECT
        cp.ParticipantID,
        cp.UserID,
        cp.Score,
        cp.TotalProblemsSolved,
        cp.Rank,
        cp.StartTime,
        cp.EndTime,
        cp.UpdatedAt,
        u.Username,
        u.FullName,
        u.Email,
        u.Image,
        (
          SELECT COUNT(DISTINCT ProblemID)
          FROM CompetitionSubmissions cs
          WHERE cs.ParticipantID = cp.ParticipantID
          AND cs.Status = 'accepted'
        ) AS CompletedProblems
      FROM
        CompetitionParticipants cp
      JOIN
        Users u ON cp.UserID = u.UserID
      WHERE
        cp.CompetitionID = :competitionId
        AND cp.Status IN ('registered', 'active', 'completed')
      ORDER BY
        cp.Score DESC,
        CompletedProblems DESC,
        cp.UpdatedAt ASC
    `, {
      replacements: { competitionId },
      type: sequelize.QueryTypes.SELECT
    });

    // Update ranks based on the current query results
    // This ensures ranks are consistent with the current sort order
    participants.forEach((participant, index) => {
      participant.CurrentRank = index + 1;
    });

    // Format response
    const leaderboard = participants.map((participant) => {
      // Tính thời gian giải bài (nếu có)
      let competitionTime = null;
      if (participant.StartTime && participant.EndTime) {
        competitionTime = Math.floor((new Date(participant.EndTime) - new Date(participant.StartTime)) / 1000 / 60); // Đổi sang phút
      } else if (participant.StartTime) {
        // Nếu đã bắt đầu nhưng chưa kết thúc, dùng thời gian hiện tại
        competitionTime = Math.floor((new Date() - new Date(participant.StartTime)) / 1000 / 60);
      }

      // Use the actual completed problems count from the query
      const completedProblemsCount = participant.CompletedProblems || 0;

      return {
        rank: participant.CurrentRank, // Use the calculated rank based on current sort order
        id: participant.UserID,
        userId: participant.UserID, // Thêm trường này để đảm bảo tương thích
        name: participant.FullName || participant.Username,
        avatar: participant.Image,
        score: participant.Score || 0,
        problemsSolved: completedProblemsCount, // Use the actual count from the query
        competitionTime: competitionTime,
        updatedAt: participant.UpdatedAt
      };
    });

    console.log(`Fetched leaderboard for competition ${competitionId} with ${leaderboard.length} participants`);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching competition leaderboard:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải bảng xếp hạng',
      error: error.message
    });
  }
};

/**
 * Submit a solution for a competition problem
 */
exports.submitSolution = async (req, res) => {
  const { competitionId, problemId } = req.params;
  const { solution, language = 'javascript' } = req.body;

  // Validate input
  if (!solution) {
    return res.status(400).json({
      success: false,
      message: 'Solution is required'
    });
  }

  try {
    // Get user ID from authentication
    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication invalid'
      });
    }

    // Check if the user is registered for this competition
    const participant = await CompetitionParticipant.findOne({
      where: {
        UserID: userId,
        CompetitionID: competitionId
      }
    });

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this competition'
      });
    }

    // Check if the competition is active
    const competition = await Competition.findByPk(competitionId);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    const now = new Date();
    if (now < new Date(competition.StartTime) || now > new Date(competition.EndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Competition is not active'
      });
    }

    // Check if the problem belongs to this competition
    const problem = await CompetitionProblem.findOne({
      where: {
        ProblemID: problemId,
        CompetitionID: competitionId
      }
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found in this competition'
      });
    }

    // Check if the problem has already been solved by this user
    const existingSolution = await CompetitionSubmission.findOne({
      where: {
        ProblemID: problemId,
        ParticipantID: participant.ParticipantID,
        Status: 'accepted'
      }
    });

    if (existingSolution) {
      return res.status(200).json({
        success: true,
        message: 'Problem already solved successfully',
        data: {
          passed: true,
          alreadySolved: true,
          submissionId: existingSolution.SubmissionID,
          score: existingSolution.Score
        }
      });
    }

    // Execute solution against test cases
    const testCases = [];

    // Parse visible test cases if available
    if (problem.TestCasesVisible) {
      try {
        const visibleTests = JSON.parse(problem.TestCasesVisible);
        testCases.push(...visibleTests);
      } catch (err) {
        console.error('Error parsing visible test cases:', err);
      }
    }

    // Parse hidden test cases if available
    if (problem.TestCasesHidden) {
      try {
        const hiddenTests = JSON.parse(problem.TestCasesHidden);
        testCases.push(...hiddenTests);
      } catch (err) {
        console.error('Error parsing hidden test cases:', err);
      }
    }

    // Use sample input/output as a test case if no test cases are defined
    if (testCases.length === 0 && problem.SampleInput && problem.SampleOutput) {
      testCases.push({
        input: problem.SampleInput,
        output: problem.SampleOutput
      });
    }

    // If still no test cases, return error
    if (testCases.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No test cases available to evaluate solution'
      });
    }

    // Execute the code against each test case
    let allPassed = true;
    let totalScore = 0;
    let executionTime = 0;
    let memoryUsed = 0;

    const testResults = await Promise.all(testCases.map(async (testCase) => {
      try {
        // Use the codeExecutionController to run the code
        const { executeCodeInDocker } = require('./codeExecutionController');

        const result = await executeCodeInDocker(
          solution,
          language,
          testCase.input
        );

        // Enhanced normalization for more accurate comparison
        const normalizeOutput = (output) => {
          if (!output) return '';
          return output
            .trim()
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .replace(/\n+/g, '\n')   // Remove multiple newlines
            .replace(/\t/g, ' ')     // Replace tabs with spaces
            .replace(/\s+$/gm, '')   // Remove trailing whitespace on each line
            .trim();
        };

        const expectedOutput = normalizeOutput(testCase.output || '');
        const actualOutput = normalizeOutput(result.stdout || '');

        // Improved comparison logic for numeric outputs
        let passed = false;

        // Check if both outputs are numeric
        const isNumericExpected = !isNaN(parseFloat(expectedOutput)) && isFinite(expectedOutput);
        const isNumericActual = !isNaN(parseFloat(actualOutput)) && isFinite(actualOutput);

        if (isNumericExpected && isNumericActual) {
          // Compare as numbers with a small epsilon for floating point comparison
          const numExpected = parseFloat(expectedOutput);
          const numActual = parseFloat(actualOutput);
          const epsilon = 0.0001; // Small tolerance for floating point comparison
          passed = Math.abs(numExpected - numActual) < epsilon;

          if (!passed) {
            console.log(`Numeric comparison failed: Expected ${numExpected}, got ${numActual}, difference: ${Math.abs(numExpected - numActual)}`);
          }
        } else {
          // Standard string comparison
          passed = expectedOutput === actualOutput;

          if (!passed) {
            console.log(`String comparison failed: Expected "${expectedOutput}", got "${actualOutput}"`);
          }
        }

        // Update tracking variables
        if (!passed) allPassed = false;
        executionTime = Math.max(executionTime, result.executionTime || 0);
        memoryUsed = Math.max(memoryUsed, result.memoryUsage || 0);

        return {
          passed,
          input: testCase.input,
          expectedOutput,
          actualOutput,
          executionTime: result.executionTime,
          memoryUsage: result.memoryUsage
        };
      } catch (error) {
        console.error('Error executing test case:', error);
        allPassed = false;
        return {
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: null,
          error: error.message || 'Execution error'
        };
      }
    }));

    // Calculate score based on problem points and number of tests passed
    const basePoints = problem.Points || 100;
    const passedCount = testResults.filter(tr => tr.passed).length;
    const passedRatio = testCases.length > 0 ? passedCount / testCases.length : 0;

    // Only award points when ALL test cases pass
    totalScore = allPassed ? basePoints : 0;

    // Calculate percentage score for UI feedback (still show progress even if not all tests pass)
    const percentageScore = Math.round(passedRatio * 100);

    // Create submission record
    const submission = await CompetitionSubmission.create({
      ProblemID: problemId,
      ParticipantID: participant.ParticipantID,
      SourceCode: solution,
      Language: language,
      Status: allPassed ? 'accepted' : 'wrong_answer',
      Score: totalScore,
      ExecutionTime: executionTime,
      MemoryUsed: memoryUsed,
      SubmittedAt: new Date()
    });

    // If all tests passed, update user's progress
    if (allPassed) {
      // Update participant statistics
      if (!participant.StartTime) {
        participant.StartTime = new Date();
      }

      // Update score only if this problem wasn't solved before
      participant.Score += totalScore;
      participant.TotalProblemsSolved += 1;
      participant.UpdatedAt = new Date();

      await participant.save();

      // Update rankings for all participants
      await sequelize.query(`
        UPDATE CompetitionParticipants cp1
        SET Rank = (
          SELECT COUNT(*) + 1
          FROM CompetitionParticipants cp2
          WHERE cp2.CompetitionID = cp1.CompetitionID
          AND (
            cp2.Score > cp1.Score
            OR (cp2.Score = cp1.Score AND cp2.TotalProblemsSolved > cp1.TotalProblemsSolved)
            OR (cp2.Score = cp1.Score AND cp2.TotalProblemsSolved = cp1.TotalProblemsSolved AND cp2.UpdatedAt < cp1.UpdatedAt)
          )
        )
        WHERE cp1.CompetitionID = :competitionId
      `, {
        replacements: { competitionId: competitionId },
        type: sequelize.QueryTypes.UPDATE
      });
    }

    // Return submission results
    return res.status(200).json({
      success: true,
      message: allPassed ? 'All test cases passed!' : 'Some test cases failed',
      data: {
        submissionId: submission.SubmissionID,
        passed: allPassed,
        score: totalScore,
        percentageScore: percentageScore,
        passedCount: passedCount,
        totalCount: testCases.length,
        testResults: testResults.map(tr => ({
          passed: tr.passed,
          executionTime: tr.executionTime,
          memoryUsage: tr.memoryUsage
        })),
        completedProblems: await getCompletedProblemsForUser(userId, competitionId)
      }
    });

  } catch (error) {
    console.error('Error submitting solution:', error);

    return res.status(500).json({
      success: false,
      message: 'Error processing solution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to get all completed problems for a user in a competition
 */
async function getCompletedProblemsForUser(userId, competitionId) {
  try {
    console.log(`Getting completed problems for user ${userId} in competition ${competitionId}`);

    // Get participant ID
    const participant = await CompetitionParticipant.findOne({
      where: {
        UserID: userId,
        CompetitionID: competitionId
      }
    });

    if (!participant) {
      console.log(`No participant record found for user ${userId} in competition ${competitionId}`);
      return [];
    }

    // Use a direct SQL query for better performance and to avoid any ORM issues
    const query = `
      SELECT DISTINCT ProblemID
      FROM CompetitionSubmissions
      WHERE ParticipantID = :participantId
      AND Status = 'accepted'
    `;

    const results = await sequelize.query(query, {
      replacements: { participantId: participant.ParticipantID },
      type: sequelize.QueryTypes.SELECT
    });

    // Extract problem IDs from results
    const problemIds = results.map(result => result.ProblemID);

    console.log(`Found ${problemIds.length} completed problems for user ${userId} in competition ${competitionId}`);

    return problemIds;
  } catch (error) {
    console.error('Error getting completed problems:', error);
    return [];
  }
}

/**
 * Finish a competition (submit all solutions and calculate score)
 */
exports.finishCompetition = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // Check if user is authenticated
    if (!req.user) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để hoàn thành cuộc thi.'
      });
    }

    // Extract userId from req.user object (could be stored in different properties)
    const userId = req.user.userId || req.user.UserID || req.user.id;

    if (!userId) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        message: 'Không thể xác định ID người dùng. Vui lòng đăng nhập lại.'
      });
    }

    const { competitionId } = req.params;
    console.log(`User ${userId} finishing competition ${competitionId}`);

    // Find the competition
    const competition = await Competition.findByPk(competitionId);
    if (!competition) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc thi này.'
      });
    }

    // Find the participant
    const participant = await CompetitionParticipant.findOne({
      where: {
        CompetitionID: competitionId,
        UserID: userId
      }
    });

    if (!participant) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký cuộc thi này.'
      });
    }

    if (participant.Status === 'completed') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bạn đã hoàn thành cuộc thi này rồi.'
      });
    }

    // Format the current date/time for SQL Server compatibility
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 19).replace('T', ' ');

    // Calculate the score and other metrics
    // In a real implementation, this would involve checking the solutions for each problem
    const score = Math.floor(Math.random() * 100); // Placeholder for actual scoring logic
    const problemsAttempted = Math.floor(Math.random() * 10) + 1;
    const problemsSolved = Math.floor(Math.random() * problemsAttempted);

    // Update the participant record
    await participant.update({
      Status: 'completed',
      EndTime: formattedNow,
      Score: score,
      TotalProblemsAttempted: problemsAttempted,
      TotalProblemsSolved: problemsSolved,
      LastCalculatedAt: formattedNow,
      UpdatedAt: formattedNow
    }, { transaction: t });

    // Update user's ranking
    let ranking = await Ranking.findOne({
      where: { UserID: userId }
    });

    if (!ranking) {
      // Create a new ranking record if one doesn't exist
      ranking = await Ranking.create({
        UserID: userId,
        Tier: 'BRONZE',
        TotalPoints: score,
        ProblemsSolved: problemsSolved,
        Accuracy: problemsAttempted > 0 ? (problemsSolved / problemsAttempted) * 100 : 0,
        Wins: 0,
        WeeklyScore: score,
        MonthlyScore: score,
        LastCalculatedAt: formattedNow
      }, { transaction: t });
    } else {
      // Update existing ranking
      await ranking.update({
        TotalPoints: ranking.TotalPoints + score,
        ProblemsSolved: ranking.ProblemsSolved + problemsSolved,
        Accuracy: ((ranking.ProblemsSolved + problemsSolved) / (ranking.TotalProblemsAttempted + problemsAttempted)) * 100,
        WeeklyScore: ranking.WeeklyScore + score,
        MonthlyScore: ranking.MonthlyScore + score,
        LastCalculatedAt: formattedNow
      }, { transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: 'Cuộc thi đã hoàn thành!',
      data: {
        score,
        problemsAttempted,
        problemsSolved
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error finishing competition:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hoàn thành cuộc thi.',
      error: error.message
    });
  }
};

/**
 * Get competition problem by ID
 */
exports.getProblemById = async (req, res) => {
  try {
    const { problemId } = req.params;

    const problem = await CompetitionProblem.findByPk(problemId, {
      include: [{ model: Competition }]
    });

    if (!problem) {
      return res.status(404).json({ message: 'Không tìm thấy bài toán' });
    }

    return res.status(200).json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải thông tin bài toán',
      error: error.message
    });
  }
};

/**
 * Create a new competition problem
 */
exports.createProblem = async (req, res) => {
  let transaction;

  try {
    const { competitionId } = req.params;
    const {
      title,
      description,
      difficulty,
      points,
      timeLimit,
      memoryLimit,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      explanation,
      imageURL,
      starterCode,
      testCasesVisible,
      testCasesHidden,
      tags,
      instructions
    } = req.body;

    // Start transaction
    transaction = await sequelize.transaction();

    // Check if competition exists
    const competition = await Competition.findByPk(competitionId, { transaction });

    if (!competition) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy cuộc thi' });
    }

    // Create new problem
    const problem = await CompetitionProblem.create({
      CompetitionID: competitionId,
      Title: title,
      Description: description,
      Difficulty: difficulty || 'Trung bình',
      Points: points || 100,
      TimeLimit: timeLimit || 1,
      MemoryLimit: memoryLimit || 256,
      InputFormat: inputFormat,
      OutputFormat: outputFormat,
      Constraints: constraints,
      SampleInput: sampleInput,
      SampleOutput: sampleOutput,
      Explanation: explanation,
      ImageURL: imageURL,
      StarterCode: starterCode,
      TestCasesVisible: testCasesVisible,
      TestCasesHidden: testCasesHidden,
      Tags: tags,
      Instructions: instructions
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Tạo bài toán thành công',
      problemId: problem.ProblemID
    });
  } catch (error) {
    console.error('Error creating problem:', error);

    // Only rollback if a transaction exists and is active
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    return res.status(500).json({
      message: 'Lỗi khi tạo bài toán',
      error: error.message
    });
  }
};

/**
 * Update a competition problem
 */
exports.updateProblem = async (req, res) => {
  let transaction;

  try {
    const { problemId } = req.params;
    const {
      title,
      description,
      difficulty,
      points,
      timeLimit,
      memoryLimit,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      explanation,
      imageURL,
      starterCode,
      testCasesVisible,
      testCasesHidden,
      tags,
      instructions
    } = req.body;

    // Start transaction
    transaction = await sequelize.transaction();

    // Check if problem exists
    const problem = await CompetitionProblem.findByPk(problemId, { transaction });

    if (!problem) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy bài toán' });
    }

    // Update problem fields
    if (title) problem.Title = title;
    if (description) problem.Description = description;
    if (difficulty) problem.Difficulty = difficulty;
    if (points) problem.Points = points;
    if (timeLimit) problem.TimeLimit = timeLimit;
    if (memoryLimit) problem.MemoryLimit = memoryLimit;
    if (inputFormat) problem.InputFormat = inputFormat;
    if (outputFormat) problem.OutputFormat = outputFormat;
    if (constraints) problem.Constraints = constraints;
    if (sampleInput) problem.SampleInput = sampleInput;
    if (sampleOutput) problem.SampleOutput = sampleOutput;
    if (explanation) problem.Explanation = explanation;

    // New fields
    if (imageURL !== undefined) problem.ImageURL = imageURL;
    if (starterCode !== undefined) problem.StarterCode = starterCode;
    if (testCasesVisible !== undefined) problem.TestCasesVisible = testCasesVisible;
    if (testCasesHidden !== undefined) problem.TestCasesHidden = testCasesHidden;
    if (tags !== undefined) problem.Tags = tags;
    if (instructions !== undefined) problem.Instructions = instructions;

    await problem.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      message: 'Cập nhật bài toán thành công',
      problemId: problem.ProblemID
    });
  } catch (error) {
    console.error('Error updating problem:', error);

    // Only rollback if a transaction exists and is active
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    return res.status(500).json({
      message: 'Lỗi khi cập nhật bài toán',
      error: error.message
    });
  }
};

/**
 * Get all problems for a competition
 */
exports.getCompetitionProblems = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Check if competition exists
    const competition = await Competition.findByPk(competitionId);

    if (!competition) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc thi' });
    }

    // Get all problems for this competition
    const problems = await CompetitionProblem.findAll({
      where: { CompetitionID: competitionId },
      order: [['CreatedAt', 'ASC']]
    });

    return res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching competition problems:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải danh sách bài toán',
      error: error.message
    });
  }
};

/**
 * Check if user is registered for a competition
 */
exports.checkRegistrationStatus = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Check for user identification in the request
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract userId, supporting different field names
    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      console.error('Cannot determine user ID from req.user:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Invalid user identification'
      });
    }

    console.log(`Checking registration status for user ${userId} in competition ${competitionId}`);

    // Fetch the user for validation
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Look for registration
    const registration = await CompetitionRegistration.findOne({
      where: { UserID: userId, CompetitionID: competitionId },
      include: [{
        model: Competition,
        attributes: ['CompetitionID', 'Title', 'StartTime', 'EndTime']
      }]
    });

    if (!registration) {
      return res.status(200).json({
        isRegistered: false,
        success: true,
        message: 'User is not registered for this competition'
      });
    }

    // Return registration details
    return res.status(200).json({
      isRegistered: true,
      success: true,
      message: 'User is registered for this competition',
      registrationDetails: {
        id: registration.RegistrationID,
        competitionId: registration.CompetitionID,
        userId: registration.UserID,
        registrationDate: registration.RegistrationDate,
        status: registration.Status,
        score: registration.Score,
        problemsSolved: registration.ProblemsSolved,
        ranking: registration.Ranking,
        competitionTitle: registration.Competition ? registration.Competition.Title : null,
        competitionStart: registration.Competition ? registration.Competition.StartTime : null,
        competitionEnd: registration.Competition ? registration.Competition.EndTime : null
      }
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status',
      error: error.message
    });
  }
};

/**
 * Get the problems that a user has completed for a specific competition
 */
exports.getUserCompletedProblems = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Check for user identification in the request
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Extract userId, supporting different field names
    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      console.error('Cannot determine user ID from req.user:', req.user);
      return res.status(400).json({ message: 'Invalid user identification' });
    }

    console.log(`Fetching completed problems for user ${userId} in competition ${competitionId}`);

    // Get the participant ID for this user in this competition
    const participant = await CompetitionParticipant.findOne({
      where: {
        UserID: userId,
        CompetitionID: competitionId
      }
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Participant not found. User may not be registered for this competition.'
      });
    }

    // Query for completed problems (with status 'accepted')
    const completedProblems = await CompetitionSubmission.findAll({
      where: {
        ParticipantID: participant.ParticipantID,
        Status: 'accepted'
      },
      include: [
        {
          model: CompetitionProblem,
          attributes: ['ProblemID', 'Title', 'Difficulty', 'Points']
        }
      ],
      attributes: [
        'ProblemID',
        [sequelize.fn('MAX', sequelize.col('Score')), 'MaxScore'],
        [sequelize.fn('MIN', sequelize.col('ExecutionTime')), 'BestTime']
      ],
      group: ['ProblemID', 'CompetitionProblem.ProblemID', 'CompetitionProblem.Title',
              'CompetitionProblem.Difficulty', 'CompetitionProblem.Points']
    });

    // If no problems have been completed, return an empty array
    if (!completedProblems || completedProblems.length === 0) {
      return res.status(200).json([]);
    }

    // Format the response
    const formattedProblems = completedProblems.map(problem => {
      return {
        ProblemID: problem.ProblemID,
        Title: problem.CompetitionProblem?.Title,
        Difficulty: problem.CompetitionProblem?.Difficulty,
        Points: problem.CompetitionProblem?.Points,
        MaxScore: problem.get('MaxScore'),
        BestTime: problem.get('BestTime')
      };
    });

    return res.status(200).json(formattedProblems);
  } catch (error) {
    console.error('Error fetching completed problems:', error);
    return res.status(500).json({
      message: 'Lỗi khi tải danh sách bài tập đã hoàn thành',
      error: error.message
    });
  }
};

/**
 * Get completed problems for a competition by current user
 */
exports.getCompletedProblems = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Check for user identification in the request
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract userId, supporting different field names
    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      console.error('Cannot determine user ID from req.user:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Invalid user identification'
      });
    }

    console.log(`Getting completed problems for user ${userId} in competition ${competitionId}`);

    // Use the helper function to get completed problems
    const problemIds = await getCompletedProblemsForUser(userId, competitionId);

    if (!problemIds || problemIds.length === 0) {
      console.log(`No completed problems found for user ${userId} in competition ${competitionId}`);
      return res.status(200).json([]);
    }

    // Get problem details for the completed problems
    const problems = await CompetitionProblem.findAll({
      where: {
        ProblemID: {
          [Op.in]: problemIds
        }
      },
      attributes: ['ProblemID', 'Title', 'Points', 'Difficulty']
    });

    // Map the problems to the response format
    const completedProblems = problems.map(problem => ({
      ProblemID: problem.ProblemID,
      Title: problem.Title,
      Points: problem.Points,
      Difficulty: problem.Difficulty
    }));

    return res.status(200).json(completedProblems);

  } catch (error) {
    console.error('Error getting completed problems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed problems',
      error: error.message
    });
  }
};

/**
 * Get submitted solution for a problem
 */
exports.getSubmittedSolution = async (req, res) => {
  try {
    const { competitionId, problemId } = req.params;

    console.log(`Fetching submitted solution for problem ${problemId} in competition ${competitionId}`);

    if (!req.user) {
      console.log('Authentication required - user not found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user.userId || req.user.UserID;

    if (!userId) {
      console.log('Invalid user identification - userId not found');
      return res.status(400).json({
        success: false,
        message: 'Invalid user identification'
      });
    }

    console.log(`Looking up participant record for user ${userId} in competition ${competitionId}`);

    // First, try to auto-register the user if they're not registered yet
    try {
      // Check if the user is registered for this competition
      let registration = await CompetitionRegistration.findOne({
        where: {
          UserID: userId,
          CompetitionID: competitionId
        }
      });

      // If no registration found, register the user
      if (!registration) {
        console.log(`Auto-registering user ${userId} for competition ${competitionId}`);

        // Start a transaction
        const transaction = await sequelize.transaction();

        try {
          // Create registration record
          await sequelize.query(
            `INSERT INTO CompetitionRegistrations (UserID, CompetitionID, Status, Score, ProblemsSolved)
             VALUES (:userId, :competitionId, 'REGISTERED', 0, 0)`,
            {
              replacements: { userId, competitionId },
              type: sequelize.QueryTypes.INSERT,
              transaction
            }
          );

          // Commit the transaction
          await transaction.commit();
          console.log('Registration completed successfully');
        } catch (regError) {
          // Rollback in case of error
          await transaction.rollback();
          console.error('Error creating registration record:', regError);
        }
      }
    } catch (regCheckError) {
      console.error('Error checking/creating registration:', regCheckError);
    }

    // Get or create participant record
    let participant = await CompetitionParticipant.findOne({
      where: {
        UserID: userId,
        CompetitionID: competitionId
      }
    });

    // If no participant record exists, create one
    if (!participant) {
      console.log(`Creating participant record for user ${userId} in competition ${competitionId}`);
      try {
        participant = await CompetitionParticipant.create({
          UserID: userId,
          CompetitionID: competitionId,
          Status: 'registered',
          RegistrationTime: new Date(),
          Score: 0,
          TotalProblemsAttempted: 0,
          TotalProblemsSolved: 0,
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
        console.log(`Created participant record with ID ${participant.ParticipantID}`);
      } catch (createError) {
        console.error('Error creating participant record:', createError);
        return res.status(200).json({
          success: false,
          message: 'Could not create participant record. Please try again.'
        });
      }
    }

    console.log(`Looking up submissions for problem ${problemId} by participant ${participant.ParticipantID}`);

    // First check for accepted submissions
    let submission = await CompetitionSubmission.findOne({
      where: {
        ParticipantID: participant.ParticipantID,
        ProblemID: problemId,
        Status: 'accepted'
      },
      order: [['SubmittedAt', 'DESC']]
    });

    // If no accepted submission found, look for any submission
    if (!submission) {
      console.log(`No accepted submission found, checking for any submission`);
      submission = await CompetitionSubmission.findOne({
        where: {
          ParticipantID: participant.ParticipantID,
          ProblemID: problemId
        },
        order: [['SubmittedAt', 'DESC']]
      });
    }

    if (submission) {
      console.log(`Found solution submitted at ${submission.SubmittedAt}, status: ${submission.Status}`);
      return res.status(200).json({
        success: true,
        sourceCode: submission.SourceCode,
        language: submission.Language || 'javascript',
        submittedAt: submission.SubmittedAt,
        status: submission.Status
      });
    } else {
      console.log(`No submission found for problem ${problemId} by participant ${participant.ParticipantID}`);
      // Return 200 with empty solution instead of 404
      return res.status(200).json({
        success: false,
        message: 'No solution found for this problem'
      });
    }
  } catch (error) {
    console.error('Error fetching submitted solution:', error);
    // Return 200 with error info instead of 500
    return res.status(200).json({
      success: false,
      message: 'Failed to fetch submitted solution',
      error: error.message
    });
  }
};