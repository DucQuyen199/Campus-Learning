const { pool, sql, query } = require('./config/db');

async function updateExamRetakes() {
  try {
    console.log('Connecting to database...');
    
    // Update exam 5 (and any other exams you want to test with)
    const result = await query(`
      UPDATE Exams
      SET AllowRetakes = 1, MaxRetakes = 3
      WHERE ExamID IN (5, 6)
    `);
    
    console.log('Update successful:', result);
    
    // Verify the changes
    const exams = await query(`
      SELECT ExamID, Title, AllowRetakes, MaxRetakes
      FROM Exams
      WHERE ExamID IN (5, 6)
    `);
    
    console.log('Updated exams:', exams);
    
    // Cleanup participant attempts to allow for new registrations (optional)
    const cleanupResult = await query(`
      DELETE FROM ExamParticipants
      WHERE ExamID IN (5, 6) 
      AND Status NOT IN ('completed', 'reviewed')
    `);
    
    console.log('Cleaned up in-progress attempts:', cleanupResult);
    
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating exams:', error);
  } finally {
    try {
      await pool.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
}

updateExamRetakes(); 