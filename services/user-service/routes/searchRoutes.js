const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// GET /api/search?q=...
router.get('/search', authenticate, searchController.globalSearch);

module.exports = router; 