import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { deleteAccount, updateUserSettings } from '@/store/slices/userSlice';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { userServices } from '@/services/api';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
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
                  checked={true}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Google</h4>
                  <p className="text-sm text-gray-500">Đã kết nối với tài khoản Google</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">Ngắt kết nối</button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                  <p className="text-sm text-gray-500">Chưa kết nối với tài khoản Facebook</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-50 border border-blue-300 rounded text-sm text-blue-700 hover:bg-blue-100">Kết nối</button>
            </div>
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
