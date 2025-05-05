/**
 * Utility functions for payment processing
 */

/**
 * Fixes the VNPay timer error by ensuring the timer variable exists globally
 * Call this function before loading any VNPay-related script or page
 */
export const fixVNPayTimer = () => {
  if (typeof window !== 'undefined' && window.timer === undefined) {
    window.timer = null;
    
    // Add global updateTime function if it doesn't exist
    if (typeof window.updateTime !== 'function') {
      window.updateTime = function() {
        // Empty implementation to prevent errors
        return;
      };
    }
  }
};

/**
 * Parses VNPay response parameters from URL
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed VNPay response
 */
export const parseVNPayResponse = (searchParams) => {
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionNo = searchParams.get('vnp_TransactionNo');
  const amount = searchParams.get('vnp_Amount');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  
  return {
    responseCode,
    transactionNo,
    amount: amount ? parseInt(amount) / 100 : 0, // Convert from smallest currency unit
    orderInfo,
    transactionStatus,
    isSuccess: responseCode === '00' && transactionStatus === '00'
  };
};

/**
 * Returns a human-readable message for VNPay response codes
 * @param {string} responseCode - VNPay response code
 * @returns {string} Human-readable message
 */
export const getVNPayResponseMessage = (responseCode) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '01': 'Giao dịch đã tồn tại',
    '02': 'Merchant không hợp lệ',
    '03': 'Dữ liệu gửi sang không đúng định dạng',
    '04': 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
    '05': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu thanh toán quá số lần quy định',
    '06': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch',
    '07': 'Giao dịch bị nghi ngờ là giao dịch gian lận',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '99': 'Lỗi không xác định'
  };
  
  return messages[responseCode] || 'Lỗi không xác định';
}; 