const express = require('express');
const router = express.Router();

// Mock tuition data
const tuition = [
  { 
    id: 1, 
    studentId: '2020001', 
    studentName: 'Nguyen Van A', 
    semester: 'Spring 2023',
    amount: 8500000,
    status: 'Paid',
    paymentDate: '2023-01-15'
  },
  { 
    id: 2, 
    studentId: '2020002', 
    studentName: 'Tran Thi B', 
    semester: 'Spring 2023',
    amount: 8500000,
    status: 'Pending',
    paymentDate: null
  },
  { 
    id: 3, 
    studentId: '2020003', 
    studentName: 'Le Van C', 
    semester: 'Spring 2023',
    amount: 7800000,
    status: 'Partial',
    paymentDate: '2023-01-20'
  }
];

// Get all tuition records
router.get('/tuition', (req, res) => {
  res.json({ success: true, data: tuition });
});

// Get tuition by ID
router.get('/tuition/:id', (req, res) => {
  const record = tuition.find(t => t.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, message: 'Tuition record not found' });
  }
  res.json({ success: true, data: record });
});

// Generate tuition
router.post('/tuition/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Tuition generated successfully',
    data: {
      generatedCount: 3,
      semester: req.body.semester || 'Spring 2023',
      totalAmount: 24800000
    }
  });
});

// Process payment
router.post('/tuition/:id/payment', (req, res) => {
  res.json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      id: parseInt(req.params.id),
      status: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: req.body.amount || 8500000,
      paymentMethod: req.body.paymentMethod || 'Bank Transfer'
    }
  });
});

// Get tuition statistics
router.get('/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalTuition: 24800000,
      collectedAmount: 16300000,
      outstandingAmount: 8500000,
      paymentRate: 65.7,
      paymentMethods: [
        { name: 'Bank Transfer', value: 65 },
        { name: 'Cash', value: 35 }
      ],
      programBreakdown: [
        { program: 'Computer Science', students: 120, totalAmount: 10200000, collected: 8500000 },
        { program: 'Business Administration', students: 85, totalAmount: 7225000, collected: 5100000 },
        { program: 'Electrical Engineering', students: 65, totalAmount: 5525000, collected: 2700000 }
      ]
    }
  });
});

module.exports = router; 