/*-----------------------------------------------------------------
* File: event.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');

// Get all events
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT e.*, u.FullName as OrganizerName 
        FROM Events e
        LEFT JOIN Users u ON e.CreatedBy = u.UserID
        ORDER BY e.EventDate DESC
      `);
    
    return res.status(200).json({ events: result.recordset });
  } catch (error) {
    console.error('Get Events Error:', error);
    return res.status(500).json({ message: 'Server error while getting events' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Get event details
    const eventResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT e.*, u.FullName as OrganizerName 
        FROM Events e
        LEFT JOIN Users u ON e.CreatedBy = u.UserID
        WHERE e.EventID = @eventId
      `);
    
    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get event schedule
    const scheduleResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM EventSchedule
        WHERE EventID = @eventId
        ORDER BY StartTime
      `);
    
    // Get event prizes
    const prizesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM EventPrizes
        WHERE EventID = @eventId
        ORDER BY Rank
      `);
    
    // Get programming languages used in the event
    const languagesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT Language FROM EventProgrammingLanguages
        WHERE EventID = @eventId
      `);
    
    // Get technologies used in the event
    const technologiesResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT Technology FROM EventTechnologies
        WHERE EventID = @eventId
      `);
    
    // Get event rounds
    const roundsResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query(`
        SELECT * FROM EventRounds
        WHERE EventID = @eventId
        ORDER BY StartTime
      `);
    
    // Return combined data
    return res.status(200).json({
      event: eventResult.recordset[0],
      schedule: scheduleResult.recordset,
      prizes: prizesResult.recordset,
      languages: languagesResult.recordset.map(l => l.Language),
      technologies: technologiesResult.recordset.map(t => t.Technology),
      rounds: roundsResult.recordset
    });
  } catch (error) {
    console.error('Get Event Error:', error);
    return res.status(500).json({ message: 'Server error while getting event details' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, category, eventDate, eventTime, 
      location, imageUrl, maxAttendees, price, organizer,
      difficulty, languages, technologies
    } = req.body;
    
    const createdBy = req.user.UserID; // Logged in admin
    const pool = await poolPromise;
    
    // Create the event
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
    
    return res.status(201).json({ 
      message: 'Event created successfully',
      eventId: eventId
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    return res.status(500).json({ message: 'Server error while creating event' });
  }
});

// Update existing event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, category, eventDate, eventTime, 
      location, imageUrl, maxAttendees, price, organizer,
      difficulty, status, languages, technologies
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if event exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, id)
      .query('SELECT * FROM Events WHERE EventID = @eventId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update the event
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
    
    return res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update Event Error:', error);
    return res.status(500).json({ message: 'Server error while updating event' });
  }
});

// Add event round
router.post('/:eventId/rounds', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, duration, problems, startTime, endTime } = req.body;
    
    const pool = await poolPromise;
    
    // Check if event exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, eventId)
      .query('SELECT * FROM Events WHERE EventID = @eventId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create round
    const result = await pool.request()
      .input('eventId', sql.BigInt, eventId)
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
      message: 'Event round created successfully',
      roundId: roundId
    });
  } catch (error) {
    console.error('Create Round Error:', error);
    return res.status(500).json({ message: 'Server error while creating event round' });
  }
});

// Add event prize
router.post('/:eventId/prizes', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rank, prizeAmount, description } = req.body;
    
    const pool = await poolPromise;
    
    // Check if event exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, eventId)
      .query('SELECT * FROM Events WHERE EventID = @eventId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create prize
    const result = await pool.request()
      .input('eventId', sql.BigInt, eventId)
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
      message: 'Event prize created successfully',
      prizeId: prizeId
    });
  } catch (error) {
    console.error('Create Prize Error:', error);
    return res.status(500).json({ message: 'Server error while creating event prize' });
  }
});

// Add event schedule item
router.post('/:eventId/schedule', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { activityName, startTime, endTime, description, location, type } = req.body;
    
    const pool = await poolPromise;
    
    // Check if event exists
    const checkResult = await pool.request()
      .input('eventId', sql.BigInt, eventId)
      .query('SELECT * FROM Events WHERE EventID = @eventId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create schedule item
    const result = await pool.request()
      .input('eventId', sql.BigInt, eventId)
      .input('activityName', sql.NVarChar(255), activityName)
      .input('startTime', sql.DateTime, new Date(startTime))
      .input('endTime', sql.DateTime, new Date(endTime))
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('location', sql.NVarChar(255), location)
      .input('type', sql.VarChar(50), type)
      .query(`
        INSERT INTO EventSchedule (
          EventID, ActivityName, StartTime, EndTime, Description, Location, Type
        )
        OUTPUT INSERTED.ScheduleID
        VALUES (
          @eventId, @activityName, @startTime, @endTime, @description, @location, @type
        )
      `);
    
    const scheduleId = result.recordset[0].ScheduleID;
    
    return res.status(201).json({
      message: 'Event schedule item created successfully',
      scheduleId: scheduleId
    });
  } catch (error) {
    console.error('Create Schedule Item Error:', error);
    return res.status(500).json({ message: 'Server error while creating schedule item' });
  }
});

// Get event participants
router.get('/:eventId/participants', async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = await poolPromise;
    
    // Get participants
    const result = await pool.request()
      .input('eventId', sql.BigInt, eventId)
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
    return res.status(500).json({ message: 'Server error while getting event participants' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Soft delete (mark as cancelled)
    await pool.request()
      .input('eventId', sql.BigInt, id)
      .input('deletedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Events
        SET DeletedAt = @deletedAt, Status = 'cancelled'
        WHERE EventID = @eventId
      `);
    
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete Event Error:', error);
    return res.status(500).json({ message: 'Server error while deleting event' });
  }
});

module.exports = router; 
