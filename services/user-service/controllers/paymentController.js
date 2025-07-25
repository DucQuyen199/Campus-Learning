/*-----------------------------------------------------------------
* File: paymentController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool } = require('../config/db');
const sql = require('mssql');

// Get payment & license overview for current user
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.UserID;
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    // Fetch last 12 payment transactions as billing history
    const historyResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT TOP 12 TransactionID as id,
               FORMAT(CreatedAt,'yyyy-MM-dd') as [date],
               Amount as amount,
               Currency as currency,
               PaymentStatus as status,
               TransactionCode as invoice_code
        FROM PaymentTransactions
        WHERE UserID = @userId AND PaymentStatus = 'completed'
        ORDER BY CreatedAt DESC;
      `);

    // TODO: real subscription & licenses tables; return placeholders for now
    const subscriptionPlan = 'basic';

    res.json({
      success: true,
      data: {
        subscriptionPlan,
        nextBillingDate: null,
        amount: null,
        currency: 'VND',
        paymentMethods: [],
        billingHistory: historyResult.recordset,
        licenses: []
      }
    });
  } catch (err) {
    console.error('Error get payment overview:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment overview', error: err.message });
  }
}; 
