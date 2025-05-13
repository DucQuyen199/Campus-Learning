const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get student's feedback submissions
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT * FROM StudentFeedback
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get feedback details
router.get('/details/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    const result = await pool.request()
      .input('feedbackId', sql.BigInt, feedbackId)
      .query(`
        SELECT sf.*, u.FullName as RespondedByName
        FROM StudentFeedback sf
        LEFT JOIN Users u ON sf.RespondedBy = u.UserID
        WHERE sf.FeedbackID = @feedbackId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching feedback details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit a new feedback
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      title,
      content,
      type,
      department,
      isAnonymous
    } = req.body;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('title', sql.NVarChar(200), title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('type', sql.VarChar(50), type)
      .input('department', sql.NVarChar(100), department)
      .input('isAnonymous', sql.Bit, isAnonymous || 0)
      .query(`
        INSERT INTO StudentFeedback
        (UserID, Title, Content, Type, Department, IsAnonymous)
        VALUES
        (@userId, @title, @content, @type, @department, @isAnonymous);
        
        SELECT SCOPE_IDENTITY() AS FeedbackID
      `);
    
    const feedbackId = result.recordset[0].FeedbackID;
    
    res.json({ 
      message: 'Feedback submitted successfully',
      feedbackId 
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update feedback (can only update if not yet processed)
router.put('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const {
      title,
      content,
      type,
      department,
      isAnonymous
    } = req.body;
    
    // Check if feedback can be updated
    const checkResult = await pool.request()
      .input('feedbackId', sql.BigInt, feedbackId)
      .query(`
        SELECT Status FROM StudentFeedback
        WHERE FeedbackID = @feedbackId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    const { Status } = checkResult.recordset[0];
    
    if (Status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Cannot update feedback that is already being processed or has been responded to' 
      });
    }
    
    // Update feedback
    await pool.request()
      .input('feedbackId', sql.BigInt, feedbackId)
      .input('title', sql.NVarChar(200), title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('type', sql.VarChar(50), type)
      .input('department', sql.NVarChar(100), department)
      .input('isAnonymous', sql.Bit, isAnonymous)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE StudentFeedback
        SET Title = @title,
            Content = @content,
            Type = @type,
            Department = @department,
            IsAnonymous = @isAnonymous,
            UpdatedAt = @updatedAt
        WHERE FeedbackID = @feedbackId
      `);
    
    res.json({ message: 'Feedback updated successfully' });
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete feedback (can only delete if not yet processed)
router.delete('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    // Check if feedback can be deleted
    const checkResult = await pool.request()
      .input('feedbackId', sql.BigInt, feedbackId)
      .query(`
        SELECT Status FROM StudentFeedback
        WHERE FeedbackID = @feedbackId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    const { Status } = checkResult.recordset[0];
    
    if (Status !== 'Submitted') {
      return res.status(400).json({ 
        message: 'Cannot delete feedback that is already being processed or has been responded to' 
      });
    }
    
    // Delete feedback
    await pool.request()
      .input('feedbackId', sql.BigInt, feedbackId)
      .query(`
        DELETE FROM StudentFeedback
        WHERE FeedbackID = @feedbackId
      `);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 