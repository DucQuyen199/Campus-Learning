const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get available student services
router.get('/', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT * FROM StudentServices
        WHERE IsActive = 1
        ORDER BY ServiceName
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get service details
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const result = await pool.request()
      .input('serviceId', sql.BigInt, serviceId)
      .query(`
        SELECT * FROM StudentServices
        WHERE ServiceID = @serviceId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching service details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get student's service registrations
router.get('/registrations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT sr.*, ss.ServiceName, ss.Price, u.FullName as ProcessedByName
        FROM ServiceRegistrations sr
        JOIN StudentServices ss ON sr.ServiceID = ss.ServiceID
        LEFT JOIN Users u ON sr.ProcessedBy = u.UserID
        WHERE sr.UserID = @userId
        ORDER BY sr.RequestDate DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching service registrations:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register for a service
router.post('/register', async (req, res) => {
  try {
    const {
      userId,
      serviceId,
      quantity,
      deliveryMethod,
      comments
    } = req.body;
    
    // Get service price
    const serviceResult = await pool.request()
      .input('serviceId', sql.BigInt, serviceId)
      .query(`
        SELECT Price, IsActive FROM StudentServices
        WHERE ServiceID = @serviceId
      `);
    
    if (serviceResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const { Price, IsActive } = serviceResult.recordset[0];
    
    if (!IsActive) {
      return res.status(400).json({ message: 'This service is currently unavailable' });
    }
    
    // Calculate total price
    const totalPrice = Price * (quantity || 1);
    
    // Insert registration
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('serviceId', sql.BigInt, serviceId)
      .input('quantity', sql.Int, quantity || 1)
      .input('totalPrice', sql.Decimal(10, 2), totalPrice)
      .input('deliveryMethod', sql.VarChar(50), deliveryMethod)
      .input('comments', sql.NVarChar(500), comments)
      .query(`
        INSERT INTO ServiceRegistrations
        (UserID, ServiceID, Quantity, TotalPrice, DeliveryMethod, Comments)
        VALUES
        (@userId, @serviceId, @quantity, @totalPrice, @deliveryMethod, @comments);
        
        SELECT SCOPE_IDENTITY() AS RegistrationID
      `);
    
    const registrationId = result.recordset[0].RegistrationID;
    
    res.json({ 
      message: 'Service registration successful',
      registrationId,
      totalPrice 
    });
  } catch (err) {
    console.error('Error registering for service:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel a service registration
router.put('/cancel/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { comments } = req.body;
    
    // Check if registration can be cancelled
    const checkResult = await pool.request()
      .input('registrationId', sql.BigInt, registrationId)
      .query(`
        SELECT Status FROM ServiceRegistrations
        WHERE RegistrationID = @registrationId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const { Status } = checkResult.recordset[0];
    
    if (Status !== 'Pending') {
      return res.status(400).json({ 
        message: 'Cannot cancel registration that is already being processed or completed' 
      });
    }
    
    // Update registration
    await pool.request()
      .input('registrationId', sql.BigInt, registrationId)
      .input('comments', sql.NVarChar(500), comments)
      .query(`
        UPDATE ServiceRegistrations
        SET Status = 'Cancelled',
            Comments = CASE 
              WHEN Comments IS NULL THEN @comments
              ELSE Comments + '; Cancelled: ' + @comments
            END,
            UpdatedAt = GETDATE()
        WHERE RegistrationID = @registrationId
      `);
    
    res.json({ message: 'Registration cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling service registration:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Pay for a service
router.put('/pay/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentMethod, transactionCode } = req.body;
    
    // Check if registration exists and can be paid for
    const checkResult = await pool.request()
      .input('registrationId', sql.BigInt, registrationId)
      .query(`
        SELECT Status, PaymentStatus FROM ServiceRegistrations
        WHERE RegistrationID = @registrationId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const { Status, PaymentStatus } = checkResult.recordset[0];
    
    if (Status === 'Cancelled' || Status === 'Rejected') {
      return res.status(400).json({ message: 'Cannot pay for cancelled or rejected service' });
    }
    
    if (PaymentStatus === 'Paid' || PaymentStatus === 'Refunded') {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // Update payment status
    await pool.request()
      .input('registrationId', sql.BigInt, registrationId)
      .input('paymentMethod', sql.VarChar(50), paymentMethod)
      .input('transactionCode', sql.VarChar(100), transactionCode)
      .query(`
        UPDATE ServiceRegistrations
        SET PaymentStatus = 'Paid',
            PaymentMethod = @paymentMethod,
            TransactionCode = @transactionCode,
            UpdatedAt = GETDATE()
        WHERE RegistrationID = @registrationId
      `);
    
    res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 