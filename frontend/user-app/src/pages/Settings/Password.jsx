/*-----------------------------------------------------------------
* File: Password.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { changePassword } from '@/store/slices/userSlice';
import { FingerPrintIcon, KeyIcon, ShieldCheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const Password = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.user);
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [passkeys, setPasskeys] = useState([]);

  // Check if the browser supports WebAuthn
  useEffect(() => {
    if (window.PublicKeyCredential) {
      // Check if user verification (biometric authentication) is available
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
          setBiometricSupported(available);
        }).catch(error => {
          console.error('Error checking platform authenticator:', error);
          setBiometricSupported(false);
        });
      } else {
        setBiometricSupported(false);
      }
    } else {
      setBiometricSupported(false);
    }
  }, []);

  // Check if user already has passkey set up
  useEffect(() => {
    if (user && token) {
      // Call API to check if user has passkeys registered
      checkUserPasskeys();
    }
  }, [user, token]);

  const checkUserPasskeys = async () => {
    try {
      const response = await axios.get('/api/passkeys/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setHasPasskey(response.data.hasPasskey);
      setPasskeys(response.data.passkeys || []);
    } catch (error) {
      console.error('Error checking passkey status:', error);
      setHasPasskey(false);
    }
  };

  // Convert base64 string to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binary = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Convert ArrayBuffer to base64 string
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  // Register a new passkey
  const registerPasskey = async () => {
    if (!biometricSupported) {
      toast.error('Thiết bị của bạn không hỗ trợ xác thực sinh trắc học.');
      return;
    }

    setPasskeyLoading(true);
    setAuthError(null);

    try {
      // Step 1: Get registration options from the server
      const optionsResponse = await axios.post('/api/passkeys/register/options', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!optionsResponse.data.success) {
        throw new Error(optionsResponse.data.message || 'Không thể tạo yêu cầu đăng ký');
      }

      const options = optionsResponse.data.options;

      // Format the challenge and user ID as ArrayBuffers
      options.challenge = base64ToArrayBuffer(options.challenge);
      options.user.id = base64ToArrayBuffer(options.user.id);
      
      if (options.excludeCredentials) {
        options.excludeCredentials.forEach(credential => {
          credential.id = base64ToArrayBuffer(credential.id);
        });
      }

      // Step 2: Create a new credential using the device's platform authenticator
      const credential = await navigator.credentials.create({
        publicKey: options
      });

      // Step 3: Format the credential for sending to the server
      const credentialResponse = {
        id: credential.id,
        type: credential.type,
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64(credential.response.attestationObject)
        },
        name: `Passkey on ${navigator.platform}` // Add a friendly name
      };

      // Step 4: Register the credential with the server
      const registrationResult = await axios.post('/api/passkeys/register/verify', credentialResponse, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!registrationResult.data.success) {
        throw new Error(registrationResult.data.message || 'Đăng ký không thành công');
      }

      toast.success('Đã đăng ký xác thực sinh trắc học thành công!');
      setHasPasskey(true);
      
      // Refresh passkey list
      checkUserPasskeys();
    } catch (error) {
      console.error('Error registering passkey:', error);
      setAuthError(error.response?.data?.message || 'Không thể đăng ký xác thực sinh trắc học.');
      toast.error('Không thể đăng ký xác thực sinh trắc học. Vui lòng thử lại sau.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Remove existing passkey
  const removePasskey = async (passkeyId) => {
    setPasskeyLoading(true);
    setAuthError(null);

    try {
      const response = await axios.delete(`/api/passkeys/${passkeyId || ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Đã xóa xác thực sinh trắc học.');
      setHasPasskey(response.data.hasPasskey);
      
      // Refresh passkey list
      checkUserPasskeys();
    } catch (error) {
      console.error('Error removing passkey:', error);
      setAuthError(error.response?.data?.message || 'Không thể xóa xác thực sinh trắc học.');
      toast.error('Không thể xóa xác thực sinh trắc học. Vui lòng thử lại sau.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // Handle 2FA (Time-based One-Time Password) setup and verification
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaStage, setTwoFaStage] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [otp2fa, setOtp2fa] = useState('');

  useEffect(() => {
    if (token) {
      fetchTwoFaStatus();
    }
  }, [token]);

  const fetchTwoFaStatus = async () => {
    try {
      const res = await axios.get('/api/auth/2fa/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFaEnabled(res.data.twoFaEnabled);
    } catch (err) {
      console.error('Fetch 2FA status error:', err);
    }
  };

  const handleToggle2FA = async () => {
    if (twoFaEnabled) {
      // Disable 2FA
      try {
        console.log('Disabling 2FA...');
        await axios.post('/api/auth/2fa/disable', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('2FA đã được vô hiệu hóa');
        setTwoFaEnabled(false);
        setQrCodeUrl(''); // Clear QR code
      } catch (err) {
        console.error('Disable 2FA error:', err);
        toast.error(err.response?.data?.message || 'Không thể vô hiệu hóa 2FA');
      }
    } else {
      // Initialize 2FA setup
      try {
        console.log('Setting up 2FA...');
        const res = await axios.post('/api/auth/2fa/setup', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('2FA setup response:', res.data);
        setQrCodeUrl(res.data.qrCodeUrl);
        setSecret(res.data.secret);
        setTwoFaStage(1);
        setTwoFaEnabled(true);
      } catch (err) {
        console.error('Setup 2FA error:', err);
        toast.error(err.response?.data?.message || 'Không thể khởi tạo 2FA');
      }
    }
  };

  const handleVerifyTwoFa = async (e) => {
    e.preventDefault();
    if (!otp2fa) {
      toast.error('Vui lòng nhập mã 2FA');
      return;
    }
    try {
      await axios.post('/api/auth/2fa/verify', { otp: otp2fa }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('2FA đã được kích hoạt');
      setTwoFaEnabled(true);
      setTwoFaStage(0);
    } catch (err) {
      console.error('Verify 2FA error:', err);
      toast.error(err.response?.data?.message || 'Xác thực 2FA không thành công');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    
    dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }));
    
    // Reset form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Mật khẩu và xác thực
      </h2>
      
      <div className="space-y-8">
        {/* Password Change Section */}
        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tối thiểu 8 ký tự"
            />
            <p className="mt-2 text-xs text-gray-500">
              Mật khẩu phải có ít nhất 8 ký tự.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
      
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
          
        {/* Biometric Authentication Section */}
        <div className="mt-10 pt-10 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-5 text-gray-800 flex items-center">
            <FingerPrintIcon className="h-6 w-6 mr-2 text-blue-500" />
            Xác thực sinh trắc học
          </h3>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            {!biometricSupported ? (
              <div className="flex items-start space-x-3">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Thiết bị không hỗ trợ</h4>
                  <p className="text-sm mt-1 text-gray-600">
                    Trình duyệt hoặc thiết bị của bạn không hỗ trợ xác thực sinh trắc học.
                    Vui lòng sử dụng trình duyệt hiện đại hơn hoặc thiết bị có cảm biến vân tay/khuôn mặt.
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Các trình duyệt được hỗ trợ: Chrome (phiên bản 67+), Edge (phiên bản 18+), Firefox (phiên bản 60+), Safari (phiên bản 13+)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <ShieldCheckIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Bảo mật cao cấp</h4>
                    <p className="text-sm mt-1 text-gray-600">
                      Sử dụng vân tay, khuôn mặt hoặc phương thức sinh trắc học khác trên thiết bị của bạn để đăng nhập 
                      mà không cần nhớ mật khẩu. Chúng tôi không lưu trữ dữ liệu sinh trắc học của bạn - chỉ 
                      một khóa bảo mật được lưu trong cơ sở dữ liệu.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {hasPasskey ? 'Xác thực sinh trắc học đang hoạt động' : 'Đăng ký xác thực sinh trắc học'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {hasPasskey 
                          ? 'Bạn có thể sử dụng vân tay hoặc khuôn mặt để đăng nhập vào tài khoản của mình.' 
                          : 'Thiết lập xác thực sinh trắc học để đăng nhập nhanh chóng và an toàn hơn.'}
                      </p>
                    </div>
                    {!passkeyLoading ? (
                      hasPasskey ? (
                        <button
                          onClick={() => passkeys.length > 0 ? removePasskey(passkeys[0].id) : null}
                          className="px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      ) : (
                        <button
                          onClick={registerPasskey}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Thiết lập ngay
                        </button>
                      )
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        <span className="text-blue-600">Đang xử lý...</span>
                      </div>
                    )}
                  </div>
                </div>

                {authError && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                    {authError}
                  </div>
                )}

                {hasPasskey && passkeys.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Thiết bị đã đăng ký</h5>
                    <ul className="space-y-2">
                      {passkeys.map((passkey, index) => (
                        <li key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                          <div className="flex items-center">
                            <KeyIcon className="h-5 w-5 text-blue-500 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{passkey.name}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(passkey.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removePasskey(passkey.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Xóa
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasPasskey && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <KeyIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-blue-900">Mẹo sử dụng</h4>
                        <p className="mt-2 text-sm text-blue-700">
                          Khi đăng nhập, bạn sẽ thấy tùy chọn sử dụng sinh trắc học thay vì nhập mật khẩu.
                          Xác thực sinh trắc học chỉ hoạt động trên thiết bị đã đăng ký.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Chúng tôi sử dụng công nghệ Web Authentication (WebAuthn) để xác thực sinh trắc học. 
                  Dữ liệu sinh trắc học không bao giờ rời khỏi thiết bị của bạn.
                </p>
              </div>
            )}
          </div>
        </div>
          
        {/* 2FA Authentication */}
        <div className="mt-10 pt-10 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-5 text-gray-800 flex items-center">
            <ShieldCheckIcon className="h-6 w-6 mr-2 text-blue-500" />
            Xác thực hai lớp (2FA)
          </h3>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {twoFaEnabled ? 'Xác thực hai lớp đang hoạt động' : 'Bảo vệ tài khoản của bạn'}
                </h4>
                <p className="text-sm mt-1 text-gray-600">
                  {twoFaEnabled 
                    ? 'Bạn đã bật xác thực hai lớp bằng ứng dụng Authenticator' 
                    : 'Thêm lớp bảo mật bổ sung để ngăn chặn truy cập trái phép vào tài khoản của bạn'}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFaEnabled}
                  onChange={handleToggle2FA}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                      peer-focus:ring-4 peer-focus:ring-blue-300
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5
                      after:bg-white after:rounded-full after:h-5 after:w-5
                      after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
            {/* 2FA setup and verify flow */}
            {twoFaStage === 1 && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 mb-4 md:mb-0 md:pr-6">
                    <h5 className="font-medium text-gray-900 mb-2">Quét mã QR bằng ứng dụng Authenticator</h5>
                    <p className="text-sm text-gray-600 mb-4">
                      Sử dụng Google Authenticator, Microsoft Authenticator hoặc ứng dụng 2FA khác để quét mã QR này.
                      Mỗi lần đăng nhập, bạn sẽ cần nhập mã từ ứng dụng này.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Google Authenticator</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Microsoft Authenticator</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Authy</span>
                    </div>
                    <form onSubmit={handleVerifyTwoFa} className="space-y-3">
                      <input
                        type="text"
                        value={otp2fa}
                        onChange={(e) => setOtp2fa(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập mã 2FA"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Hoàn tất thiết lập
                      </button>
                    </form>
                  </div>
                  <div className="md:w-1/2 flex justify-center">
                    {qrCodeUrl ? (
                      <div className="p-3 bg-white rounded-lg shadow-md relative">
                        <img 
                          src={qrCodeUrl} 
                          alt="2FA QR Code" 
                          className="w-48 h-48" 
                          onError={(e) => {
                            console.error('QR code image failed to load:', e);
                            console.log('QR code URL:', qrCodeUrl);
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjOTk5OTk5Ij5RUiBDb2RlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => window.open(qrCodeUrl, '_blank')}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Mở QR lớn
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {twoFaEnabled && twoFaStage === 0 && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <p className="text-sm text-green-700">
                    Xác thực hai lớp đã được kích hoạt. Khi đăng nhập, bạn sẽ cần nhập mã từ ứng dụng Authenticator.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Password;

