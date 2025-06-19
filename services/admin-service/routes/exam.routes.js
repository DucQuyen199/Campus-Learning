const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const examController = require('../controllers/exam.controller');

// Get all exams
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          e.*,
          c.Title as CourseTitle
        FROM Exams e
        LEFT JOIN Courses c ON e.CourseID = c.CourseID
        ORDER BY e.CreatedAt DESC
      `);

    // Log để debug
    console.log('Database result:', result.recordset);

    // Đảm bảo trả về đúng format
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting exams:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách bài thi',
      error: error.message 
    });
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Get exam details with course and creator info
    const examResult = await pool.request()
      .input('examId', sql.BigInt, id)
      .query(`
        SELECT e.*, 
               c.Title as CourseTitle,
               u.FullName as CreatorName,
               (SELECT COUNT(*) FROM ExamQuestions WHERE ExamID = e.ExamID) as QuestionCount,
               (SELECT COUNT(*) FROM ExamParticipants WHERE ExamID = e.ExamID) as ParticipantCount
        FROM Exams e
        LEFT JOIN Courses c ON e.CourseID = c.CourseID
        LEFT JOIN Users u ON e.CreatedBy = u.UserID
        WHERE e.ExamID = @examId
      `);
    
    if (examResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get exam questions with full details
    const questionsResult = await pool.request()
      .input('examId', sql.BigInt, id)
      .query(`
        SELECT q.*,
               CASE 
                 WHEN q.Type = 'essay' THEN (
                   SELECT TOP 1 t.* 
                   FROM ExamAnswerTemplates t 
                   WHERE t.QuestionID = q.QuestionID
                 )
                 WHEN q.Type = 'coding' THEN (
                   SELECT TOP 1 c.* 
                   FROM CodingExercises c
                   WHERE c.ExerciseID = CAST(JSON_VALUE(q.Options, '$.codingExerciseId') AS BIGINT)
                 )
               END as AdditionalData
        FROM ExamQuestions q
        WHERE q.ExamID = @examId
        ORDER BY q.OrderIndex
      `);

    // Format response
    const exam = examResult.recordset[0];
    const questions = questionsResult.recordset.map(q => ({
      ...q,
      Options: q.Options ? JSON.parse(q.Options) : null,
      AdditionalData: q.AdditionalData ? JSON.parse(q.AdditionalData) : null
    }));

    return res.status(200).json({
      exam: {
        ...exam,
        questions,
        status: exam.Status.toLowerCase(),
        allowReview: !!exam.AllowReview,
        shuffleQuestions: !!exam.ShuffleQuestions,
        startTime: exam.StartTime.toISOString(),
        endTime: exam.EndTime.toISOString()
      }
    });
  } catch (error) {
    console.error('Get Exam Error:', error);
    return res.status(500).json({ message: 'Server error while getting exam details' });
  }
});

// Create new exam
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, type, duration, totalPoints, passingScore,
      startTime, endTime, instructions, allowReview, shuffleQuestions,
      courseId, status
    } = req.body;
    
    const createdBy = req.user.UserID; // Logged in admin
    const pool = await poolPromise;
    
    // Create the exam
    // Check valid status values first
    console.log('Attempting to create exam with status:', status);
    
    // Query to see existing statuses
    const statusCheckResult = await pool.request()
      .query(`
        SELECT DISTINCT Status FROM Exams
      `);
    
    console.log('Existing status values in database:', statusCheckResult.recordset.map(r => r.Status));
    
    // Query to check the constraint directly
    try {
      const constraintResult = await pool.request()
        .query(`
          SELECT cc.name as constraint_name, cc.definition, t.name as table_name, c.name as column_name
          FROM sys.check_constraints cc
          JOIN sys.tables t ON cc.parent_object_id = t.object_id
          JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
          WHERE cc.name = 'CHK_Exam_Status'
        `);
      console.log('Constraint details:', constraintResult.recordset);
    } catch (constraintError) {
      console.log('Failed to fetch constraint details:', constraintError.message);
    }

    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('type', sql.VarChar(50), type)
      .input('duration', sql.Int, duration)
      .input('totalPoints', sql.Int, totalPoints || 100)
      .input('passingScore', sql.Int, passingScore || 60)
      .input('startTime', sql.DateTime, new Date(startTime))
      .input('endTime', sql.DateTime, new Date(endTime))
      .input('instructions', sql.NVarChar(sql.MAX), instructions)
      .input('allowReview', sql.Bit, allowReview !== false)
      .input('shuffleQuestions', sql.Bit, shuffleQuestions !== false)
      .input('courseId', sql.BigInt, courseId)
      .input('createdBy', sql.BigInt, createdBy)
      .input('status', sql.VarChar(20), status || 'UPCOMING')
      .query(`
        INSERT INTO Exams (
          Title, Description, Type, Duration, TotalPoints,
          PassingScore, StartTime, EndTime, Instructions,
          AllowReview, ShuffleQuestions, CourseID,
          CreatedBy, Status
        )
        OUTPUT INSERTED.ExamID
        VALUES (
          @title, @description, @type, @duration, @totalPoints,
          @passingScore, @startTime, @endTime, @instructions,
          @allowReview, @shuffleQuestions, @courseId,
          @createdBy, @status
        )
      `);
    
    const examId = result.recordset[0].ExamID;
    
    return res.status(201).json({ 
      message: 'Exam created successfully',
      examId: examId
    });
  } catch (error) {
    console.error('Create Exam Error:', error);
    return res.status(500).json({ message: 'Server error while creating exam' });
  }
});

// Update exam
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, type, duration, totalPoints, passingScore,
      startTime, endTime, instructions, allowReview, shuffleQuestions,
      courseId, status
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if exam exists
    const checkResult = await pool.request()
      .input('examId', sql.BigInt, id)
      .query('SELECT * FROM Exams WHERE ExamID = @examId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Update the exam
    await pool.request()
      .input('examId', sql.BigInt, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('type', sql.VarChar(50), type)
      .input('duration', sql.Int, duration)
      .input('totalPoints', sql.Int, totalPoints)
      .input('passingScore', sql.Int, passingScore)
      .input('startTime', sql.DateTime, new Date(startTime))
      .input('endTime', sql.DateTime, new Date(endTime))
      .input('instructions', sql.NVarChar(sql.MAX), instructions)
      .input('allowReview', sql.Bit, allowReview)
      .input('shuffleQuestions', sql.Bit, shuffleQuestions)
      .input('courseId', sql.BigInt, courseId)
      .input('status', sql.VarChar(20), status)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Exams
        SET 
          Title = @title,
          Description = @description,
          Type = @type,
          Duration = @duration,
          TotalPoints = @totalPoints,
          PassingScore = @passingScore,
          StartTime = @startTime,
          EndTime = @endTime,
          Instructions = @instructions,
          AllowReview = @allowReview,
          ShuffleQuestions = @shuffleQuestions,
          CourseID = @courseId,
          Status = @status,
          UpdatedAt = @updatedAt
        WHERE ExamID = @examId
      `);
    
    return res.status(200).json({ message: 'Exam updated successfully' });
  } catch (error) {
    console.error('Update Exam Error:', error);
    return res.status(500).json({ message: 'Server error while updating exam' });
  }
});

// Add question to exam
router.post('/:examId/questions', async (req, res) => {
  try {
    const { examId } = req.params;
    const { 
      type, content, points, options, correctAnswer, 
      explanation, orderIndex
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if exam exists
    const checkResult = await pool.request()
      .input('examId', sql.BigInt, examId)
      .query('SELECT * FROM Exams WHERE ExamID = @examId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Get max order index if not provided
    let nextOrderIndex = orderIndex;
    if (!nextOrderIndex) {
      const orderResult = await pool.request()
        .input('examId', sql.BigInt, examId)
        .query(`
          SELECT MAX(OrderIndex) as maxOrder
          FROM ExamQuestions
          WHERE ExamID = @examId
        `);
      
      nextOrderIndex = (orderResult.recordset[0].maxOrder || 0) + 1;
    }
    
    // Create question
    const result = await pool.request()
      .input('examId', sql.BigInt, examId)
      .input('type', sql.VarChar(50), type)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('points', sql.Int, points || 1)
      .input('orderIndex', sql.Int, nextOrderIndex)
      .input('options', sql.NVarChar(sql.MAX), options ? JSON.stringify(options) : null)
      .input('correctAnswer', sql.NVarChar(sql.MAX), correctAnswer)
      .input('explanation', sql.NVarChar(sql.MAX), explanation)
      .query(`
        INSERT INTO ExamQuestions (
          ExamID, Type, Content, Points, OrderIndex,
          Options, CorrectAnswer, Explanation
        )
        OUTPUT INSERTED.QuestionID
        VALUES (
          @examId, @type, @content, @points, @orderIndex,
          @options, @correctAnswer, @explanation
        )
      `);
    
    const questionId = result.recordset[0].QuestionID;
    
    return res.status(201).json({
      message: 'Question added successfully',
      questionId: questionId
    });
  } catch (error) {
    console.error('Add Question Error:', error);
    return res.status(500).json({ message: 'Server error while adding question' });
  }
});

// Update question
router.put('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { 
      type, content, points, options, correctAnswer, 
      explanation, orderIndex
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if question exists
    const checkResult = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query('SELECT * FROM ExamQuestions WHERE QuestionID = @questionId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Update question
    await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .input('type', sql.VarChar(50), type)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('points', sql.Int, points)
      .input('orderIndex', sql.Int, orderIndex)
      .input('options', sql.NVarChar(sql.MAX), options ? JSON.stringify(options) : null)
      .input('correctAnswer', sql.NVarChar(sql.MAX), correctAnswer)
      .input('explanation', sql.NVarChar(sql.MAX), explanation)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE ExamQuestions
        SET 
          Type = @type,
          Content = @content,
          Points = @points,
          OrderIndex = @orderIndex,
          Options = @options,
          CorrectAnswer = @correctAnswer,
          Explanation = @explanation,
          UpdatedAt = @updatedAt
        WHERE QuestionID = @questionId
      `);
    
    return res.status(200).json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update Question Error:', error);
    return res.status(500).json({ message: 'Server error while updating question' });
  }
});

// Delete question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const pool = await poolPromise;
    
    // Check if question exists
    const checkResult = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query('SELECT * FROM ExamQuestions WHERE QuestionID = @questionId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Delete question
    await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query('DELETE FROM ExamQuestions WHERE QuestionID = @questionId');
    
    return res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete Question Error:', error);
    return res.status(500).json({ message: 'Server error while deleting question' });
  }
});

// Add answer template for essay exams
router.post('/:examId/template', async (req, res) => {
  try {
    const { examId } = req.params;
    const { content, keywords, minimumMatchPercentage } = req.body;
    
    const createdBy = req.user.UserID;
    const pool = await poolPromise;
    
    // Check if exam exists
    const checkResult = await pool.request()
      .input('examId', sql.BigInt, examId)
      .query('SELECT * FROM Exams WHERE ExamID = @examId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if template already exists for this exam
    const templateResult = await pool.request()
      .input('examId', sql.BigInt, examId)
      .query('SELECT * FROM ExamAnswerTemplates WHERE ExamID = @examId');
    
    if (templateResult.recordset.length > 0) {
      // Update existing template
      await pool.request()
        .input('examId', sql.BigInt, examId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('keywords', sql.NVarChar(sql.MAX), JSON.stringify(keywords))
        .input('minimumMatchPercentage', sql.Decimal(5, 2), minimumMatchPercentage || 60)
        .input('updatedAt', sql.DateTime, new Date())
        .query(`
          UPDATE ExamAnswerTemplates
          SET 
            Content = @content,
            Keywords = @keywords,
            MinimumMatchPercentage = @minimumMatchPercentage,
            UpdatedAt = @updatedAt
          WHERE ExamID = @examId
        `);
      
      return res.status(200).json({ message: 'Answer template updated successfully' });
    } else {
      // Create new template
      const result = await pool.request()
        .input('examId', sql.BigInt, examId)
        .input('content', sql.NVarChar(sql.MAX), content)
        .input('keywords', sql.NVarChar(sql.MAX), JSON.stringify(keywords))
        .input('minimumMatchPercentage', sql.Decimal(5, 2), minimumMatchPercentage || 60)
        .input('createdBy', sql.BigInt, createdBy)
        .query(`
          INSERT INTO ExamAnswerTemplates (
            ExamID, Content, Keywords, MinimumMatchPercentage, CreatedBy
          )
          OUTPUT INSERTED.TemplateID
          VALUES (
            @examId, @content, @keywords, @minimumMatchPercentage, @createdBy
          )
        `);
      
      const templateId = result.recordset[0].TemplateID;
      
      return res.status(201).json({
        message: 'Answer template created successfully',
        templateId: templateId
      });
    }
  } catch (error) {
    console.error('Template Error:', error);
    return res.status(500).json({ message: 'Server error while managing answer template' });
  }
});

// Get exam participants
router.get('/:examId/participants', async (req, res) => {
  try {
    const { examId } = req.params;
    const pool = await poolPromise;
    
    // Get participants with attempt numbering for repeated attempts
    const result = await pool.request()
      .input('examId', sql.BigInt, examId)
      .query(`
        WITH UserAttempts AS (
          SELECT 
            ep.*,
            u.FullName,
            u.Email,
            u.Image,
            ROW_NUMBER() OVER (PARTITION BY ep.UserID ORDER BY ep.StartedAt) as AttemptNumber,
            COUNT(*) OVER (PARTITION BY ep.UserID) as TotalAttempts
          FROM ExamParticipants ep
          JOIN Users u ON ep.UserID = u.UserID
          WHERE ep.ExamID = @examId
        )
        SELECT *
        FROM UserAttempts
        ORDER BY UserID, StartedAt DESC
      `);
    
    return res.status(200).json({ participants: result.recordset });
  } catch (error) {
    console.error('Get Participants Error:', error);
    return res.status(500).json({ message: 'Server error while getting exam participants' });
  }
});

// Get participant answers
router.get('/participants/:participantId/answers', async (req, res) => {
  try {
    const { participantId } = req.params;
    const pool = await poolPromise;
    
    // Get participant details
    const participantResult = await pool.request()
      .input('participantId', sql.BigInt, participantId)
      .query(`
        SELECT ep.*, e.Title as ExamTitle, u.FullName, u.Email
        FROM ExamParticipants ep
        JOIN Exams e ON ep.ExamID = e.ExamID
        JOIN Users u ON ep.UserID = u.UserID
        WHERE ep.ParticipantID = @participantId
      `);
    
    if (participantResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    // Get answers
    const answersResult = await pool.request()
      .input('participantId', sql.BigInt, participantId)
      .query(`
        SELECT ea.*, eq.Content as QuestionContent, eq.Type as QuestionType, 
               eq.Options as QuestionOptions, eq.CorrectAnswer, eq.Points as QuestionPoints
        FROM ExamAnswers ea
        JOIN ExamQuestions eq ON ea.QuestionID = eq.QuestionID
        WHERE ea.ParticipantID = @participantId
        ORDER BY eq.OrderIndex
      `);
    
    // Get essay analysis if exists
    const analysisResult = await pool.request()
      .input('participantId', sql.BigInt, participantId)
      .query(`
        SELECT esa.*
        FROM EssayAnswerAnalysis esa
        JOIN ExamAnswers ea ON esa.AnswerID = ea.AnswerID
        WHERE ea.ParticipantID = @participantId
      `);
    
    return res.status(200).json({
      participant: participantResult.recordset[0],
      answers: answersResult.recordset,
      analysis: analysisResult.recordset
    });
  } catch (error) {
    console.error('Get Answers Error:', error);
    return res.status(500).json({ message: 'Server error while getting participant answers' });
  }
});

// Review participant essay answer
router.post('/answers/:answerId/review', async (req, res) => {
  try {
    const { answerId } = req.params;
    const { score, reviewerComments, isCorrect } = req.body;
    
    const reviewerId = req.user.UserID;
    const pool = await poolPromise;
    
    // Check if answer exists
    const checkResult = await pool.request()
      .input('answerId', sql.BigInt, answerId)
      .query(`
        SELECT ea.*, ep.ParticipantID, eq.ExamID
        FROM ExamAnswers ea
        JOIN ExamParticipants ep ON ea.ParticipantID = ep.ParticipantID
        JOIN ExamQuestions eq ON ea.QuestionID = eq.QuestionID
        WHERE ea.AnswerID = @answerId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    
    const participantId = checkResult.recordset[0].ParticipantID;
    const examId = checkResult.recordset[0].ExamID;
    
    // Update answer score and review
    await pool.request()
      .input('answerId', sql.BigInt, answerId)
      .input('score', sql.Int, score)
      .input('isCorrect', sql.Bit, isCorrect)
      .input('reviewerComments', sql.NVarChar(sql.MAX), reviewerComments)
      .query(`
        UPDATE ExamAnswers
        SET 
          Score = @score,
          IsCorrect = @isCorrect,
          ReviewerComments = @reviewerComments
        WHERE AnswerID = @answerId
      `);
    
    // Update essay analysis if exists
    const analysisResult = await pool.request()
      .input('answerId', sql.BigInt, answerId)
      .query('SELECT * FROM EssayAnswerAnalysis WHERE AnswerID = @answerId');
    
    if (analysisResult.recordset.length > 0) {
      await pool.request()
        .input('answerId', sql.BigInt, answerId)
        .input('finalScore', sql.Int, score)
        .input('reviewerComments', sql.NVarChar(sql.MAX), reviewerComments)
        .query(`
          UPDATE EssayAnswerAnalysis
          SET 
            FinalScore = @finalScore,
            ReviewerComments = @reviewerComments
          WHERE AnswerID = @answerId
        `);
    }
    
    // Update participant's overall score and status
    await pool.request()
      .input('participantId', sql.BigInt, participantId)
      .input('reviewedBy', sql.BigInt, reviewerId)
      .input('reviewedAt', sql.DateTime, new Date())
      .query(`
        UPDATE ep
        SET 
          Score = (SELECT AVG(Score) FROM ExamAnswers WHERE ParticipantID = @participantId),
          Status = 'reviewed',
          ReviewedBy = @reviewedBy,
          ReviewedAt = @reviewedAt
        FROM ExamParticipants ep
        WHERE ep.ParticipantID = @participantId
      `);
    
    return res.status(200).json({ message: 'Answer reviewed successfully' });
  } catch (error) {
    console.error('Review Answer Error:', error);
    return res.status(500).json({ message: 'Server error while reviewing answer' });
  }
});

// Cancel exam
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Update exam status to cancelled
    await pool.request()
      .input('examId', sql.BigInt, id)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Exams
        SET Status = 'cancelled', UpdatedAt = @updatedAt
        WHERE ExamID = @examId
      `);
    
    return res.status(200).json({ message: 'Exam cancelled successfully' });
  } catch (error) {
    console.error('Cancel Exam Error:', error);
    return res.status(500).json({ message: 'Server error while cancelling exam' });
  }
});

// Add coding exercise to a question
router.post('/:examId/questions/:questionId/coding', async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const {
      programmingLanguage,
      initialCode,
      solutionCode,
      testCases,
      timeLimit,
      memoryLimit,
      difficulty,
      points
    } = req.body;
    
    const pool = await poolPromise;
    
    // First check if the question exists and is of coding type
    const checkResult = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .input('examId', sql.BigInt, examId)
      .query(`
        SELECT * FROM ExamQuestions 
        WHERE QuestionID = @questionId AND ExamID = @examId AND Type = 'coding'
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Coding question not found' });
    }
    
    // Create a new coding exercise linked to the exam question
    const result = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .input('title', sql.NVarChar(255), `Exam Question #${questionId}`)
      .input('description', sql.NVarChar(sql.MAX), req.body.content || 'Coding exercise for exam')
      .input('programmingLanguage', sql.VarChar(50), programmingLanguage)
      .input('initialCode', sql.NVarChar(sql.MAX), initialCode)
      .input('solutionCode', sql.NVarChar(sql.MAX), solutionCode)
      .input('testCases', sql.NVarChar(sql.MAX), JSON.stringify(testCases))
      .input('timeLimit', sql.Int, timeLimit || 1000)
      .input('memoryLimit', sql.Int, memoryLimit || 256)
      .input('difficulty', sql.VarChar(20), difficulty || 'medium')
      .input('points', sql.Int, points || 10)
      .query(`
        INSERT INTO CodingExercises (
          Title, Description, ProgrammingLanguage, InitialCode, 
          SolutionCode, TestCases, TimeLimit, MemoryLimit,
          Difficulty, Points, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.ExerciseID
        VALUES (
          @title, @description, @programmingLanguage, @initialCode,
          @solutionCode, @testCases, @timeLimit, @memoryLimit,
          @difficulty, @points, GETDATE(), GETDATE()
        )
      `);
    
    const exerciseId = result.recordset[0].ExerciseID;
    
    // Update the exam question with the reference to the coding exercise
    await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .input('exerciseId', sql.BigInt, exerciseId)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE ExamQuestions
        SET 
          Options = JSON_MODIFY(
            ISNULL(Options, '{}'), 
            '$.codingExerciseId', 
            @exerciseId
          ),
          UpdatedAt = @updatedAt
        WHERE QuestionID = @questionId
      `);
    
    return res.status(201).json({ 
      message: 'Coding exercise added successfully',
      exerciseId: exerciseId
    });
  } catch (error) {
    console.error('Add Coding Exercise Error:', error);
    return res.status(500).json({ message: 'Server error while adding coding exercise' });
  }
});

// Get a coding exercise
router.get('/questions/:questionId/coding', async (req, res) => {
  try {
    const { questionId } = req.params;
    const pool = await poolPromise;
    
    // Get the question details first
    const questionResult = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query('SELECT * FROM ExamQuestions WHERE QuestionID = @questionId AND Type = \'coding\'');
    
    if (questionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Coding question not found' });
    }
    
    const options = JSON.parse(questionResult.recordset[0].Options || '{}');
    
    if (!options.codingExerciseId) {
      return res.status(404).json({ message: 'Coding exercise not linked to this question' });
    }
    
    // Get the coding exercise details
    const exerciseResult = await pool.request()
      .input('exerciseId', sql.BigInt, options.codingExerciseId)
      .query('SELECT * FROM CodingExercises WHERE ExerciseID = @exerciseId');
    
    if (exerciseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Coding exercise not found' });
    }
    
    // Format the response
    const exercise = exerciseResult.recordset[0];
    exercise.TestCases = JSON.parse(exercise.TestCases);
    
    return res.status(200).json({ exercise });
  } catch (error) {
    console.error('Get Coding Exercise Error:', error);
    return res.status(500).json({ message: 'Server error while getting coding exercise' });
  }
});

// Handle essay file upload
router.post('/:examId/questions/:questionId/essay/upload', async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    
    // Check if file was uploaded
    if (!req.files || !req.files.essayFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const essayFile = req.files.essayFile;
    const fileExtension = essayFile.name.split('.').pop().toLowerCase();
    
    // Validate file type (doc, docx, pdf, txt)
    if (!['doc', 'docx', 'pdf', 'txt'].includes(fileExtension)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only .doc, .docx, .pdf, and .txt files are allowed' 
      });
    }
    
    // Generate a unique filename
    const fileName = `exam_${examId}_question_${questionId}_${Date.now()}.${fileExtension}`;
    const filePath = path.join(__dirname, '../uploads/essays', fileName);
    
    // Make sure directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save file
    await essayFile.mv(filePath);
    
    // Update the question with file information
    const pool = await poolPromise;
    await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .input('essayFilePath', sql.VarChar(255), `/uploads/essays/${fileName}`)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE ExamQuestions
        SET 
          Options = JSON_MODIFY(
            ISNULL(Options, '{}'), 
            '$.essayFilePath', 
            @essayFilePath
          ),
          UpdatedAt = @updatedAt
        WHERE QuestionID = @questionId
      `);
    
    return res.status(200).json({ 
      message: 'Essay file uploaded successfully',
      filePath: `/uploads/essays/${fileName}`
    });
  } catch (error) {
    console.error('Essay File Upload Error:', error);
    return res.status(500).json({ message: 'Server error while uploading essay file' });
  }
});

// Add essay template for a question
router.post('/:examId/questions/:questionId/essay', examController.addEssayTemplate);

// Get essay template for a question (lấy trực tiếp từ bảng ExamAnswerTemplates)
router.get('/:examId/questions/:questionId/essay', async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('examId', sql.BigInt, examId)
      .input('questionId', sql.BigInt, questionId)
      .query(
        `SELECT TemplateID, Content, Keywords, MinimumMatchPercentage
         FROM ExamAnswerTemplates
         WHERE ExamID = @examId AND QuestionID = @questionId`
      );
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Essay template not found for this question' });
    }
    const tmpl = result.recordset[0];
    return res.status(200).json({
      essayTemplate: {
        content: tmpl.Content || '',
        keywords: tmpl.Keywords ? JSON.parse(tmpl.Keywords) : [],
        minimumMatchPercentage: tmpl.MinimumMatchPercentage
      }
    });
  } catch (error) {
    console.error('Error getting essay template:', error);
    return res.status(500).json({ message: 'Server error while getting essay template' });
  }
});

// Add automatic grading endpoint for essay questions
router.post('/:examId/participants/:participantId/questions/:questionId/grade-essay', async (req, res) => {
  try {
    const { examId, participantId, questionId } = req.params;
    const { answer } = req.body;
    
    const pool = await poolPromise;
    
    // Get question details
    const questionResult = await pool.request()
      .input('questionId', sql.BigInt, questionId)
      .query('SELECT * FROM ExamQuestions WHERE QuestionID = @questionId AND Type = \'essay\'');
    
    if (questionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Essay question not found' });
    }
    
    const question = questionResult.recordset[0];
    const options = JSON.parse(question.Options || '{}');
    
    if (!options.essayTemplate) {
      return res.status(404).json({ message: 'Essay template not found for this question' });
    }
    
    const essayTemplate = options.essayTemplate;
    const templateContent = essayTemplate.content;
    const keywords = essayTemplate.keywords || [];
    const minimumMatchPercentage = essayTemplate.minimumMatchPercentage || 60;
    
    // Simple algorithm to calculate match percentage
    let matchPercentage = 0;
    let keywordsMatched = 0;
    
    // Count keywords matched
    keywords.forEach(keyword => {
      if (answer.toLowerCase().includes(keyword.toLowerCase())) {
        keywordsMatched++;
      }
    });
    
    const keywordMatchPercentage = keywords.length > 0 
      ? (keywordsMatched / keywords.length) * 100 
      : 0;
    
    // Basic content similarity (very simplified)
    // In a real implementation, you'd use an NLP algorithm or more sophisticated text comparison
    const contentWords = templateContent.toLowerCase().split(/\s+/);
    const answerWords = answer.toLowerCase().split(/\s+/);
    let wordMatches = 0;
    
    contentWords.forEach(word => {
      if (word.length > 3 && answerWords.includes(word)) {
        wordMatches++;
      }
    });
    
    const contentMatchPercentage = contentWords.length > 0 
      ? (wordMatches / contentWords.length) * 100 
      : 0;
    
    // Combine both scores - 60% keyword match, 40% content match
    matchPercentage = (keywordMatchPercentage * 0.6) + (contentMatchPercentage * 0.4);
    
    // Calculate score based on match percentage
    let score = 0;
    if (matchPercentage >= minimumMatchPercentage) {
      // Scale score based on match percentage
      score = Math.min(100, Math.round((matchPercentage / 100) * question.Points));
    } else {
      // Below minimum match, proportionally reduce score
      score = Math.round((matchPercentage / minimumMatchPercentage) * question.Points * 0.6);
    }
    
    // Save to EssayAnswerAnalysis
    const analysisResult = await pool.request()
      .input('answerId', sql.BigInt, null) // This would come from the ExamAnswers table in a real implementation
      .input('matchPercentage', sql.Decimal(5, 2), matchPercentage)
      .input('keywordsMatched', sql.Int, keywordsMatched)
      .input('totalKeywords', sql.Int, keywords.length)
      .input('contentSimilarity', sql.Decimal(5, 2), contentMatchPercentage)
      .input('autoGradedScore', sql.Int, score)
      .query(`
        INSERT INTO EssayAnswerAnalysis (
          AnswerID, MatchPercentage, KeywordsMatched, TotalKeywords, 
          ContentSimilarity, AutoGradedScore, AnalyzedAt
        )
        OUTPUT INSERTED.AnalysisID
        VALUES (
          @answerId, @matchPercentage, @keywordsMatched, @totalKeywords,
          @contentSimilarity, @autoGradedScore, GETDATE()
        )
      `);
    
    return res.status(200).json({
      matchPercentage: matchPercentage,
      keywordsMatched: keywordsMatched,
      totalKeywords: keywords.length,
      contentSimilarity: contentMatchPercentage,
      score: score,
      maxPoints: question.Points,
      analysisId: analysisResult.recordset[0].AnalysisID
    });
  } catch (error) {
    console.error('Grade Essay Error:', error);
    return res.status(500).json({ message: 'Server error while grading essay' });
  }
});

module.exports = router; 