/*-----------------------------------------------------------------
* File: ForcedTwoFASetup.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-06-28
* Description: Forced 2FA setup component for users logging in after account unlock
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Card, Button, Alert, Spinner } from 'flowbite-react';
import { QRCodeSVG } from 'qrcode.react';
import { HiShieldCheck, HiExclamation } from 'react-icons/hi';
import { authServices } from '../../services/api';

const ForcedTwoFASetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  
  useEffect(() => {
    // Check if the setupToken is available in the location state
    const token = location.state?.setupToken;
    const user = location.state?.user;
    
    if (!token) {
      setError('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    
    setSetupToken(token);
    initTwoFASetup(token);
  }, [location]);
  
  const initTwoFASetup = async (token) => {
    try {
      setLoading(true);
      const response = await authServices.initTwoFASetup(token);
      
      if (response.data.qrCodeData && response.data.secret) {
        setQrCodeData(response.data.qrCodeData);
        setSecret(response.data.secret);
      } else {
        setError('Không thể khởi tạo xác thực hai yếu tố. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi thiết lập 2FA');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    try {
      setVerifying(true);
      
      if (!verificationCode || verificationCode.length !== 6) {
        toast.error('Vui lòng nhập mã 6 số từ ứng dụng xác thực');
        setVerifying(false);
        return;
      }
      
      const response = await authServices.verifyAndEnableTwoFA({
        token: setupToken,
        code: verificationCode
      });
      
      if (response.data.success) {
        setSetupComplete(true);
        toast.success('Xác thực hai yếu tố đã được thiết lập thành công!');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        toast.error(response.data.message || 'Mã xác thực không hợp lệ');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xác minh');
    } finally {
      setVerifying(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="xl" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <Alert color="failure" icon={HiExclamation} className="mb-4">
          <span className="font-medium">Lỗi!</span> {error}
        </Alert>
        <Button color="primary" onClick={() => navigate('/login')}>
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }
  
  if (setupComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-screen p-4"
      >
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <HiShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thiết lập thành công!</h2>
            <p className="text-gray-600 mb-4">
              Xác thực hai yếu tố đã được kích hoạt cho tài khoản của bạn.
              Từ bây giờ, bạn sẽ cần nhập mã từ ứng dụng xác thực mỗi khi đăng nhập.
            </p>
            <Button color="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Card className="max-w-md w-full">
        <div className="text-center mb-4">
          <HiShieldCheck className="w-12 h-12 text-blue-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-2">Thiết lập xác thực hai yếu tố</h2>
          <p className="text-gray-600 mt-2">
            Do tài khoản của bạn đã bị khóa trước đó, bạn cần phải thiết lập xác thực hai yếu tố 
            để tăng cường bảo mật cho tài khoản.
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50 mb-4">
          <p className="mb-3 text-sm text-gray-600">
            Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Microsoft Authenticator...)
          </p>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            {qrCodeData && <QRCodeSVG value={qrCodeData} size={200} level="H" />}
          </div>
          {secret && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Hoặc nhập mã thủ công:</p>
              <p className="font-mono bg-gray-100 p-2 rounded text-sm select-all">
                {secret}
              </p>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="verificationCode" className="block mb-2 text-sm font-medium text-gray-700">
            Nhập mã xác minh từ ứng dụng
          </label>
          <input
            type="text"
            id="verificationCode"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="Nhập mã 6 số"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
          />
        </div>
        
        <Button 
          color="primary"
          onClick={handleVerifyCode}
          disabled={verifying || verificationCode.length !== 6}
          isProcessing={verifying}
        >
          Xác nhận và hoàn tất thiết lập
        </Button>
        
        <Alert color="warning" className="mt-4">
          <span className="font-medium">Quan trọng:</span> Hãy lưu lại mã dự phòng hoặc đảm bảo bạn 
          có quyền truy cập vào ứng dụng xác thực. Nếu mất thiết bị, bạn sẽ không thể đăng nhập!
        </Alert>
      </Card>
    </motion.div>
  );
};

export default ForcedTwoFASetup; 