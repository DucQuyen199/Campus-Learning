/*-----------------------------------------------------------------
* File: examController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool, sql, query } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Get all exams
exports.getAllExams = async (req, res) => {
  try {
    const userId = req.user.id;
    const exams = await query(`
      SELECT e.*, c.Title as CourseName,
             CASE WHEN ep.attemptsCount > 0 THEN 1 ELSE 0 END AS IsRegistered
      FROM Exams e
      LEFT JOIN Courses c ON e.CourseID = c.CourseID
      LEFT JOIN (
        SELECT ExamID, COUNT(*) as attemptsCount
        FROM ExamParticipants
        WHERE UserID = @userId
        GROUP BY ExamID
      ) ep ON e.ExamID = ep.ExamID
      ORDER BY e.StartTime DESC
    `, { userId });
    
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
  }
};

// Get upcoming exams
exports.getUpcomingExams = async (req, res) => {
  try {
    const exams = await query(`
      SELECT e.*, c.Title as CourseName
      FROM Exams e
      LEFT JOIN Courses c ON e.CourseID = c.CourseID
      WHERE e.StartTime > GETDATE()
      ORDER BY e.StartTime ASC
    `);
    
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error('Error fetching upcoming exams:', error);
    res.status(500).json({ success: false, message: 'Error fetching upcoming exams', error: error.message });
  }
};

// Get exam by ID
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert string parameter to integer
    const examIdInt = parseInt(id, 10);
    // Current user ID for registration check
    const userId = req.user.id;
    
    if (isNaN(examIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam ID. Must be a numeric value.' 
      });
    }
    
    // Fetch exam details with registration status and total participants
    const exam = await query(`
      SELECT e.*, c.Title as CourseName,
             CASE WHEN upr.ParticipantCount > 0 THEN 1 ELSE 0 END AS IsRegistered,
             COALESCE(total.ParticipantCount, 0) AS RegisteredCount
      FROM Exams e
      LEFT JOIN Courses c ON e.CourseID = c.CourseID
      LEFT JOIN (
        SELECT ExamID, COUNT(*) AS ParticipantCount
        FROM ExamParticipants
        WHERE UserID = @userId AND ExamID = @examId
        GROUP BY ExamID
      ) upr ON e.ExamID = upr.ExamID
      LEFT JOIN (
        SELECT ExamID, COUNT(*) AS ParticipantCount
        FROM ExamParticipants
        WHERE ExamID = @examId
        GROUP BY ExamID
      ) total ON e.ExamID = total.ExamID
      WHERE e.ExamID = @examId
    `, { examId: examIdInt, userId });
    
    if (!exam || exam.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    // Get questions for this exam
    const questions = await query(`
      SELECT * FROM ExamQuestions
      WHERE ExamID = @examId
      ORDER BY OrderIndex
    `, { examId: examIdInt });
    
    res.status(200).json({ 
      success: true, 
      data: { 
        ...exam[0],
        questions
      } 
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam', error: error.message });
  }
};

// Register for exam
exports.registerForExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Convert string parameter to integer
    const examIdInt = parseInt(examId, 10);
    
    if (isNaN(examIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam ID. Must be a numeric value.' 
      });
    }
    
    // Get exam details to check if retakes are allowed
    const examDetails = await query(`
      SELECT ExamID, Title, AllowRetakes, MaxRetakes 
      FROM Exams
      WHERE ExamID = @examId
    `, { examId: examIdInt });
    
    if (!examDetails || examDetails.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    const exam = examDetails[0];
    
    // Check if already registered
    const existing = await query(`
      SELECT ParticipantID, Status, Score
      FROM ExamParticipants
      WHERE ExamID = @examId AND UserID = @userId
      ORDER BY ParticipantID DESC
    `, { examId: examIdInt, userId });
    
    // If there are existing registrations
    if (existing && existing.length > 0) {
      // Check if retakes are allowed
      if (!exam.AllowRetakes) {
        return res.status(400).json({ success: false, message: 'Already registered for this exam and retakes are not allowed' });
      }
      
      // Check if maximum retakes have been reached
      if (exam.MaxRetakes > 0 && existing.length >= exam.MaxRetakes + 1) {
        return res.status(400).json({ 
          success: false, 
          message: `Maximum number of attempts (${exam.MaxRetakes + 1}) has been reached` 
        });
      }
      
      // If the latest attempt is still in progress, don't allow a new one
      const latestAttempt = existing[0];
      if (latestAttempt.Status === 'registered' || latestAttempt.Status === 'in_progress') {
        return res.status(400).json({ 
          success: false, 
          message: 'You have an ongoing attempt for this exam. Please complete it first.' 
        });
      }
    }
    
    // Register user for a new attempt
    await query(`
      INSERT INTO ExamParticipants (ExamID, UserID, Status)
      VALUES (@examId, @userId, 'registered')
    `, { examId: examIdInt, userId });
    
    res.status(201).json({ 
      success: true, 
      message: 'Successfully registered for exam',
      attemptsUsed: existing ? existing.length + 1 : 1,
      maxAttempts: exam.AllowRetakes ? (exam.MaxRetakes > 0 ? exam.MaxRetakes + 1 : 'unlimited') : 1
    });
  } catch (error) {
    console.error('Error registering for exam:', error);
    res.status(500).json({ success: false, message: 'Error registering for exam', error: error.message });
  }
};

// Start exam session
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    // Convert string parameter to integer
    const examIdInt = parseInt(examId, 10);
    
    if (isNaN(examIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam ID. Must be a numeric value.' 
      });
    }
    
    // Check registration
    const participant = await query(`
      SELECT * FROM ExamParticipants
      WHERE ExamID = @examId AND UserID = @userId
    `, { examId: examIdInt, userId });
    
    if (!participant || participant.length === 0) {
      return res.status(404).json({ success: false, message: 'Not registered for this exam' });
    }
    
    // If already started
    if (participant[0].StartedAt) {
      return res.status(200).json({ 
        success: true, 
        message: 'Exam already started',
        participantId: participant[0].ParticipantID
      });
    }
    
    // Update status and start time
    await query(`
      UPDATE ExamParticipants
      SET Status = 'in_progress', StartedAt = GETDATE()
      WHERE ParticipantID = @participantId
    `, { participantId: participant[0].ParticipantID });
    
    // Log exam start
    await query(`
      INSERT INTO ExamMonitoringLogs (ParticipantID, EventType, EventData)
      VALUES (@participantId, 'exam_start', '{"device": "web"}')
    `, { participantId: participant[0].ParticipantID });
    
    res.status(200).json({ 
      success: true, 
      message: 'Exam started successfully',
      participantId: participant[0].ParticipantID 
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ success: false, message: 'Error starting exam', error: error.message });
  }
};

// Submit exam answer
exports.submitAnswer = async (req, res) => {
  try {
    const { participantId, questionId } = req.params;
    const { answer } = req.body;

    // Save the answer
    await query(`
      INSERT INTO ExamAnswers (ParticipantID, QuestionID, Answer, SubmittedAt)
      VALUES (@participantId, @questionId, @answer, GETDATE())
    `, {
      participantId: parseInt(participantId, 10),
      questionId: parseInt(questionId, 10),
      answer
    });

    res.status(200).json({ success: true, message: 'Answer submitted successfully' });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ success: false, message: 'Failed to submit answer' });
  }
};

// Grade exam answer
exports.gradeAnswer = async (req, res) => {
  try {
    const { examId, questionId, participantId: paramParticipantId } = req.params;
    const { answer, participantId: bodyParticipantId } = req.body;
    
    // Validate examId and questionId
    const examIdInt = parseInt(examId, 10);
    const questionIdInt = parseInt(questionId, 10);
    
    if (isNaN(examIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam ID. Must be a numeric value.' 
      });
    }
    
    if (isNaN(questionIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid question ID. Must be a numeric value.' 
      });
    }
    
    // Prioritize participantId from URL params, then from request body
    const rawParticipantId = paramParticipantId || bodyParticipantId;
    let participantId;
    
    if (rawParticipantId) {
      // If participantId was provided, use it directly
      participantId = parseInt(rawParticipantId, 10);
      
      if (isNaN(participantId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid participant ID. Must be a numeric value.' 
        });
      }
    } else {
      // Otherwise, find the participantId for this user and exam
      const participants = await query(`
        SELECT ParticipantID FROM ExamParticipants 
        WHERE UserID = @userId AND ExamID = @examId
      `, {
        userId: req.user.id,
        examId: examIdInt
      });
      
      if (!participants || participants.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participant not found' 
        });
      }
      
      participantId = participants[0].ParticipantID;
    }
    
    // Get the question and its template
    const questions = await query(`
      SELECT q.*, t.TemplateID, t.Content as TemplateContent, 
             t.Keywords, q.CorrectAnswer
      FROM ExamQuestions q
      LEFT JOIN ExamAnswerTemplates t ON q.QuestionID = t.QuestionID
      WHERE q.QuestionID = @questionId AND q.ExamID = @examId
    `, { 
      questionId: questionIdInt, 
      examId: examIdInt 
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    const question = questions[0];
    
    // For multiple choice questions, compare directly with correct answer
    if (question.Type === 'multiple_choice') {
      const isCorrect = answer === question.CorrectAnswer;
      const score = isCorrect ? question.Points : 0;
      
      // Save the answer with score
      await query(`
        INSERT INTO ExamAnswers (
          ParticipantID, QuestionID, Answer, 
          IsCorrect, Score, SubmittedAt
        )
        VALUES (
          @participantId, @questionId, @answer,
          @isCorrect, @score, GETDATE()
        )
      `, {
        participantId,
        questionId: questionIdInt,
        answer,
        isCorrect,
        score
      });
      
      return res.status(200).json({
        success: true,
        data: {
          score: score,
          maxPoints: question.Points,
          isCorrect: isCorrect,
          feedback: isCorrect ? 'Correct answer' : 'Incorrect answer',
          similarity: isCorrect ? 100 : 0
        }
      });
    }
    
    // For essay questions, use template comparison
    if (question.Type === 'essay') {
      // Use TemplateContent if available, otherwise fall back to CorrectAnswer
      const templateContent = question.TemplateContent || question.CorrectAnswer;
      
      if (!templateContent) {
        console.warn(`No template or correct answer available for question ${questionIdInt}`);
        return res.status(404).json({ 
          success: false, 
          message: 'No answer template found for this question' 
        });
      }
      
      // Calculate similarity with template
      const similarity = calculateSimilarity(answer, templateContent, question.Keywords);
      
      // Calculate score based on similarity
      const score = Math.round((similarity.totalSimilarity / 100) * question.Points);
      
      // Save the answer with analysis
      const result = await query(`
        INSERT INTO ExamAnswers (
          ParticipantID, QuestionID, Answer, 
          Score, SubmittedAt
        )
        OUTPUT INSERTED.AnswerID
        VALUES (
          @participantId, @questionId, @answer,
          @score, GETDATE()
        )
      `, {
        participantId,
        questionId: questionIdInt,
        answer,
        score
      });
      
      const answerId = result[0].AnswerID;
      
      // Save analysis details
      await query(`
        INSERT INTO EssayAnswerAnalysis (
          AnswerID, MatchPercentage, KeywordsMatched,
          TotalKeywords, ContentSimilarity, AnalyzedAt
        )
        VALUES (
          @answerId, @matchPercentage, @keywordsMatched,
          @totalKeywords, @contentSimilarity, GETDATE()
        )
      `, {
        answerId,
        matchPercentage: similarity.totalSimilarity,
        keywordsMatched: similarity.keywordsMatched,
        totalKeywords: similarity.totalKeywords,
        contentSimilarity: similarity.contentSimilarity
      });
      
      // Format the similarity data properly for frontend processing
      const similarityData = {
        totalSimilarity: Number(similarity.totalSimilarity.toFixed(2)),
        keywordsMatched: similarity.keywordsMatched,
        totalKeywords: similarity.totalKeywords,
        contentSimilarity: Number(similarity.contentSimilarity.toFixed(2))
      };
      
      return res.status(200).json({
        success: true,
        data: {
          score: score,
          maxPoints: question.Points,
          similarity: similarityData.totalSimilarity,
          similarityDetails: similarityData,
          feedback: 'Answer graded based on template comparison'
        }
      });
    }
    
    // For other question types or if no template exists
    const score = 0; // Default score if no grading method available
    
    // Save the answer
    await query(`
      INSERT INTO ExamAnswers (
        ParticipantID, QuestionID, Answer, 
        Score, SubmittedAt
      )
      VALUES (
        @participantId, @questionId, @answer,
        @score, GETDATE()
      )
    `, {
      participantId,
      questionId: questionIdInt,
      answer,
      score
    });
    
    return res.status(200).json({
      success: true,
      data: {
        score: score,
        maxPoints: question.Points,
        similarity: 0,
        feedback: 'Answer saved but requires manual grading'
      }
    });
    
  } catch (error) {
    console.error('Error grading answer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error grading answer',
      error: error.message 
    });
  }
};

// Log fullscreen exit
exports.logFullscreenExit = async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Convert string parameter to integer
    const participantIdInt = parseInt(participantId, 10);
    
    if (isNaN(participantIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid participant ID. Must be a numeric value.' 
      });
    }
    
    // Count previous fullscreen exits for this participant
    const exitCountResult = await query(`
      SELECT COUNT(*) as count 
      FROM ExamMonitoringLogs 
      WHERE ParticipantID = @participantId AND EventType = 'full_screen_exit'
    `, { participantId: participantIdInt });
    
    const exitNumber = exitCountResult[0].count + 1;
    
    // Any fullscreen exit is now considered cheating
    // Immediately mark the participant as caught cheating
    await query(`
      UPDATE ExamParticipants 
      SET Status = 'cheating', 
          PenaltyPercentage = 100, 
          CompletedAt = GETDATE(),
          CheatDetectedAt = GETDATE()
      WHERE ParticipantID = @participantId
    `, { 
      participantId: participantIdInt
    });
    
    // Log the event with cheating information
    const eventData = JSON.stringify({
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      exitNumber: exitNumber,
      cheatingDetected: true,
      cheatingType: 'fullscreen_exit'
    });
    
    // Log as suspicious_activity instead of cheating_detected (which is not in the allowed list)
    await query(`
      INSERT INTO ExamMonitoringLogs (ParticipantID, EventType, EventData)
      VALUES (@participantId, 'suspicious_activity', @eventData)
    `, {
      participantId: participantIdInt,
      eventData: eventData
    });
    
    // Also add a regular fullscreen exit log
    await query(`
      INSERT INTO ExamMonitoringLogs (ParticipantID, EventType, EventData)
      VALUES (@participantId, 'full_screen_exit', @eventData)
    `, {
      participantId: participantIdInt,
      eventData: eventData
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Cheating detected: fullscreen exit',
      exitNumber: exitNumber,
      cheatingDetected: true,
      examTerminated: true,
      redirectTo: '/exam-results/' + participantId
    });
  } catch (error) {
    console.error('Error logging fullscreen exit:', error);
    res.status(500).json({ success: false, message: 'Error logging event', error: error.message });
  }
};

// Log fullscreen return
exports.logFullscreenReturn = async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Convert string parameter to integer
    const participantIdInt = parseInt(participantId, 10);
    
    if (isNaN(participantIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid participant ID. Must be a numeric value.' 
      });
    }
    
    // Check if the user is banned due to excessive fullscreen exits
    const participantResult = await query(`
      SELECT Status, PenaltyPercentage 
      FROM ExamParticipants 
      WHERE ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    if (participantResult.length > 0 && participantResult[0].Status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'You have been banned from this exam due to excessive fullscreen exits',
        banned: true,
        penaltyPercentage: participantResult[0].PenaltyPercentage
      });
    }
    
    // Log the event
    const eventData = JSON.stringify({
      timestamp: new Date(),
      userAgent: req.headers['user-agent']
    });
    
    await query(`
      INSERT INTO ExamMonitoringLogs (ParticipantID, EventType, EventData)
      VALUES (@participantId, 'full_screen_return', @eventData)
    `, { 
      participantId: participantIdInt,
      eventData: eventData
    });
    
    // Return the current penalty status
    res.status(200).json({
      success: true,
      message: 'Fullscreen return logged',
      penaltyPercentage: participantResult.length > 0 ? participantResult[0].PenaltyPercentage || 0 : 0,
      banned: false
    });
  } catch (error) {
    console.error('Error logging fullscreen return:', error);
    res.status(500).json({ success: false, message: 'Error logging event', error: error.message });
  }
};

// Complete exam and calculate score
exports.completeExam = async (req, res) => {
  try {
    const { participantId, examId: urlExamId } = req.params;
    
    // Validate participantId
    const participantIdInt = parseInt(participantId, 10);
    if (isNaN(participantIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid participant ID. Must be a numeric value.' 
      });
    }
    
    // Get exam details to know total points and verify examId
    const participants = await query(`
      SELECT ep.*, e.TotalPoints, e.ExamID, e.Title as ExamTitle
      FROM ExamParticipants ep 
      JOIN Exams e ON ep.ExamID = e.ExamID 
      WHERE ep.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    if (!participants || participants.length === 0) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    
    const participant = participants[0];
    const examId = participant.ExamID;
    
    // Validate the examId from URL if provided, but only if it's actually provided
    if (urlExamId) {
      const urlExamIdInt = parseInt(urlExamId, 10);
      if (isNaN(urlExamIdInt)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid exam ID in URL. Must be a numeric value.' 
        });
      }
      
      if (urlExamIdInt !== examId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Exam ID mismatch between URL and participant record' 
        });
      }
    }
    
    // Update participant status
    await query(`
      UPDATE ExamParticipants 
      SET Status = 'completed', 
          CompletedAt = GETDATE(),
          TimeSpent = DATEDIFF(MINUTE, StartedAt, GETDATE())
      WHERE ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    // Get all answers for this participant
    const answers = await query(`
      SELECT ea.*, q.Points as QuestionPoints, q.Type as QuestionType,
             q.Content as QuestionContent, q.CorrectAnswer
      FROM ExamAnswers ea
      JOIN ExamQuestions q ON ea.QuestionID = q.QuestionID
      WHERE ea.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    // Calculate total score
    let totalScore = 0;
    let maxScore = 0;
    
    // Check if score was provided in the request body
    // This allows the client to send the calculated score
    let scoreProvided = false;
    
    if (req.body && (req.body.score !== undefined || req.body.finalScore !== undefined)) {
      scoreProvided = true;
      totalScore = parseFloat(req.body.score !== undefined ? req.body.score : req.body.finalScore);
      
      // Ensure score is a valid number
      if (isNaN(totalScore)) {
        scoreProvided = false;
        console.warn('Invalid score provided in request body, calculating from answers');
      }
    }
    
    // If score was not provided or was invalid, calculate it
    if (!scoreProvided) {
      answers.forEach(answer => {
        maxScore += answer.QuestionPoints || 0;
        
        if (answer.Score !== null) {
          totalScore += answer.Score;
        } else if (answer.QuestionType === 'multiple_choice' && answer.CorrectAnswer) {
          // Auto-grade multiple choice if not already graded
          const isCorrect = answer.Answer === answer.CorrectAnswer;
          totalScore += isCorrect ? answer.QuestionPoints : 0;
        }
      });
    } else {
      // Calculate maxScore even if score was provided
      answers.forEach(answer => {
        maxScore += answer.QuestionPoints || 0;
      });
      
      console.log(`Using provided score: ${totalScore} instead of calculating from answers`);
    }
    
    // Update participant score
    await query(`
      UPDATE ExamParticipants 
      SET Score = @score
      WHERE ParticipantID = @participantId
    `, { 
      participantId: participantIdInt,
      score: totalScore 
    });
    
    // If client provided detailed feedback for each question, store it
    if (req.body && req.body.feedbacks && Array.isArray(req.body.feedbacks)) {
      try {
        const feedbacks = req.body.feedbacks;
        
        // Store feedback for each question
        for (const feedback of feedbacks) {
          if (feedback.questionId && feedback.score !== undefined) {
            // Update the score for this question's answer
            await query(`
              UPDATE ExamAnswers
              SET Score = @score
              WHERE ParticipantID = @participantId AND QuestionID = @questionId
            `, {
              participantId: participantIdInt,
              questionId: feedback.questionId,
              score: feedback.score
            });
          }
        }
        
        console.log(`Updated scores for ${feedbacks.length} question answers`);
      } catch (feedbackError) {
        console.error('Error updating individual question scores:', feedbackError);
        // Continue even if feedback storage fails
      }
    }
    
    // Return success response with participant information
    return res.status(200).json({
      success: true,
      message: 'Exam completed successfully',
      data: {
        participantId: participantIdInt,
        examId: examId,
        examTitle: participant.ExamTitle,
        totalScore: totalScore,
        maxScore: maxScore,
        totalAnswers: answers.length,
        answers: answers.map(a => ({
          questionId: a.QuestionID,
          questionContent: a.QuestionContent,
          answer: a.Answer,
          score: a.Score,
          maxPoints: a.QuestionPoints
        }))
      }
    });
  } catch (error) {
    console.error('Error completing exam:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error completing exam', 
      error: error.message 
    });
  }
};

// Get exam results
exports.getExamResults = async (req, res) => {
  try {
    const { participantId } = req.params;
    const participantIdInt = parseInt(participantId, 10);
    
    // Get participant details with exam info
    const participants = await query(`
      SELECT ep.*, e.Title as ExamTitle, e.Description, e.TotalPoints, 
             e.PassingScore, e.ExamID, e.Type as ExamType
      FROM ExamParticipants ep 
      JOIN Exams e ON ep.ExamID = e.ExamID 
      WHERE ep.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    if (!participants || participants.length === 0) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    
    const participant = participants[0];
    
    // Get all answers with scores for this participant
    const answers = await query(`
      SELECT ea.*, q.Content as QuestionContent, q.Points as QuestionPoints, 
             q.QuestionID, q.Type as QuestionType
      FROM ExamAnswers ea
      JOIN ExamQuestions q ON ea.QuestionID = q.QuestionID
      WHERE ea.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    // Get analysis details for more info
    const analysisDetails = await query(`
      SELECT eaa.*, ea.QuestionID
      FROM EssayAnswerAnalysis eaa
      JOIN ExamAnswers ea ON eaa.AnswerID = ea.AnswerID
      WHERE ea.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    // Combine answers with analysis details
    const answersWithAnalysis = answers.map(answer => {
      const analysis = analysisDetails.find(a => a.AnswerID === answer.AnswerID) || {};
      return {
        ...answer,
        analysis
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        participant,
        answers: answersWithAnalysis
      }
    });
  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({ success: false, message: 'Error fetching exam results', error: error.message });
  }
};

// Helper function to calculate similarity between answers
function calculateSimilarity(answer, template, keywords) {
  if (!answer || !template) {
    return {
      totalSimilarity: 0,
      keywordsMatched: 0,
      totalKeywords: keywords?.length || 0,
      contentSimilarity: 0
    };
  }

  // Convert template to string if it's not already
  const templateStr = String(template);
  
  // Normalize the keywords if it's a string
  let keywordArray = [];
  if (keywords) {
    if (typeof keywords === 'string') {
      try {
        // Try parsing as JSON
        keywordArray = JSON.parse(keywords);
      } catch (e) {
        // If not JSON, split by commas
        keywordArray = keywords.split(',').map(k => k.trim());
      }
    } else if (Array.isArray(keywords)) {
      keywordArray = keywords;
    }
  }
  
  // Extract key phrases from template (lines that look important)
  const templateLines = templateStr.split('\n').filter(line => line.trim());
  const keyPhrases = templateLines
    .filter(line => line.includes('-') || line.includes(':') || line.match(/^\d+\./) || line.length > 20)
    .map(line => line.replace(/^[-\d\.\s]+/, '').trim());
  
  // Add these key phrases to our keywords
  keywordArray = [...keywordArray, ...keyPhrases];
  
  // Count matched keywords with more intelligent matching
  const keywordsMatched = countKeywordsMatched(answer, keywordArray);
  const totalKeywords = keywordArray.length;
  
  // Calculate keyword score with higher weight for exact matches
  const keywordScore = totalKeywords > 0 ? (keywordsMatched / totalKeywords) * 100 : 0;
  
  // Calculate content similarity using paragraph structure and key concepts
  const contentSimilarity = calculateContentSimilarity(answer, templateStr);
  
  // Calculate total similarity with higher weight on keywords for essay questions
  const totalSimilarity = (keywordScore * 0.7) + (contentSimilarity * 0.3);
  
  console.log(`Grading result:
    - Template length: ${templateStr.length} characters
    - Answer length: ${answer.length} characters
    - Keywords matched: ${keywordsMatched}/${totalKeywords}
    - Keyword score: ${keywordScore.toFixed(2)}%
    - Content similarity: ${contentSimilarity.toFixed(2)}%
    - Total similarity: ${totalSimilarity.toFixed(2)}%`);
  
  return {
    totalSimilarity,
    keywordsMatched,
    totalKeywords,
    contentSimilarity
  };
}

// Helper function to count matched keywords
function countKeywordsMatched(answer, keywords) {
  if (!answer || !keywords || keywords.length === 0) return 0;
  
  // Normalize answer text
  const normalizedAnswer = answer.toLowerCase();
  let matchCount = 0;
  
  for (const keyword of keywords) {
    if (!keyword) continue;
    
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // For short keywords (1-2 words), check for exact matches
    if (normalizedKeyword.split(/\s+/).length <= 2) {
      // Match word boundaries for single words
      const regex = new RegExp(`\\b${normalizedKeyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(normalizedAnswer)) {
        matchCount++;
        continue;
      }
    }
    
    // For longer phrases, check if most of the words appear in order
    if (normalizedKeyword.length > 10) {
      const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 3);
      if (keywordWords.length > 0) {
        // Calculate what percentage of important words are present
        const matchedWords = keywordWords.filter(word => 
          normalizedAnswer.includes(word)
        ).length;
        
        // If 70% or more of key words match, count it as a match
        if (matchedWords / keywordWords.length >= 0.7) {
          matchCount++;
          continue;
        }
      }
    }
    
    // Direct inclusion check as fallback
    if (normalizedAnswer.includes(normalizedKeyword)) {
      matchCount++;
    }
  }
  
  return matchCount;
}

// Helper function to calculate content similarity
function calculateContentSimilarity(answer, template) {
  if (!answer || !template) return 0;
  
  // Normalize and split into sentences
  const normalizeText = text => text.toLowerCase().replace(/\s+/g, ' ').trim();
  const getSentences = text => text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const normalizedAnswer = normalizeText(answer);
  const normalizedTemplate = normalizeText(template);
  
  // Get unique words (excluding common words)
  const commonWords = ['là', 'và', 'của', 'trong', 'với', 'các', 'có', 'không', 'những', 'được', 'về', 'theo', 'từ', 'cho', 'bởi', 'đến', 'hoặc', 'để'];
  const getSignificantWords = text => {
    const words = text.split(/\s+/).filter(word => 
      word.length > 3 && !commonWords.includes(word)
    );
    return new Set(words);
  };
  
  const answerWords = getSignificantWords(normalizedAnswer);
  const templateWords = getSignificantWords(normalizedTemplate);
  
  // Intersection of significant words
  const commonWords_count = [...answerWords].filter(word => templateWords.has(word)).length;
  
  // Calculate similarity based on word overlap
  const wordSimilarity = Math.min(
    (commonWords_count / Math.max(answerWords.size, 1)) * 100,
    (commonWords_count / Math.max(templateWords.size, 1)) * 100
  );
  
  // Analyze sentence structure for similarity in concepts
  const answerSentences = getSentences(normalizedAnswer);
  const templateSentences = getSentences(normalizedTemplate);
  
  // Match sentences based on similarity
  let sentenceMatches = 0;
  for (const answerSent of answerSentences) {
    for (const templateSent of templateSentences) {
      // Calculate how many significant words match between sentences
      const answerSentWords = getSignificantWords(answerSent);
      const templateSentWords = getSignificantWords(templateSent);
      
      if (answerSentWords.size > 0 && templateSentWords.size > 0) {
        const matchedWords = [...answerSentWords].filter(word => 
          templateSentWords.has(word)
        ).length;
        
        // If at least 40% of words match in a sentence, count it as a sentence match
        if (matchedWords / Math.max(answerSentWords.size, templateSentWords.size) >= 0.4) {
          sentenceMatches++;
          break; // Move to next answer sentence
        }
      }
    }
  }
  
  // Calculate sentence similarity score (percentage of matched sentences)
  const sentenceSimilarity = (sentenceMatches / Math.max(answerSentences.length, 1)) * 100;
  
  // Combine word and sentence similarity for overall content similarity
  return (wordSimilarity * 0.6) + (sentenceSimilarity * 0.4);
}
