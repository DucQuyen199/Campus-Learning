const { poolPromise, sql } = require('../config/database');

const eventController = {
  // Get all events
  getAllEvents: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT e.*, u.FullName as CreatorName,
                 (SELECT COUNT(*) FROM EventParticipants WHERE EventID = e.EventID) as ParticipantCount
          FROM Events e
          LEFT JOIN Users u ON e.CreatedBy = u.UserID
          WHERE e.DeletedAt IS NULL
          ORDER BY e.EventDate DESC, e.EventTime DESC
        `);
      
      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          SELECT e.*, u.FullName as CreatorName
          FROM Events e
          LEFT JOIN Users u ON e.CreatedBy = u.UserID
          WHERE e.EventID = @eventId AND e.DeletedAt IS NULL
        `);

      if (!result.recordset[0]) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Get event programming languages
      const languagesResult = await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          SELECT Language 
          FROM EventProgrammingLanguages 
          WHERE EventID = @eventId
        `);

      // Get event technologies
      const technologiesResult = await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          SELECT Technology 
          FROM EventTechnologies 
          WHERE EventID = @eventId
        `);

      // Get event prizes
      const prizesResult = await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          SELECT * 
          FROM EventPrizes 
          WHERE EventID = @eventId
          ORDER BY Rank
        `);

      // Get event rounds
      const roundsResult = await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          SELECT * 
          FROM EventRounds 
          WHERE EventID = @eventId
          ORDER BY StartTime
        `);

      const event = {
        ...result.recordset[0],
        programmingLanguages: languagesResult.recordset.map(l => l.Language),
        technologies: technologiesResult.recordset.map(t => t.Technology),
        prizes: prizesResult.recordset,
        rounds: roundsResult.recordset
      };

      res.json(event);
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Create event
  createEvent: async (req, res) => {
    try {
      // Normalize request body keys to lowercase
      const normalizedBody = {};
      Object.keys(req.body).forEach(key => {
        normalizedBody[key.toLowerCase()] = req.body[key];
      });

      const {
        title,
        description,
        category,
        eventdate,
        eventtime,
        location,
        maxattendees,
        price,
        organizer,
        difficulty,
        prizes,
        programminglanguages,
        technologies,
        rounds
      } = normalizedBody;

      console.log('Normalized event data:', normalizedBody);

      // Validate required fields
      const requiredFields = {
        title: 'Title is required',
        description: 'Description is required',
        category: 'Category is required',
        eventdate: 'Event date is required',
        eventtime: 'Event time is required'
      };

      const missingFields = [];
      for (const [field, message] of Object.entries(requiredFields)) {
        if (!normalizedBody[field]) {
          missingFields.push(message);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: missingFields 
        });
      }

      // Validate category
      const validCategories = [
        'Competitive Programming', 'Hackathon', 'Web Development',
        'AI/ML', 'Mobile Development', 'DevOps', 'Security'
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          details: [`Category must be one of: ${validCategories.join(', ')}`]
        });
      }

      // Validate difficulty
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (difficulty && !validDifficulties.includes(difficulty.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid difficulty',
          details: [`Difficulty must be one of: ${validDifficulties.join(', ')}`]
        });
      }

      const pool = await poolPromise;
      
      // Start transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        // Format event time
        let finalTime;
        try {
          // Handle time format
          const timeArray = eventtime.split(':');
          const hours = timeArray[0].padStart(2, '0');
          const minutes = timeArray[1] ? timeArray[1].padStart(2, '0') : '00';
          finalTime = `${hours}:${minutes}`;

          // Validate time format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(finalTime)) {
            return res.status(400).json({
              error: 'Invalid time format',
              details: ['Time must be in HH:MM format (24-hour)']
            });
          }
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid time format',
            details: ['Time must be in HH:MM format (24-hour)']
          });
        }

        // Format event date
        let formattedDate;
        try {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(eventdate)) {
            return res.status(400).json({
              error: 'Invalid date format',
              details: ['Date must be in YYYY-MM-DD format']
            });
          }
          formattedDate = eventdate;
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid date format',
            details: ['Date must be in YYYY-MM-DD format']
          });
        }

        const eventResult = await transaction.request()
          .input('title', sql.NVarChar(255), title)
          .input('description', sql.NVarChar(sql.MAX), description)
          .input('category', sql.VarChar(50), category)
          .input('eventDate', sql.Date, formattedDate)
          .input('eventTime', sql.VarChar(5), finalTime)
          .input('location', sql.NVarChar(255), location || null)
          .input('maxAttendees', sql.Int, maxattendees || null)
          .input('price', sql.Decimal(10,2), price || 0)
          .input('organizer', sql.NVarChar(255), organizer || null)
          .input('difficulty', sql.VarChar(20), difficulty?.toLowerCase() || 'beginner')
          .input('createdBy', sql.BigInt, req.user?.userId || 1)
          .input('status', sql.VarChar(20), 'upcoming')
          .query(`
            INSERT INTO Events (
              Title, Description, Category, EventDate,
              EventTime, Location, MaxAttendees, Price,
              Organizer, Difficulty, CreatedBy, Status
            )
            VALUES (
              @title, @description, @category, @eventDate,
              @eventTime, @location, @maxAttendees, @price,
              @organizer, @difficulty, @createdBy, @status
            );
            SELECT SCOPE_IDENTITY() as EventID;
          `);

        const eventId = eventResult.recordset[0].EventID;

        // Add programming languages if provided
        if (programminglanguages && programminglanguages.length > 0) {
          for (const language of programminglanguages) {
            await transaction.request()
              .input('eventId', sql.BigInt, eventId)
              .input('language', sql.VarChar(50), language)
              .query(`
                INSERT INTO EventProgrammingLanguages (EventID, Language)
                VALUES (@eventId, @language)
              `);
          }
        }

        // Add technologies if provided
        if (technologies && technologies.length > 0) {
          for (const tech of technologies) {
            await transaction.request()
              .input('eventId', sql.BigInt, eventId)
              .input('technology', sql.VarChar(50), tech)
              .query(`
                INSERT INTO EventTechnologies (EventID, Technology)
                VALUES (@eventId, @technology)
              `);
          }
        }

        // Add prizes if provided
        if (prizes && prizes.length > 0) {
          for (const prize of prizes) {
            await transaction.request()
              .input('eventId', sql.BigInt, eventId)
              .input('rank', sql.Int, prize.rank)
              .input('prize', sql.NVarChar(255), prize.prize)
              .input('rewardPoints', sql.Int, prize.rewardPoints || 0)
              .input('description', sql.NVarChar(500), prize.description || null)
              .query(`
                INSERT INTO EventPrizes (EventID, Rank, Prize, RewardPoints, Description)
                VALUES (@eventId, @rank, @prize, @rewardPoints, @description)
              `);
          }
        }

        // Add rounds if provided
        if (rounds && rounds.length > 0) {
          for (const round of rounds) {
            await transaction.request()
              .input('eventId', sql.BigInt, eventId)
              .input('name', sql.NVarChar(100), round.name)
              .input('description', sql.NVarChar(500), round.description || null)
              .input('startTime', sql.DateTime, new Date(round.startTime))
              .input('endTime', sql.DateTime, new Date(round.endTime))
              .input('location', sql.NVarChar(255), round.location || null)
              .query(`
                INSERT INTO EventRounds (EventID, Name, Description, StartTime, EndTime, Location)
                VALUES (@eventId, @name, @description, @startTime, @endTime, @location)
              `);
          }
        }

        // Commit the transaction
        await transaction.commit();

        res.status(201).json({
          message: 'Event created successfully',
          eventId
        });
      } catch (error) {
        // Rollback the transaction if any error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        eventDate,
        eventTime,
        location,
        maxAttendees,
        price,
        organizer,
        difficulty,
        status
      } = req.body;

      const pool = await poolPromise;
      const eventTimeObj = new Date(eventTime);
      const hours = String(eventTimeObj.getHours()).padStart(2, '0');
      const minutes = String(eventTimeObj.getMinutes()).padStart(2, '0');
      const finalTime = `${hours}:${minutes}:00`;

      await pool.request()
        .input('eventId', sql.BigInt, id)
        .input('title', sql.NVarChar(255), title)
        .input('description', sql.NVarChar(sql.MAX), description)
        .input('category', sql.VarChar(50), category)
        .input('eventDate', sql.Date, new Date(eventDate))
        .input('eventTime', sql.Time, finalTime)
        .input('location', sql.NVarChar(255), location)
        .input('maxAttendees', sql.Int, maxAttendees)
        .input('price', sql.Decimal(10,2), price || 0)
        .input('organizer', sql.NVarChar(255), organizer)
        .input('difficulty', sql.VarChar(20), difficulty)
        .input('status', sql.VarChar(20), status)
        .query(`
          UPDATE Events
          SET Title = @title,
              Description = @description,
              Category = @category,
              EventDate = @eventDate,
              EventTime = @eventTime,
              Location = @location,
              MaxAttendees = @maxAttendees,
              Price = @price,
              Organizer = @organizer,
              Difficulty = @difficulty,
              Status = @status,
              UpdatedAt = GETDATE()
          WHERE EventID = @eventId AND DeletedAt IS NULL
        `);

      res.json({ message: 'Event updated successfully' });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      await pool.request()
        .input('eventId', sql.BigInt, id)
        .query(`
          UPDATE Events
          SET DeletedAt = GETDATE()
          WHERE EventID = @eventId AND DeletedAt IS NULL
        `);

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event participants
  getEventParticipants: async (req, res) => {
    try {
      const { eventId } = req.params;
      
      // Validate eventId
      if (!eventId || isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }
      
      const pool = await poolPromise;
      
      // First check if the event exists
      const eventExists = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT COUNT(*) as count
          FROM Events
          WHERE EventID = @eventId AND DeletedAt IS NULL
        `);
        
      if (eventExists.recordset[0].count === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Get participants with proper field names that match database schema
      const result = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT 
            ep.ParticipantID,
            ep.EventID,
            ep.UserID,
            ep.TeamName,
            ep.Status,
            ep.RegistrationDate,
            ep.PaymentStatus,
            ep.AttendanceStatus,
            u.Username,
            u.FullName,
            u.Email,
            u.Image as ProfilePicture
          FROM EventParticipants ep
          LEFT JOIN Users u ON ep.UserID = u.UserID
          WHERE ep.EventID = @eventId
          ORDER BY ep.RegistrationDate DESC
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting event participants:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve event participants', 
        error: error.message 
      });
    }
  },

  // Add participant to event
  addParticipant: async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const { teamName, paymentStatus } = req.body;

      const pool = await poolPromise;
      
      // Check if the user is already registered
      const checkResult = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('userId', sql.BigInt, userId)
        .query(`
          SELECT * FROM EventParticipants
          WHERE EventID = @eventId AND UserID = @userId
        `);

      if (checkResult.recordset.length > 0) {
        return res.status(400).json({ message: 'User is already registered for this event' });
      }

      // Add participant
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('userId', sql.BigInt, userId)
        .input('teamName', sql.NVarChar(100), teamName || null)
        .input('status', sql.VarChar(20), 'registered')
        .input('paymentStatus', sql.VarChar(20), paymentStatus || 'pending')
        .input('attendanceStatus', sql.VarChar(20), 'pending')
        .query(`
          INSERT INTO EventParticipants (
            EventID, 
            UserID, 
            TeamName, 
            Status, 
            PaymentStatus,
            AttendanceStatus
          )
          VALUES (
            @eventId, 
            @userId, 
            @teamName, 
            @status, 
            @paymentStatus,
            @attendanceStatus
          )
        `);

      res.status(201).json({ message: 'Participant added successfully' });
    } catch (error) {
      console.error('Error adding participant:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Remove participant from event
  removeParticipant: async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const pool = await poolPromise;
      
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('userId', sql.BigInt, userId)
        .query(`
          DELETE FROM EventParticipants
          WHERE EventID = @eventId AND UserID = @userId
        `);

      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event languages
  getEventLanguages: async (req, res) => {
    try {
      const { eventId } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT Language
          FROM EventProgrammingLanguages
          WHERE EventID = @eventId
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting event languages:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Add language to an event
  addEventLanguage: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { Language } = req.body;
      
      if (!Language) {
        return res.status(400).json({ message: 'Language is required' });
      }

      const pool = await poolPromise;
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('language', sql.VarChar(50), Language)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM EventProgrammingLanguages WHERE EventID = @eventId AND Language = @language)
          BEGIN
            INSERT INTO EventProgrammingLanguages (EventID, Language)
            VALUES (@eventId, @language)
          END
        `);

      res.status(201).json({ message: 'Language added successfully' });
    } catch (error) {
      console.error('Error adding language:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event technologies
  getEventTechnologies: async (req, res) => {
    try {
      const { eventId } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT Technology
          FROM EventTechnologies
          WHERE EventID = @eventId
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting event technologies:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Add technology to an event
  addEventTechnology: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { Technology } = req.body;
      
      if (!Technology) {
        return res.status(400).json({ message: 'Technology is required' });
      }

      const pool = await poolPromise;
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('technology', sql.VarChar(100), Technology)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM EventTechnologies WHERE EventID = @eventId AND Technology = @technology)
          BEGIN
            INSERT INTO EventTechnologies (EventID, Technology)
            VALUES (@eventId, @technology)
          END
        `);

      res.status(201).json({ message: 'Technology added successfully' });
    } catch (error) {
      console.error('Error adding technology:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event prizes
  getEventPrizes: async (req, res) => {
    try {
      const { eventId } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT *
          FROM EventPrizes
          WHERE EventID = @eventId
          ORDER BY Rank
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting event prizes:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Add prize to an event
  addEventPrize: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { Rank, PrizeAmount, Description } = req.body;
      
      if (!Rank) {
        return res.status(400).json({ message: 'Rank is required' });
      }

      const pool = await poolPromise;
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('rank', sql.Int, Rank)
        .input('prizeAmount', sql.Decimal(10,2), PrizeAmount || 0)
        .input('description', sql.NVarChar(500), Description || null)
        .query(`
          INSERT INTO EventPrizes (EventID, Rank, PrizeAmount, Description)
          VALUES (@eventId, @rank, @prizeAmount, @description)
        `);

      res.status(201).json({ message: 'Prize added successfully' });
    } catch (error) {
      console.error('Error adding prize:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event schedule
  getEventSchedule: async (req, res) => {
    try {
      const { eventId } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .query(`
          SELECT *
          FROM EventSchedule
          WHERE EventID = @eventId
          ORDER BY StartTime
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error('Error getting event schedule:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Add schedule to an event
  addEventSchedule: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { ActivityName, StartTime, EndTime, Description, Location, Type } = req.body;
      
      if (!ActivityName) {
        return res.status(400).json({ message: 'Activity name is required' });
      }

      const pool = await poolPromise;
      await pool.request()
        .input('eventId', sql.BigInt, eventId)
        .input('activityName', sql.NVarChar(255), ActivityName)
        .input('startTime', sql.DateTime, StartTime ? new Date(StartTime) : null)
        .input('endTime', sql.DateTime, EndTime ? new Date(EndTime) : null)
        .input('description', sql.NVarChar(sql.MAX), Description || null)
        .input('location', sql.NVarChar(255), Location || null)
        .input('type', sql.VarChar(50), Type || 'main_event')
        .query(`
          INSERT INTO EventSchedule (EventID, ActivityName, StartTime, EndTime, Description, Location, Type)
          VALUES (@eventId, @activityName, @startTime, @endTime, @description, @location, @type)
        `);

      res.status(201).json({ message: 'Schedule added successfully' });
    } catch (error) {
      console.error('Error adding schedule:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get event statistics
  getEventStats: async (req, res) => {
    try {
      const pool = await poolPromise;
      
      // Get total events count
      const totalEventsResult = await pool.request().query(`
        SELECT COUNT(*) as totalEvents
        FROM Events
        WHERE DeletedAt IS NULL
      `);
      
      // Get upcoming events count
      const upcomingEventsResult = await pool.request().query(`
        SELECT COUNT(*) as upcomingEvents
        FROM Events
        WHERE 
          DeletedAt IS NULL AND
          EventDate >= GETDATE() AND
          Status = 'upcoming'
      `);
      
      // Get this month's events
      const currentMonthResult = await pool.request().query(`
        SELECT COUNT(*) as currentMonthEvents
        FROM Events
        WHERE 
          DeletedAt IS NULL AND
          MONTH(EventDate) = MONTH(GETDATE()) AND
          YEAR(EventDate) = YEAR(GETDATE())
      `);
      
      // Get previous month's events (for comparison)
      const previousMonthResult = await pool.request().query(`
        SELECT COUNT(*) as previousMonthEvents
        FROM Events
        WHERE 
          DeletedAt IS NULL AND
          MONTH(EventDate) = MONTH(DATEADD(month, -1, GETDATE())) AND
          YEAR(EventDate) = YEAR(DATEADD(month, -1, GETDATE()))
      `);
      
      // Get events by category
      const eventsByTypeResult = await pool.request().query(`
        SELECT 
          Category as category,
          COUNT(*) as count
        FROM Events
        WHERE DeletedAt IS NULL
        GROUP BY Category
        ORDER BY count DESC
      `);
      
      // Calculate percentage change
      const currentMonthCount = currentMonthResult.recordset[0].currentMonthEvents;
      const previousMonthCount = previousMonthResult.recordset[0].previousMonthEvents;
      
      let percentageChange = 0;
      if (previousMonthCount > 0) {
        percentageChange = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
      } else if (currentMonthCount > 0) {
        percentageChange = 100; // If there were no events last month but there are this month
      }
      
      // Compile statistics
      const stats = {
        totalEvents: totalEventsResult.recordset[0].totalEvents,
        upcomingEvents: upcomingEventsResult.recordset[0].upcomingEvents,
        thisMonth: {
          count: currentMonthCount,
          change: percentageChange.toFixed(2),
          changeType: percentageChange >= 0 ? 'increase' : 'decrease'
        },
        byCategory: eventsByTypeResult.recordset
      };
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get Event Stats Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting event statistics'
      });
    }
  }
};

module.exports = eventController;