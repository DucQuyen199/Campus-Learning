const { globalSearch } = require('../utils/searchService');

/**
 * Global search across multiple entities
 */
exports.globalSearch = async (req, res) => {
  try {
    const q = req.query.q || req.query.query;
    if (!q) {
      return res.json({ success: true, data: {} });
    }

    const data = await globalSearch(q);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 