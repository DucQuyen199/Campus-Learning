const validateTuitionPayment = (req, res, next) => {
  const { 
    userId, semester, academicYear, amount, dueDate, 
    isFullTuition, courseDetails 
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!userId) {
    return res.status(400).json({ message: 'Thiếu thông tin sinh viên' });
  }

  if (!semester) {
    return res.status(400).json({ message: 'Thiếu thông tin học kỳ' });
  }

  if (!academicYear) {
    return res.status(400).json({ message: 'Thiếu thông tin năm học' });
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Học phí không hợp lệ' });
  }

  if (!dueDate) {
    return res.status(400).json({ message: 'Thiếu thông tin hạn thanh toán' });
  }

  // Kiểm tra ngày hạn thanh toán phải lớn hơn ngày hiện tại
  const dueDateObj = new Date(dueDate);
  if (isNaN(dueDateObj.getTime()) || dueDateObj < new Date()) {
    return res.status(400).json({ message: 'Hạn thanh toán không hợp lệ' });
  }

  // Nếu là học phí khóa học lẻ, kiểm tra thông tin chi tiết khóa học
  if (isFullTuition === false) {
    if (!courseDetails || !Array.isArray(courseDetails) || courseDetails.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin khóa học' });
    }

    // Kiểm tra từng khóa học
    for (const course of courseDetails) {
      if (!course.courseId) {
        return res.status(400).json({ message: 'Thiếu ID khóa học' });
      }

      if (!course.amount || isNaN(course.amount) || course.amount <= 0) {
        return res.status(400).json({ message: 'Học phí khóa học không hợp lệ' });
      }
    }

    // Kiểm tra tổng học phí khóa học có bằng tổng học phí chung không
    const totalCourseAmount = courseDetails.reduce((sum, course) => sum + Number(course.amount), 0);
    if (Math.abs(totalCourseAmount - amount) > 0.01) {
      return res.status(400).json({ 
        message: 'Tổng học phí khóa học không khớp với tổng học phí',
        totalCourseAmount,
        amount
      });
    }
  }

  next();
};

module.exports = {
  validateTuitionPayment
}; 