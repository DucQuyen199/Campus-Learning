const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../src/config/db');
const auth = require('../src/middleware/auth');

// Get all services
router.get('/services', auth, async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Fetching all services');
    
    // Use the executeQuery method from db.js
    const result = await dbConfig.executeQuery(`
      SELECT * FROM StudentServices
      ORDER BY ServiceName ASC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all service requests with filtering options
router.get('/requests', auth, async (req, res) => {
  try {
    const { status, fromDate, toDate, serviceId } = req.query;
    console.log('Fetching service requests with filters:', { status, fromDate, toDate, serviceId });
    
    let query = `
      SELECT r.*, s.ServiceName, u.FullName as StudentName, u.Username, u.Email,
      p.FullName as ProcessorName
      FROM ServiceRegistrations r
      LEFT JOIN StudentServices s ON r.ServiceID = s.ServiceID
      LEFT JOIN Users u ON r.UserID = u.UserID
      LEFT JOIN Users p ON r.ProcessedBy = p.UserID
      WHERE 1=1
    `;
    
    const params = {};
    
    if (status) {
      query += ` AND r.Status = @status`;
      params.status = status;
    }
    
    if (fromDate) {
      query += ` AND r.RequestDate >= @fromDate`;
      params.fromDate = fromDate;
    }
    
    if (toDate) {
      query += ` AND r.RequestDate <= @toDate`;
      params.toDate = toDate;
    }
    
    if (serviceId) {
      query += ` AND r.ServiceID = @serviceId`;
      params.serviceId = serviceId;
    }
    
    query += ` ORDER BY r.RequestDate DESC`;
    
    const result = await dbConfig.executeQuery(query, params);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get service request by ID
router.get('/requests/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching service request details for ID:', id);
    
    const result = await dbConfig.executeQuery(`
      SELECT r.*, s.ServiceName, s.Description as ServiceDescription, 
      s.ProcessingTime, s.RequiredDocuments, s.Department,
      u.FullName as StudentName, u.Username, u.Email, u.PhoneNumber,
      p.FullName as ProcessorName
      FROM ServiceRegistrations r
      LEFT JOIN StudentServices s ON r.ServiceID = s.ServiceID
      LEFT JOIN Users u ON r.UserID = u.UserID
      LEFT JOIN Users p ON r.ProcessedBy = p.UserID
      WHERE r.RegistrationID = @id
    `, { id: { type: sql.BigInt, value: id } });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service request status
router.put('/requests/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const adminId = req.user.id;
    console.log('Updating service request status:', { id, status, adminId });
    
    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Completed', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Check if request exists
    const checkResult = await dbConfig.executeQuery(
      'SELECT * FROM ServiceRegistrations WHERE RegistrationID = @id',
      { id: { type: sql.BigInt, value: id } }
    );
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Update the request
    const now = new Date();
    
    const updateQuery = `
      UPDATE ServiceRegistrations
      SET Status = @status,
          Comments = ISNULL(@comments, Comments),
          ProcessedBy = @processedBy,
          ProcessedAt = @processedAt,
          UpdatedAt = @updatedAt
      WHERE RegistrationID = @id
    `;
    
    await dbConfig.executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      status: { type: sql.VarChar(20), value: status },
      comments: { type: sql.NVarChar(500), value: comments || null },
      processedBy: { type: sql.BigInt, value: adminId },
      processedAt: { type: sql.DateTime, value: now },
      updatedAt: { type: sql.DateTime, value: now }
    });
    
    res.json({
      message: 'Service request updated successfully',
      registrationId: id,
      status: status,
      processedAt: now
    });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get service by ID
router.get('/services/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching service details for ID:', id);
    // Fetch the service record
    const result = await dbConfig.executeQuery(
      `SELECT * FROM StudentServices WHERE ServiceID = @id`,
      { id: { type: sql.BigInt, value: id } }
    );
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new service
router.post('/services', auth, async (req, res) => {
  try {
    const {
      serviceName,
      description,
      price,
      processingTime,
      requiredDocuments,
      department,
      isActive
    } = req.body;
    
    console.log('Creating new service:', { serviceName, price });
    
    // Validate required fields
    if (!serviceName || price === undefined) {
      return res.status(400).json({ message: 'Service name and price are required' });
    }
    
    const query = `
      INSERT INTO StudentServices (
        ServiceName, Description, Price, ProcessingTime, 
        RequiredDocuments, Department, IsActive
      )
      VALUES (
        @serviceName, @description, @price, @processingTime,
        @requiredDocuments, @department, @isActive
      );
      SELECT SCOPE_IDENTITY() AS ServiceID;
    `;
    
    const result = await dbConfig.executeQuery(query, {
      serviceName: { type: sql.NVarChar(100), value: serviceName },
      description: { type: sql.NVarChar(sql.MAX), value: description || null },
      price: { type: sql.Decimal(10, 2), value: price },
      processingTime: { type: sql.VarChar(50), value: processingTime || null },
      requiredDocuments: { type: sql.NVarChar(sql.MAX), value: requiredDocuments || null },
      department: { type: sql.NVarChar(100), value: department || null },
      isActive: { type: sql.Bit, value: isActive !== undefined ? isActive : 1 }
    });
    
    const serviceId = result.recordset[0].ServiceID;
    
    res.status(201).json({
      message: 'Service created successfully',
      serviceId: serviceId
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a service
router.put('/services/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serviceName,
      description,
      price,
      processingTime,
      requiredDocuments,
      department,
      isActive
    } = req.body;
    
    console.log('Updating service:', { id, serviceName });
    
    // Check if service exists
    const checkResult = await dbConfig.executeQuery(
      'SELECT * FROM StudentServices WHERE ServiceID = @id',
      { id: { type: sql.BigInt, value: id } }
    );
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Update service
    const updateQuery = `
      UPDATE StudentServices
      SET ServiceName = @serviceName,
          Description = @description,
          Price = @price,
          ProcessingTime = @processingTime,
          RequiredDocuments = @requiredDocuments,
          Department = @department,
          IsActive = @isActive,
          UpdatedAt = @updatedAt
      WHERE ServiceID = @id
    `;
    
    await dbConfig.executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      serviceName: { type: sql.NVarChar(100), value: serviceName },
      description: { type: sql.NVarChar(sql.MAX), value: description },
      price: { type: sql.Decimal(10, 2), value: price },
      processingTime: { type: sql.VarChar(50), value: processingTime },
      requiredDocuments: { type: sql.NVarChar(sql.MAX), value: requiredDocuments },
      department: { type: sql.NVarChar(100), value: department },
      isActive: { type: sql.Bit, value: isActive },
      updatedAt: { type: sql.DateTime, value: new Date() }
    });
    
    res.json({
      message: 'Service updated successfully',
      serviceId: id
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get service statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    console.log('Fetching service statistics');
    
    // Get counts by status
    const statusCounts = await dbConfig.executeQuery(`
      SELECT Status, COUNT(*) as Count
      FROM ServiceRegistrations
      GROUP BY Status
    `);
    
    // Get top requested services
    const topServices = await dbConfig.executeQuery(`
      SELECT TOP 5 s.ServiceID, s.ServiceName, COUNT(*) as RequestCount
      FROM ServiceRegistrations r
      JOIN StudentServices s ON r.ServiceID = s.ServiceID
      GROUP BY s.ServiceID, s.ServiceName
      ORDER BY RequestCount DESC
    `);
    
    // Get recent requests
    const recentRequests = await dbConfig.executeQuery(`
      SELECT TOP 10 r.RegistrationID, r.RequestDate, r.Status, 
             s.ServiceName, u.FullName as StudentName
      FROM ServiceRegistrations r
      JOIN StudentServices s ON r.ServiceID = s.ServiceID
      JOIN Users u ON r.UserID = u.UserID
      ORDER BY r.RequestDate DESC
    `);
    
    res.json({
      statusCounts: statusCounts.recordset,
      topServices: topServices.recordset,
      recentRequests: recentRequests.recordset
    });
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a service
router.delete('/services/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting service with ID:', id);

    // Check if service exists
    const checkResult = await dbConfig.executeQuery(
      'SELECT * FROM StudentServices WHERE ServiceID = @id',
      { id: { type: sql.BigInt, value: id } }
    );
    if (!checkResult.recordset || checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Delete the service
    await dbConfig.executeQuery(
      'DELETE FROM StudentServices WHERE ServiceID = @id',
      { id: { type: sql.BigInt, value: id } }
    );

    res.json({ message: 'Service deleted successfully', serviceId: id });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 