// Thêm route mới chỉ để cập nhật trạng thái tài khoản
router.post('/update-status', auth, async (req, res) => {
  try {
    const { userId, accountStatus } = req.body;
    
    if (!userId || !accountStatus) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }
    
    // Xác nhận AccountStatus hợp lệ
    if (!['ACTIVE', 'LOCKED'].includes(accountStatus)) {
      return res.status(400).json({ message: 'Trạng thái tài khoản không hợp lệ' });
    }
    
    const pool = await poolPromise;
    
    // Chỉ cập nhật các trường cần thiết
    const query = `
      UPDATE Users
      SET AccountStatus = @accountStatus,
          UpdatedAt = @updatedAt
      WHERE UserID = @userId
    `;
    
    const request = pool.request()
      .input('userId', sql.BigInt, userId)
      .input('accountStatus', sql.VarChar(20), accountStatus)
      .input('updatedAt', sql.DateTime, new Date());
    
    await request.query(query);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update account status error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái tài khoản' });
  }
});

router.put('/:id/lock', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, reason } = req.body;
    
    // Tính toán thời điểm mở khóa
    let lockedUntil = null;
    if (duration && duration !== -1) {
      lockedUntil = new Date();
      lockedUntil.setDate(lockedUntil.getDate() + duration);
    }
    
    const pool = await poolPromise;
    
    // Sửa query để chỉ cập nhật các trường có trong bảng Users
    const query = `
      UPDATE Users
      SET AccountStatus = 'LOCKED',
          UpdatedAt = @updatedAt
      WHERE UserID = @userId
    `;
    
    const request = pool.request()
      .input('userId', sql.BigInt, id)
      .input('updatedAt', sql.DateTime, new Date());
    
    await request.query(query);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lock user error:', error);
    res.status(500).json({ message: 'Lỗi khi khóa tài khoản người dùng' });
  }
});

router.put('/:id/unlock', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await poolPromise;
    
    const query = `
      UPDATE Users
      SET AccountStatus = 'ACTIVE',
          UpdatedAt = @updatedAt
      WHERE UserID = @userId
    `;
    
    const request = pool.request()
      .input('userId', sql.BigInt, id)
      .input('updatedAt', sql.DateTime, new Date());
    
    await request.query(query);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({ message: 'Lỗi khi mở khóa tài khoản người dùng' });
  }
}); 