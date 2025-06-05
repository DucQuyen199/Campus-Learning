const { pool } = require('../config/db');

// Stubbed session management controller
exports.getUserSessions = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const ua = req.headers['user-agent'] || '';
    // Extract client IP (respecting proxy)
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    // Parse OS from UA
    const osMatch = ua.match(/\(([^)]+)\)/);
    const os = osMatch ? osMatch[1] : 'Unknown OS';
    // Parse browser and version
    let browser = 'Unknown';
    if (/Edg\//.test(ua)) {
      const m = ua.match(/Edg\/(\d+\.\d+)/);
      browser = m ? `Edge ${m[1]}` : 'Edge';
    } else if (/Chrome\//.test(ua)) {
      const m = ua.match(/Chrome\/(\d+\.\d+)/);
      browser = m ? `Chrome ${m[1]}` : 'Chrome';
    } else if (/Firefox\//.test(ua)) {
      const m = ua.match(/Firefox\/(\d+\.\d+)/);
      browser = m ? `Firefox ${m[1]}` : 'Firefox';
    } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
      const m = ua.match(/Version\/(\d+\.\d+)/);
      browser = m ? `Safari ${m[1]}` : 'Safari';
    }
    // Determine device type
    const device = /Mobile|Android|iP(hone|ad)/.test(ua) ? 'mobile' : 'desktop';
    // Build session
    const session = { id: token, device, browser, os, ip, location: ip, lastActive: new Date(), isCurrent: true };
    return res.json({ sessions: [session], success: true });
  } catch (error) {
    console.error('Error fetching current session:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy phiên đăng nhập', error: error.message, success: false });
  }
};

exports.deleteUserSession = async (req, res) => {
  try {
    // TODO: implement real termination logic
    res.json({ success: true, message: 'Phiên đăng nhập đã được kết thúc' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Lỗi khi kết thúc phiên đăng nhập', error: error.message, success: false });
  }
};

exports.terminateOtherSessions = async (req, res) => {
  try {
    // TODO: implement real termination logic
    res.json({ success: true, message: 'Tất cả phiên khác đã được kết thúc' });
  } catch (error) {
    console.error('Error terminating other sessions:', error);
    res.status(500).json({ message: 'Lỗi khi kết thúc các phiên khác', error: error.message, success: false });
  }
}; 