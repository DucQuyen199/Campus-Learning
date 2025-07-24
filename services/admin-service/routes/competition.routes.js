/*-----------------------------------------------------------------
* File: competition.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');

// Get all competitions (which are a type of event specifically for competitions)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT e.*, u.FullName as OrganizerName,
               (SELECT COUNT(*) FROM EventParticipants WHERE EventID = e.EventID) as ParticipantCount
        FROM Events e
        LEFT JOIN Users u ON e.CreatedBy = u.UserID
        WHERE e.Category IN ('Competitive Programming', 'Hackathon')
        ORDER BY e.EventDate DESC
      `);
    
    return res.status(200).json({ competitions: result.recordset });
  } catch (error) {
    console.error('Get Competitions Error:', error);
    return res.status(500).json({ message: 'Server error while getting competitions' });
  }
});

// Get competition by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Get competition details
    const competitionResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT e.*, u.FullName as OrganizerName
        FROM Events e
        LEFT JOIN Users u ON e.CreatedBy = u.UserID
        WHERE e.EventID = @eventId AND e.Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (competitionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Get competition rounds
    const roundsResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM EventRounds
        WHERE EventID = @eventId
        ORDER BY StartTime
      `);
    
    // Get competition prizes
    const prizesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM EventPrizes
        WHERE EventID = @eventId
        ORDER BY Rank
      `);
    
    // Get programming languages
    const languagesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT Language FROM EventProgrammingLanguages
        WHERE EventID = @eventId
      `);
    
    // Get technologies
    const technologiesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT Technology FROM EventTechnologies
        WHERE EventID = @eventId
      `);
    
    return res.status(200).json({
      competition: competitionResult.recordset[0],
      rounds: roundsResult.recordset,
      prizes: prizesResult.recordset,
      languages: languagesResult.recordset.map(l => l.Language),
      technologies: technologiesResult.recordset.map(t => t.Technology)
    });
  } catch (error) {
    console.error('Get Competition Error:', error);
    return res.status(500).json({ message: 'Server error while getting competition details' });
  }
});

// Create new competition
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, category, eventDate, eventTime, 
      location, imageUrl, maxAttendees, price, organizer,
      difficulty, languages, technologies, rounds, prizes
    } = req.body;
    
    // Validate that the category is competition-related
    if (!['Competitive Programming', 'Hackathon'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Competition must be of type "Competitive Programming" or "Hackathon"'
      });
    }
    
    const createdBy = req.user.UserID; // Logged in admin
    const pool = await poolPromise;
    
    // Create the competition event
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('category', sql.VarChar(50), category)
      .input('eventDate', sql.Date, new Date(eventDate))
      .input('eventTime', sql.Time, eventTime)
      .input('location', sql.NVarChar(255), location)
      .input('imageUrl', sql.VarChar(500), imageUrl)
      .input('maxAttendees', sql.Int, maxAttendees)
      .input('price', sql.Decimal(10, 2), price || 0)
      .input('organizer', sql.NVarChar(255), organizer)
      .input('difficulty', sql.VarChar(20), difficulty)
      .input('createdBy', sql.BigInt, createdBy)
      .query(`
        INSERT INTO Events (
          Title, Description, Category, EventDate, EventTime,
          Location, ImageUrl, MaxAttendees, Price, Organizer,
          Difficulty, CreatedBy, Status
        )
        OUTPUT INSERTED.EventID
        VALUES (
          @title, @description, @category, @eventDate, @eventTime,
          @location, @imageUrl, @maxAttendees, @price, @organizer,
          @difficulty, @createdBy, 'upcoming'
        )
      `);
    
    const eventId = result.recordset[0].EventID;
    
    // Add programming languages
    if (languages && languages.length > 0) {
      const languagePromises = languages.map(language => {
        return pool.request()
          .input('eventId', sql.BigInt, eventId)
          .input('language', sql.VarChar(50), language)
          .query(`
            INSERT INTO EventProgrammingLanguages (EventID, Language)
            VALUES (@eventId, @language)
          `);
      });
      
      await Promise.all(languagePromises);
    }
    
    // Add technologies
    if (technologies && technologies.length > 0) {
      const techPromises = technologies.map(tech => {
        return pool.request()
          .input('eventId', sql.BigInt, eventId)
          .input('technology', sql.VarChar(100), tech)
          .query(`
            INSERT INTO EventTechnologies (EventID, Technology)
            VALUES (@eventId, @technology)
          `);
      });
      
      await Promise.all(techPromises);
    }
    
    // Add competition rounds
    if (rounds && rounds.length > 0) {
      const roundPromises = rounds.map(round => {
        return pool.request()
          .input('eventId', sql.BigInt, eventId)
          .input('name', sql.NVarChar(255), round.name)
          .input('description', sql.NVarChar(sql.MAX), round.description)
          .input('duration', sql.Int, round.duration)
          .input('problems', sql.Int, round.problems)
          .input('startTime', sql.DateTime, new Date(round.startTime))
          .input('endTime', sql.DateTime, new Date(round.endTime))
          .query(`
            INSERT INTO EventRounds (
              EventID, Name, Description, Duration, Problems, StartTime, EndTime
            )
            VALUES (
              @eventId, @name, @description, @duration, @problems, @startTime, @endTime
            )
          `);
      });
      
      await Promise.all(roundPromises);
    }
    
    // Add competition prizes
    if (prizes && prizes.length > 0) {
      const prizePromises = prizes.map(prize => {
        return pool.request()
          .input('eventId', sql.BigInt, eventId)
          .input('rank', sql.Int, prize.rank)
          .input('prizeAmount', sql.Decimal(10, 2), prize.prizeAmount)
          .input('description', sql.NVarChar(500), prize.description)
          .query(`
            INSERT INTO EventPrizes (
              EventID, Rank, PrizeAmount, Description
            )
            VALUES (
              @eventId, @rank, @prizeAmount, @description
            )
          `);
      });
      
      await Promise.all(prizePromises);
    }
    
    return res.status(201).json({ 
      message: 'Competition created successfully',
      competitionId: eventId
    });
  } catch (error) {
    console.error('Create Competition Error:', error);
    return res.status(500).json({ message: 'Server error while creating competition' });
  }
});

// Update competition
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, category, eventDate, eventTime, 
      location, imageUrl, maxAttendees, price, organizer,
      difficulty, status, languages, technologies
    } = req.body;
    
    // Validate that the category is competition-related
    if (category && !['Competitive Programming', 'Hackathon'].includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category. Competition must be of type "Competitive Programming" or "Hackathon"'
      });
    }
    
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Update the competition
    await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('category', sql.VarChar(50), category)
      .input('eventDate', sql.Date, new Date(eventDate))
      .input('eventTime', sql.Time, eventTime)
      .input('location', sql.NVarChar(255), location)
      .input('imageUrl', sql.VarChar(500), imageUrl)
      .input('maxAttendees', sql.Int, maxAttendees)
      .input('price', sql.Decimal(10, 2), price)
      .input('organizer', sql.NVarChar(255), organizer)
      .input('difficulty', sql.VarChar(20), difficulty)
      .input('status', sql.VarChar(20), status)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Events
        SET 
          Title = @title,
          Description = @description,
          Category = @category,
          EventDate = @eventDate,
          EventTime = @eventTime,
          Location = @location,
          ImageUrl = @imageUrl,
          MaxAttendees = @maxAttendees,
          Price = @price,
          Organizer = @organizer,
          Difficulty = @difficulty,
          Status = @status,
          UpdatedAt = @updatedAt
        WHERE EventID = @eventId
      `);
    
    // Update languages (clear and re-add)
    if (languages) {
      // Delete existing languages
      await pool.request()
        .input('eventId', sql.BigInt, id)
        .query('DELETE FROM EventProgrammingLanguages WHERE EventID = @eventId');
      
      // Add new languages
      if (languages.length > 0) {
        const languagePromises = languages.map(language => {
          return pool.request()
            .input('eventId', sql.BigInt, id)
            .input('language', sql.VarChar(50), language)
            .query(`
              INSERT INTO EventProgrammingLanguages (EventID, Language)
              VALUES (@eventId, @language)
            `);
        });
        
        await Promise.all(languagePromises);
      }
    }
    
    // Update technologies (clear and re-add)
    if (technologies) {
      // Delete existing technologies
      await pool.request()
        .input('eventId', sql.BigInt, id)
        .query('DELETE FROM EventTechnologies WHERE EventID = @eventId');
      
      // Add new technologies
      if (technologies.length > 0) {
        const techPromises = technologies.map(tech => {
          return pool.request()
            .input('eventId', sql.BigInt, id)
            .input('technology', sql.VarChar(100), tech)
            .query(`
              INSERT INTO EventTechnologies (EventID, Technology)
              VALUES (@eventId, @technology)
            `);
        });
        
        await Promise.all(techPromises);
      }
    }
    
    return res.status(200).json({ message: 'Competition updated successfully' });
  } catch (error) {
    console.error('Update Competition Error:', error);
    return res.status(500).json({ message: 'Server error while updating competition' });
  }
});

// Add round to competition
router.post('/:competitionId/rounds', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { name, description, duration, problems, startTime, endTime } = req.body;
    
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Add round
    const result = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .input('name', sql.NVarChar(255), name)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('duration', sql.Int, duration)
      .input('problems', sql.Int, problems)
      .input('startTime', sql.DateTime, new Date(startTime))
      .input('endTime', sql.DateTime, new Date(endTime))
      .query(`
        INSERT INTO EventRounds (
          EventID, Name, Description, Duration, Problems, StartTime, EndTime
        )
        OUTPUT INSERTED.RoundID
        VALUES (
          @eventId, @name, @description, @duration, @problems, @startTime, @endTime
        )
      `);
    
    const roundId = result.recordset[0].RoundID;
    
    return res.status(201).json({
      message: 'Round added successfully',
      roundId: roundId
    });
  } catch (error) {
    console.error('Add Round Error:', error);
    return res.status(500).json({ message: 'Server error while adding round' });
  }
});

// Update round
router.put('/rounds/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params;
    const { name, description, duration, problems, startTime, endTime } = req.body;
    
    const pool = await poolPromise;
    
    // Check if round exists
    const checkResult = await pool.request()
      .input('roundId', sql.BigInt, roundId)
      .query('SELECT * FROM EventRounds WHERE RoundID = @roundId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Round not found' });
    }
    
    // Update round
    await pool.request()
      .input('roundId', sql.BigInt, roundId)
      .input('name', sql.NVarChar(255), name)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('duration', sql.Int, duration)
      .input('problems', sql.Int, problems)
      .input('startTime', sql.DateTime, new Date(startTime))
      .input('endTime', sql.DateTime, new Date(endTime))
      .query(`
        UPDATE EventRounds
        SET 
          Name = @name,
          Description = @description,
          Duration = @duration,
          Problems = @problems,
          StartTime = @startTime,
          EndTime = @endTime
        WHERE RoundID = @roundId
      `);
    
    return res.status(200).json({ message: 'Round updated successfully' });
  } catch (error) {
    console.error('Update Round Error:', error);
    return res.status(500).json({ message: 'Server error while updating round' });
  }
});

// Add prize to competition
router.post('/:competitionId/prizes', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { rank, prizeAmount, description } = req.body;
    
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Add prize
    const result = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .input('rank', sql.Int, rank)
      .input('prizeAmount', sql.Decimal(10, 2), prizeAmount)
      .input('description', sql.NVarChar(500), description)
      .query(`
        INSERT INTO EventPrizes (
          EventID, Rank, PrizeAmount, Description
        )
        OUTPUT INSERTED.PrizeID
        VALUES (
          @eventId, @rank, @prizeAmount, @description
        )
      `);
    
    const prizeId = result.recordset[0].PrizeID;
    
    return res.status(201).json({
      message: 'Prize added successfully',
      prizeId: prizeId
    });
  } catch (error) {
    console.error('Add Prize Error:', error);
    return res.status(500).json({ message: 'Server error while adding prize' });
  }
});

// Update prize
router.put('/prizes/:prizeId', async (req, res) => {
  try {
    const { prizeId } = req.params;
    const { rank, prizeAmount, description } = req.body;
    
    const pool = await poolPromise;
    
    // Check if prize exists
    const checkResult = await pool.request()
      .input('prizeId', sql.BigInt, prizeId)
      .query('SELECT * FROM EventPrizes WHERE PrizeID = @prizeId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Prize not found' });
    }
    
    // Update prize
    await pool.request()
      .input('prizeId', sql.BigInt, prizeId)
      .input('rank', sql.Int, rank)
      .input('prizeAmount', sql.Decimal(10, 2), prizeAmount)
      .input('description', sql.NVarChar(500), description)
      .query(`
        UPDATE EventPrizes
        SET 
          Rank = @rank,
          PrizeAmount = @prizeAmount,
          Description = @description
        WHERE PrizeID = @prizeId
      `);
    
    return res.status(200).json({ message: 'Prize updated successfully' });
  } catch (error) {
    console.error('Update Prize Error:', error);
    return res.status(500).json({ message: 'Server error while updating prize' });
  }
});

// Get competition participants
router.get('/:competitionId/participants', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Get participants
    const result = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .query(`
        SELECT ep.*, u.FullName, u.Email, u.PhoneNumber, u.Image
        FROM EventParticipants ep
        JOIN Users u ON ep.UserID = u.UserID
        WHERE ep.EventID = @eventId
        ORDER BY ep.RegistrationDate DESC
      `);
    
    return res.status(200).json({ participants: result.recordset });
  } catch (error) {
    console.error('Get Participants Error:', error);
    return res.status(500).json({ message: 'Server error while getting participants' });
  }
});

// Record competition achievements
router.post('/:competitionId/achievements', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { userId, position, points, badgeType } = req.body;
    
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Check if user exists
    const userResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('SELECT * FROM Users WHERE UserID = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Record achievement
    const result = await pool.request()
      .input('eventId', sql.BigInt, competitionId)
      .input('userId', sql.BigInt, userId)
      .input('position', sql.Int, position)
      .input('points', sql.Int, points)
      .input('badgeType', sql.VarChar(50), badgeType)
      .query(`
        INSERT INTO EventAchievements (
          EventID, UserID, Position, Points, BadgeType
        )
        OUTPUT INSERTED.AchievementID
        VALUES (
          @eventId, @userId, @position, @points, @badgeType
        )
      `);
    
    const achievementId = result.recordset[0].AchievementID;
    
    // Also update ranking history
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('type', sql.VarChar(20), 'EVENT')
      .input('relatedId', sql.BigInt, competitionId)
      .input('pointsEarned', sql.Int, points)
      .input('reason', sql.NVarChar(255), `Competition Achievement: Position ${position}`)
      .query(`
        INSERT INTO RankingHistory (
          UserID, Type, RelatedID, PointsEarned, Reason
        )
        VALUES (
          @userId, @type, @relatedId, @pointsEarned, @reason
        )
      `);
    
    return res.status(201).json({
      message: 'Achievement recorded successfully',
      achievementId: achievementId
    });
  } catch (error) {
    console.error('Record Achievement Error:', error);
    return res.status(500).json({ message: 'Server error while recording achievement' });
  }
});

// Update the status of a competition
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const pool = await poolPromise;
    
    // Check if competition exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM Events 
        WHERE EventID = @eventId AND Category IN ('Competitive Programming', 'Hackathon')
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    
    // Update status
    await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('status', sql.VarChar(20), status)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Events
        SET Status = @status, UpdatedAt = @updatedAt
        WHERE EventID = @eventId
      `);
    
    return res.status(200).json({ message: `Competition status updated to '${status}'` });
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ message: 'Server error while updating status' });
  }
});

module.exports = router; 
