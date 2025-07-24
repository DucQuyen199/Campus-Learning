/*-----------------------------------------------------------------
* File: users.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/db');

/**
 * Get all users endpoint with optional role filter
 * Designed specifically for frontend compatibility
 */
router.get('/all', async (req, res) => {
  try {
    const role = req.query.role;
    
    console.log('Request to get all users with role filter:', role);
    
    let query = `
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
        u.PhoneNumber, u.Address, u.City, u.Country,
        u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt, u.Avatar,
        u.Role
    `;
    
    const params = {};
    
    // If role is STUDENT, join with student-specific tables
    if (role === 'STUDENT') {
      query += `
        , sd.StudentCode, sd.Class, sd.CurrentSemester, sd.AcademicStatus,
        ap.ProgramName, ap.Faculty, ap.Department
        FROM Users u
        LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
        LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
        LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      `;
    } else {
      query += `
        FROM Users u
      `;
    }
    
    // Add WHERE clause
    query += ` WHERE 1=1`;
    
    // Add role filter if provided
    if (role) {
      query += ` AND u.Role = @role`;
      params.role = { type: sql.VarChar, value: role };
    }
    
    // Add ordering
    query += ` ORDER BY u.UserID`;
    
    console.log('Executing efficient query to get all users');
    const result = await executeQuery(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách người dùng.'
    });
  }
});

module.exports = router; 
