import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { deleteAccount, updateUserSettings } from '@/store/slices/userSlice';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { userServices } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
// Add Google OAuth library
import { GoogleLogin } from '@react-oauth/google';
// Add Facebook SDK
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connectOAuthProvider, disconnectOAuthProvider, getOAuthConnections } = useAuth();
  
  const { settings, profileInfo, loading } = useSelector(state => state.user);
  const [localSettings, setLocalSettings] = useState(settings ? {...settings} : null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    reason: '',
    confirmation: ''
  });
  const [primaryEmail, setPrimaryEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [emailLoading, setEmailLoading] = useState(true);
  const [oauthConnections, setOauthConnections] = useState([]);
  const [oauthLoading, setOauthLoading] = useState(true);

  // Fetch user emails
  useEffect(() => {
    setEmailLoading(true);
    userServices.getEmails()
      .then(response => {
        setEmails(response.data.emails);
        const primary = response.data.emails.find(email => email.IsPrimary);
        if (primary) {
          setPrimaryEmail(primary);
        }
        setEmailLoading(false);
      })
      .catch(error => {
        console.error('Error fetching emails:', error);
        setEmailLoading(false);
      });
  }, []);

  // Fetch OAuth connections
  useEffect(() => {
    setOauthLoading(true);
    getOAuthConnections()
      .then(result => {
        if (result.success) {
          setOauthConnections(result.connections || []);
        } else {
          console.error('Error fetching OAuth connections:', result.error);
        }
        setOauthLoading(false);
      })
      .catch(error => {
        console.error('Error fetching OAuth connections:', error);
        setOauthLoading(false);
      });
  }, [getOAuthConnections]);

  // Handle Google login success for connection
  const handleGoogleConnect = async (response) => {
    try {
      const result = await connectOAuthProvider('google', response.credential);
      
      if (result.success) {
        toast.success('Google account connected successfully');
        // Refresh connections
        const connectionsResult = await getOAuthConnections();
        if (connectionsResult.success) {
          setOauthConnections(connectionsResult.connections || []);
        }
      } else {
        toast.error(result.error || 'Failed to connect Google account');
      }
    } catch (error) {
      console.error('Google connection error:', error);
      toast.error(error.message || 'Failed to connect Google account');
    }
  };

  // Handle Google connection error
  const handleGoogleError = () => {
    toast.error('Google connection failed. Please try again.');
  };

  // Handle Facebook connection
  const handleFacebookConnect = async (response) => {
    try {
      if (response.accessToken) {
        const result = await connectOAuthProvider('facebook', response.accessToken);
        
        if (result.success) {
          toast.success('Facebook account connected successfully');
          // Refresh connections
          const connectionsResult = await getOAuthConnections();
          if (connectionsResult.success) {
            setOauthConnections(connectionsResult.connections || []);
          }
        } else {
          toast.error(result.error || 'Failed to connect Facebook account');
        }
      } else {
        toast.error('Facebook connection failed. No access token received.');
      }
    } catch (error) {
      console.error('Facebook connection error:', error);
      toast.error(error.message || 'Failed to connect Facebook account');
    }
  };

  // Handle disconnect OAuth provider
  const handleDisconnectProvider = async (provider) => {
    try {
      const result = await disconnectOAuthProvider(provider);
      
      if (result.success) {
        toast.success(`${provider} account disconnected successfully`);
        // Update connections list
        setOauthConnections(oauthConnections.filter(conn => conn.Provider.toLowerCase() !== provider.toLowerCase()));
      } else {
        toast.error(result.error || `Failed to disconnect ${provider} account`);
      }
    } catch (error) {
      console.error(`${provider} disconnection error:`, error);
      toast.error(error.message || `Failed to disconnect ${provider} account`);
    }
  };

  // Handle settings change
  const handleSettingChange = (category, key, value) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value
      }
    });
  };

  // Handle settings submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (localSettings) {
      dispatch(updateUserSettings(localSettings));
    }
  };

  // Handle delete account
  const handleDeleteAccountChange = (e) => {
    setDeleteAccountData({
      ...deleteAccountData,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteAccountSubmit = (e) => {
    e.preventDefault();
    
    if (deleteAccountData.confirmation !== 'XÓA') {
      toast.error('Vui lòng nhập "XÓA" để xác nhận');
      return;
    }
    
    dispatch(deleteAccount({
      password: deleteAccountData.password,
      reason: deleteAccountData.reason
    })).then((result) => {
      if (!result.error) {
        // Logout if account deletion successful
        dispatch(logout());
        navigate('/login');
      }
    });
  };

  // Handle email verification
  const handleVerifyEmail = () => {
    if (!primaryEmail || primaryEmail.IsVerified) return;
    
    userServices.resendVerificationEmail(primaryEmail.EmailID)
      .then(() => {
        toast.info('Đã gửi email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
      })
      .catch(error => {
        console.error('Error sending verification email:', error);
        toast.error('Có lỗi khi gửi email xác thực');
      });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Tài khoản
      </h2>
      
      <div className="space-y-8">
        {/* Account Information */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thông tin tài khoản</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên người dùng
                </label>
                <div className="text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                  {profileInfo?.username || 'username'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center">
                  <div className="text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 flex-1 mr-2">
                    {emailLoading ? 
                      'Loading...' : 
                      (primaryEmail?.Email || profileInfo?.email || 'email@example.com')}
                  </div>
                  {!emailLoading && primaryEmail && (
                    primaryEmail.IsVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Đã xác thực
                      </span>
                    ) : (
                      <button 
                        onClick={handleVerifyEmail}
                        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        Xác thực ngay
                      </button>
                    )
                  )}
                </div>
                {emails.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {emails.length} email đã liên kết. Quản lý tại trang "Email".
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày tham gia
              </label>
              <div className="text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                {profileInfo?.createdAt ? 
                  new Date(profileInfo.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  }) : 
                  new Date().toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Account Preferences */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tùy chọn tài khoản</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngôn ngữ mặc định
              </label>
              <div className="relative">
                <select
                  value={localSettings?.preferences?.language}
                  onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                  <option value="fr">Tiếng Pháp</option>
                  <option value="ja">Tiếng Nhật</option>
                  <option value="zh">Tiếng Trung</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Múi giờ
              </label>
              <div className="relative">
                <select
                  value={localSettings?.preferences?.timeZone}
                  onChange={(e)=>handleSettingChange('preferences','timeZone',e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Asia/Ho_Chi_Minh">(GMT+7:00) Hồ Chí Minh, Hà Nội, Bangkok</option>
                  <option value="Asia/Tokyo">(GMT+9:00) Tokyo, Osaka</option>
                  <option value="Europe/London">(GMT+0:00) London, Edinburgh</option>
                  <option value="America/New_York">(GMT-5:00) New York, Miami</option>
                  <option value="America/Los_Angeles">(GMT-8:00) Los Angeles, Seattle</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Trạng thái hoạt động</h4>
                <p className="text-sm text-gray-500">Tự động đánh dấu là đang hoạt động khi đăng nhập</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings?.privacy?.showOnlineStatus}
                  onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                    peer-focus:ring-4 peer-focus:ring-blue-300
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Connected Services */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Dịch vụ đã kết nối</h3>
          </div>
          <div className="p-5 space-y-5">
            {oauthLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Google connection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div>
                      {oauthConnections.find(conn => conn.Provider === 'google') ? (
                        <>
                          <h4 className="text-sm font-medium text-gray-900">Google</h4>
                          <p className="text-sm text-gray-500">
                            Đã kết nối với tài khoản {oauthConnections.find(conn => conn.Provider === 'google').Email}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-gray-900">Google</h4>
                          <p className="text-sm text-gray-500">Chưa kết nối với tài khoản Google</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {oauthConnections.find(conn => conn.Provider === 'google') ? (
                    <button 
                      onClick={() => handleDisconnectProvider('google')}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Ngắt kết nối
                    </button>
                  ) : (
                    <div>
                      <GoogleLogin
                        onSuccess={handleGoogleConnect}
                        onError={handleGoogleError}
                        theme="outline"
                        size="medium"
                        text="connect"
                      />
                    </div>
                  )}
                </div>

                {/* Facebook connection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg className="h-6 w-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      {oauthConnections.find(conn => conn.Provider === 'facebook') ? (
                        <>
                          <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                          <p className="text-sm text-gray-500">
                            Đã kết nối với tài khoản {oauthConnections.find(conn => conn.Provider === 'facebook').Name}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                          <p className="text-sm text-gray-500">Chưa kết nối với tài khoản Facebook</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {oauthConnections.find(conn => conn.Provider === 'facebook') ? (
                    <button 
                      onClick={() => handleDisconnectProvider('facebook')}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Ngắt kết nối
                    </button>
                  ) : (
                    <FacebookLogin
                      appId={import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345'}
                      callback={handleFacebookConnect}
                      fields="name,email,picture"
                      render={renderProps => (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.location.protocol !== 'https:') {
                              toast.error('Facebook connection requires HTTPS; please use a secure connection.');
                              return;
                            }
                            renderProps.onClick();
                          }}
                          className="px-3 py-1 bg-blue-50 border border-blue-300 rounded text-sm text-blue-700 hover:bg-blue-100"
                        >
                          Kết nối
                        </button>
                      )}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="rounded-lg bg-red-50 border border-red-200">
            <div className="px-5 py-4 border-b border-red-200">
              <h3 className="text-lg font-medium text-red-800">Vùng nguy hiểm</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-red-800">Xóa tài khoản</h4>
                  <p className="text-sm text-red-700">Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-white border border-red-300 rounded text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-red-600">Xác nhận xóa tài khoản</h3>
                  <button 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteAccountData({
                        password: '',
                        reason: '',
                        confirmation: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleDeleteAccountSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={deleteAccountData.password}
                      onChange={handleDeleteAccountChange}
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Nhập mật khẩu để xác nhận"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Lý do xóa tài khoản (tùy chọn)
                    </label>
                    <textarea
                      name="reason"
                      value={deleteAccountData.reason}
                      onChange={handleDeleteAccountChange}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Hãy cho chúng tôi biết lý do bạn muốn xóa tài khoản"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Xác nhận xóa tài khoản
                    </label>
                    <p className="text-sm mb-2 text-gray-500">
                      Nhập "XÓA" để xác nhận rằng bạn muốn xóa tài khoản
                    </p>
                    <input
                      type="text"
                      name="confirmation"
                      value={deleteAccountData.confirmation}
                      onChange={handleDeleteAccountChange}
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  <div className="flex space-x-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex-1"
                    >
                      {loading ? "Đang xử lý..." : "Xóa vĩnh viễn tài khoản"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteAccountData({
                          password: '',
                          reason: '',
                          confirmation: ''
                        });
                      }}
                      className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex-1"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
