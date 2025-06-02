const express = require('express');
const router = express.Router();
const onlineServicesController = require('../controllers/onlineServicesController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all available services
router.get('/', onlineServicesController.getServices);

// Create a new service request
router.post('/request', onlineServicesController.createServiceRequest);

// Get user's service request history
router.get('/history', onlineServicesController.getUserServiceRequests);

// Get service metadata (delivery methods, etc.)
router.get('/metadata', onlineServicesController.getServiceMetadata);

// Get service-specific purposes
router.get('/purposes/:serviceId', onlineServicesController.getServicePurposes);

module.exports = router; 