const { sql, poolPromise } = require('../config/database');

// Get all competitions
exports.getCompetitions = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM Competitions 
      WHERE DeletedAt IS NULL 
      ORDER BY CreatedAt DESC
    `);
    
    res.json({ 
      success: true, 
      competitions: result.recordset 
    });
  } catch (error) {
    console.error('Error getting competitions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching competitions', 
      error: error.message 
    });
  }
};

// Get a competition by ID
exports.getCompetition = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await poolPromise;
    
    // Get competition details
    const competitionResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT * FROM Competitions 
        WHERE CompetitionID = @id AND DeletedAt IS NULL
      `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    // Get problems for the competition
    const problemsResult = await pool.request()
      .input('competitionId', sql.BigInt, id)
      .query(`
        SELECT * FROM CompetitionProblems 
        WHERE CompetitionID = @competitionId
        ORDER BY Points DESC
      `);
    
    // Get participants for the competition
    const participantsResult = await pool.request()
      .input('competitionId', sql.BigInt, id)
      .query(`
        SELECT cp.*, u.FullName, u.Email, u.Avatar
        FROM CompetitionParticipants cp
        JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.CompetitionID = @competitionId
        ORDER BY cp.Score DESC
      `);
    
    res.json({
      success: true,
      competition: competitionResult.recordset[0],
      problems: problemsResult.recordset,
      participants: participantsResult.recordset
    });
  } catch (error) {
    console.error(`Error getting competition ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching competition', 
      error: error.message 
    });
  }
};

// Create a competition
exports.createCompetition = async (req, res) => {
  const competitionData = req.body;
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Title', sql.NVarChar(200), competitionData.Title)
      .input('Description', sql.NText, competitionData.Description)
      .input('StartTime', sql.DateTime, new Date(competitionData.StartTime))
      .input('EndTime', sql.DateTime, new Date(competitionData.EndTime))
      .input('Duration', sql.Int, competitionData.Duration)
      .input('Difficulty', sql.NVarChar(20), competitionData.Difficulty)
      .input('Status', sql.NVarChar(20), competitionData.Status || 'draft')
      .input('MaxParticipants', sql.Int, competitionData.MaxParticipants || 100)
      .input('PrizePool', sql.Decimal(12, 2), competitionData.PrizePool || 0)
      .input('OrganizedBy', sql.BigInt, competitionData.OrganizedBy || null)
      .input('ThumbnailUrl', sql.NVarChar(500), competitionData.ThumbnailUrl || null)
      .input('CoverImageURL', sql.NVarChar(500), competitionData.CoverImageURL || null)
      .query(`
        INSERT INTO Competitions (
          Title, Description, StartTime, EndTime, Duration, 
          Difficulty, Status, MaxParticipants, PrizePool, 
          OrganizedBy, ThumbnailUrl, CoverImageURL, CreatedAt, UpdatedAt
        )
        VALUES (
          @Title, @Description, @StartTime, @EndTime, @Duration,
          @Difficulty, @Status, @MaxParticipants, @PrizePool,
          @OrganizedBy, @ThumbnailUrl, @CoverImageURL, GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS CompetitionID;
      `);
    
    const newCompetitionId = result.recordset[0].CompetitionID;
    
    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      competitionId: newCompetitionId
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating competition', 
      error: error.message 
    });
  }
};

// Update a competition
exports.updateCompetition = async (req, res) => {
  const { id } = req.params;
  const competitionData = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT CompetitionID FROM Competitions 
        WHERE CompetitionID = @id AND DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    await pool.request()
      .input('id', sql.BigInt, id)
      .input('Title', sql.NVarChar(200), competitionData.Title)
      .input('Description', sql.NText, competitionData.Description)
      .input('StartTime', sql.DateTime, new Date(competitionData.StartTime))
      .input('EndTime', sql.DateTime, new Date(competitionData.EndTime))
      .input('Duration', sql.Int, competitionData.Duration)
      .input('Difficulty', sql.NVarChar(20), competitionData.Difficulty)
      .input('Status', sql.NVarChar(20), competitionData.Status)
      .input('MaxParticipants', sql.Int, competitionData.MaxParticipants)
      .input('PrizePool', sql.Decimal(12, 2), competitionData.PrizePool)
      .input('OrganizedBy', sql.BigInt, competitionData.OrganizedBy)
      .input('ThumbnailUrl', sql.NVarChar(500), competitionData.ThumbnailUrl)
      .input('CoverImageURL', sql.NVarChar(500), competitionData.CoverImageURL)
      .query(`
        UPDATE Competitions
        SET 
          Title = @Title,
          Description = @Description,
          StartTime = @StartTime,
          EndTime = @EndTime,
          Duration = @Duration,
          Difficulty = @Difficulty,
          Status = @Status,
          MaxParticipants = @MaxParticipants,
          PrizePool = @PrizePool,
          OrganizedBy = @OrganizedBy,
          ThumbnailUrl = @ThumbnailUrl,
          CoverImageURL = @CoverImageURL,
          UpdatedAt = GETDATE()
        WHERE CompetitionID = @id
      `);
    
    res.json({
      success: true,
      message: 'Competition updated successfully'
    });
  } catch (error) {
    console.error(`Error updating competition ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating competition', 
      error: error.message 
    });
  }
};

// Delete a competition
exports.deleteCompetition = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT CompetitionID FROM Competitions 
        WHERE CompetitionID = @id AND DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    // Soft delete
    await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        UPDATE Competitions
        SET DeletedAt = GETDATE()
        WHERE CompetitionID = @id
      `);
    
    res.json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting competition ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting competition', 
      error: error.message 
    });
  }
};

// Get problems for a competition
exports.getProblems = async (req, res) => {
  const { competitionId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT * FROM CompetitionProblems 
        WHERE CompetitionID = @competitionId
        ORDER BY Points DESC
      `);
    
    res.json({
      success: true,
      problems: result.recordset
    });
  } catch (error) {
    console.error(`Error getting problems for competition ${competitionId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching problems', 
      error: error.message 
    });
  }
};

// Get a specific problem
exports.getProblem = async (req, res) => {
  const { competitionId, problemId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .query(`
        SELECT * FROM CompetitionProblems 
        WHERE CompetitionID = @competitionId AND ProblemID = @problemId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }
    
    res.json({
      success: true,
      problem: result.recordset[0]
    });
  } catch (error) {
    console.error(`Error getting problem ${problemId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching problem', 
      error: error.message 
    });
  }
};

// Create a problem
exports.createProblem = async (req, res) => {
  const { competitionId } = req.params;
  const problemData = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT CompetitionID FROM Competitions 
        WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    const result = await pool.request()
      .input('CompetitionID', sql.BigInt, competitionId)
      .input('Title', sql.NVarChar(200), problemData.Title)
      .input('Description', sql.NText, problemData.Description)
      .input('Difficulty', sql.NVarChar(20), problemData.Difficulty)
      .input('Points', sql.Int, problemData.Points)
      .input('TimeLimit', sql.Int, problemData.TimeLimit)
      .input('MemoryLimit', sql.Int, problemData.MemoryLimit)
      .input('InputFormat', sql.NText, problemData.InputFormat)
      .input('OutputFormat', sql.NText, problemData.OutputFormat)
      .input('Constraints', sql.NText, problemData.Constraints)
      .input('SampleInput', sql.NText, problemData.SampleInput)
      .input('SampleOutput', sql.NText, problemData.SampleOutput)
      .input('Explanation', sql.NText, problemData.Explanation)
      .input('ImageURL', sql.NVarChar(500), problemData.ImageURL)
      .input('StarterCode', sql.NVarChar(sql.MAX), problemData.StarterCode)
      .input('Tags', sql.NVarChar(500), problemData.Tags)
      .input('Instructions', sql.NVarChar(sql.MAX), problemData.Instructions)
      .query(`
        INSERT INTO CompetitionProblems (
          CompetitionID, Title, Description, Difficulty, Points, 
          TimeLimit, MemoryLimit, InputFormat, OutputFormat, 
          Constraints, SampleInput, SampleOutput, Explanation, 
          CreatedAt, UpdatedAt, ImageURL, StarterCode, Tags, Instructions
        )
        VALUES (
          @CompetitionID, @Title, @Description, @Difficulty, @Points,
          @TimeLimit, @MemoryLimit, @InputFormat, @OutputFormat, 
          @Constraints, @SampleInput, @SampleOutput, @Explanation,
          GETDATE(), GETDATE(), @ImageURL, @StarterCode, @Tags, @Instructions
        );
        
        SELECT SCOPE_IDENTITY() AS ProblemID;
      `);
    
    const newProblemId = result.recordset[0].ProblemID;
    
    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problemId: newProblemId
    });
  } catch (error) {
    console.error(`Error creating problem for competition ${competitionId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating problem', 
      error: error.message 
    });
  }
};

// Update a problem
exports.updateProblem = async (req, res) => {
  const { competitionId, problemId } = req.params;
  const problemData = req.body;
  
  try {
    const pool = await poolPromise;
    
    // Check if problem exists
    const checkResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .query(`
        SELECT ProblemID FROM CompetitionProblems 
        WHERE CompetitionID = @competitionId AND ProblemID = @problemId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }
    
    await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .input('Title', sql.NVarChar(200), problemData.Title)
      .input('Description', sql.NText, problemData.Description)
      .input('Difficulty', sql.NVarChar(20), problemData.Difficulty)
      .input('Points', sql.Int, problemData.Points)
      .input('TimeLimit', sql.Int, problemData.TimeLimit)
      .input('MemoryLimit', sql.Int, problemData.MemoryLimit)
      .input('InputFormat', sql.NText, problemData.InputFormat)
      .input('OutputFormat', sql.NText, problemData.OutputFormat)
      .input('Constraints', sql.NText, problemData.Constraints)
      .input('SampleInput', sql.NText, problemData.SampleInput)
      .input('SampleOutput', sql.NText, problemData.SampleOutput)
      .input('Explanation', sql.NText, problemData.Explanation)
      .input('ImageURL', sql.NVarChar(500), problemData.ImageURL)
      .input('StarterCode', sql.NVarChar(sql.MAX), problemData.StarterCode)
      .input('Tags', sql.NVarChar(500), problemData.Tags)
      .input('Instructions', sql.NVarChar(sql.MAX), problemData.Instructions)
      .query(`
        UPDATE CompetitionProblems
        SET 
          Title = @Title,
          Description = @Description,
          Difficulty = @Difficulty,
          Points = @Points,
          TimeLimit = @TimeLimit,
          MemoryLimit = @MemoryLimit,
          InputFormat = @InputFormat,
          OutputFormat = @OutputFormat,
          Constraints = @Constraints,
          SampleInput = @SampleInput,
          SampleOutput = @SampleOutput,
          Explanation = @Explanation,
          ImageURL = @ImageURL,
          StarterCode = @StarterCode,
          Tags = @Tags,
          Instructions = @Instructions,
          UpdatedAt = GETDATE()
        WHERE CompetitionID = @competitionId AND ProblemID = @problemId
      `);
    
    res.json({
      success: true,
      message: 'Problem updated successfully'
    });
  } catch (error) {
    console.error(`Error updating problem ${problemId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating problem', 
      error: error.message 
    });
  }
};

// Delete a problem
exports.deleteProblem = async (req, res) => {
  const { competitionId, problemId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    // Check if problem exists
    const checkResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .query(`
        SELECT ProblemID FROM CompetitionProblems 
        WHERE CompetitionID = @competitionId AND ProblemID = @problemId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }
    
    await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .input('problemId', sql.BigInt, problemId)
      .query(`
        DELETE FROM CompetitionProblems
        WHERE CompetitionID = @competitionId AND ProblemID = @problemId
      `);
    
    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting problem ${problemId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting problem', 
      error: error.message 
    });
  }
};

// Update competition status
exports.updateCompetitionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['draft', 'published', 'active', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status provided'
    });
  }
  
  try {
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT CompetitionID FROM Competitions 
        WHERE CompetitionID = @id AND DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    await pool.request()
      .input('id', sql.BigInt, id)
      .input('status', sql.NVarChar(20), status)
      .query(`
        UPDATE Competitions
        SET 
          Status = @status,
          UpdatedAt = GETDATE()
        WHERE CompetitionID = @id
      `);
    
    res.json({
      success: true,
      message: 'Competition status updated successfully'
    });
  } catch (error) {
    console.error(`Error updating competition status ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating competition status', 
      error: error.message 
    });
  }
};

// Get competition participants
exports.getCompetitionParticipants = async (req, res) => {
  const { competitionId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT CompetitionID FROM Competitions 
        WHERE CompetitionID = @competitionId AND DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Competition not found' 
      });
    }
    
    const result = await pool.request()
      .input('competitionId', sql.BigInt, competitionId)
      .query(`
        SELECT cp.*, u.FullName, u.Email, u.Avatar
        FROM CompetitionParticipants cp
        JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.CompetitionID = @competitionId
        ORDER BY cp.Score DESC
      `);
    
    res.json({
      success: true,
      participants: result.recordset
    });
  } catch (error) {
    console.error(`Error getting participants for competition ${competitionId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching participants', 
      error: error.message 
    });
  }
}; 