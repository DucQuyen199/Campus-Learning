/*-----------------------------------------------------------------
* File: internship.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sqlConnection } = require('../config/database');

const InternshipModel = {
  async getInternships(userId) {
    try {
      const pool = await sqlConnection.connect();
      const result = await pool.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT i.InternshipID, i.CompanyName, i.Position, i.Department, i.Supervisor, 
                 i.ContactEmail, i.ContactPhone, i.StartDate, i.EndDate, i.Status, 
                 i.WeeklyHours, i.Description, i.ObjectivesMet, i.Grade, i.CreatedAt, i.UpdatedAt,
                 DATEDIFF(month, i.StartDate, i.EndDate) as DurationMonths
          FROM Internships i
          WHERE i.UserID = @userId
          ORDER BY i.StartDate DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error in getInternships model:', error);
      throw new Error('Unable to retrieve internships');
    }
  }
};

module.exports = InternshipModel; 
