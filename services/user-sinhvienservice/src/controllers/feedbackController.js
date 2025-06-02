const Feedback = require('../models/feedback');

exports.createFeedback = async (req, res) => {
  try {
    const { title, content, type, department, isAnonymous } = req.body;
    
    // Validate required fields
    if (!title || !content || !type || !department) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }
    
    // Get userId from authenticated user
    const userId = req.user.id;
    
    // Create feedback entry
    const result = await Feedback.create({
      userId,
      title,
      content,
      type,
      department,
      isAnonymous: isAnonymous || false
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi gửi ý kiến',
        error: result.error
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Góp ý của bạn đã được gửi thành công!',
      feedbackId: result.feedbackId
    });
  } catch (err) {
    console.error('Error in createFeedback controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình gửi ý kiến',
      error: err.message
    });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Feedback.getUserFeedback(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy lịch sử góp ý',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      feedback: result.feedbackHistory
    });
  } catch (err) {
    console.error('Error in getUserFeedback controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy lịch sử góp ý',
      error: err.message
    });
  }
};

exports.getFeedbackMetadata = async (req, res) => {
  try {
    // Get departments and feedback types
    const [departmentsResult, typesResult] = await Promise.all([
      Feedback.getDepartments(),
      Feedback.getFeedbackTypes()
    ]);
    
    if (!departmentsResult.success || !typesResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin danh mục'
      });
    }
    
    return res.status(200).json({
      success: true,
      departments: departmentsResult.departments,
      types: typesResult.types
    });
  } catch (err) {
    console.error('Error in getFeedbackMetadata controller:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình lấy thông tin danh mục',
      error: err.message
    });
  }
}; 