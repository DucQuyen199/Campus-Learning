import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, LockClosedIcon, BellIcon, ShieldCheckIcon, 
  Cog6ToothIcon, EyeIcon, ArrowLeftOnRectangleIcon, TrashIcon,
  ArrowPathIcon, PhotoIcon, XMarkIcon, CreditCardIcon
} from '@heroicons/react/24/outline';
import { 
  getUserSettings, 
  updateUserSettings, 
  uploadProfilePicture, 
  changePassword, 
  deleteAccount,
  clearUserState
} from '@/store/slices/userSlice';
import { logout } from '@/store/slices/authSlice';

// Import Profile component
import Profile from './Profile';

// Import Payment Settings component
import PaymentSettings from './package';
import LoginSession from './Loginsession';
import Email from './Email';

// Import Privacy and SSH components
import Privacy from './privacy';
import Ssh from './Ssh';

// Import Archive, Codespace, and Package components
import Archive from './archive';
import Codespace from './codespace';
import Package from './package';

// Import Password component
import Password from './Password';

// Import Account component
import Account from './Account';

// Import Interface component
import Interface from './Interface';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const { settings, profileInfo, loading, error, success, message } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    reason: '',
    confirmation: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch user settings on component mount
  useEffect(() => {
    dispatch(getUserSettings());
  }, [dispatch]);

  // Initialize local settings when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings({...settings});
      if (settings.preferences?.theme === 'dark') {
        setDarkMode(true);
      }
    }
  }, [settings]);

  // Handle success and error messages
  useEffect(() => {
    if (success && message) {
      toast.success(message);
      dispatch(clearUserState());
    }
    if (error) {
      toast.error(error);
      dispatch(clearUserState());
    }
  }, [success, error, message, dispatch]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

    // Handle dark mode toggle
    if (category === 'preferences' && key === 'theme') {
      setDarkMode(value === 'dark');
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (category, key) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: !localSettings[category][key]
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

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      
      dispatch(uploadProfilePicture(formData));
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
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

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!localSettings || !profileInfo) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Hồ sơ cá nhân', icon: UserIcon },
    { id: 'account', label: 'Tài khoản', icon: Cog6ToothIcon },
    { id: 'appearance', label: 'Giao diện', icon: EyeIcon },
    { id: 'accessibility', label: 'Trợ năng', icon: UserIcon },
    { id: 'notifications', label: 'Thông báo', icon: BellIcon },
  ];

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white text-gray-900">
      <ToastContainer position="top-right" autoClose={5000} theme="light" />
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-1/4">
          <div className="mb-4">
            <div className="flex items-center">
                <div 
                  onClick={handleProfilePictureClick}
                className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mr-4 cursor-pointer relative group"
                >
                  {profileInfo.profileImage ? (
                    <img 
                      src={profileInfo.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-2xl font-bold">
                        {profileInfo.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PhotoIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleProfilePictureChange}
                  accept="image/*" 
                />
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                {profileInfo.fullName || 'Người dùng'}
              </h2>
                <p className="text-gray-600">
                  Tài khoản cá nhân của bạn
                </p>
              </div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
          <nav className="border-l-4 border-transparent">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                    activeTab === tab.id 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                style={{ marginLeft: '-1rem' }}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
          </nav>

          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Truy cập</h3>
            <nav className="border-l-4 border-transparent">
              <button
                onClick={() => handleTabChange('payment')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'payment' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Thanh toán và giấy phép</span>
              </button>
              <button
                onClick={() => handleTabChange('email')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'email' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Email</span>
              </button>
              <button
                onClick={() => handleTabChange('security')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'security' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Mật khẩu và xác thực</span>
              </button>
              <button
                onClick={() => handleTabChange('loginsession')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'loginsession' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Phiên đăng nhập</span>
              </button>
              <button
                onClick={() => handleTabChange('privacy')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'privacy' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Quyền riêng tư</span>
              </button>
              <button
                onClick={() => handleTabChange('ssh')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'ssh' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Khóa SSH và GPG</span>
              </button>
            </nav>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mã nguồn, quy hoạch và tự động hóa</h3>
            <nav className="border-l-4 border-transparent">
              <button
                onClick={() => handleTabChange('archive')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'archive' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Kho lưu trữ</span>
              </button>
              <button
                onClick={() => handleTabChange('codespace')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'codespace' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Không gian mã</span>
              </button>
              <button
                onClick={() => handleTabChange('package')}
                className={`flex items-center w-full px-4 py-2 mb-1 border-l-4 transition-all ${
                  activeTab === 'package' 
                    ? 'border-l-blue-500 text-black font-medium bg-blue-50' 
                    : 'border-l-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ marginLeft: '-1rem' }}
              >
                <span>Gói</span>
              </button>
            </nav>
          </div>

          <div className="mt-8">
          <button
            onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 mb-1 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-300 rounded-md"
          >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
            <span>Đăng xuất</span>
          </button>
          </div>
        </div>
        
        {/* Settings Content */}
        <div className="lg:w-3/4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                
                  {/* Payment Tab */}
                  {activeTab === 'payment' && <PaymentSettings />}
                  
                  {/* Email Tab */}
                  {activeTab === 'email' && <Email />}
                  
                  {/* Login Session Tab */}
                  {activeTab === 'loginsession' && <LoginSession />}

                  {/* Privacy Tab */}
                  {activeTab === 'privacy' && <Privacy />}

                  {/* SSH Tab */}
                  {activeTab === 'ssh' && <Ssh />}

                  {/* Archive Tab */}
                  {activeTab === 'archive' && <Archive />}

                  {/* Codespace Tab */}
                  {activeTab === 'codespace' && <Codespace />}

                  {/* Package Tab */}
                  {activeTab === 'package' && <Package />}

                  {/* Account Tab */}
                  {activeTab === 'account' && <Account />}

                  {/* General/Public Profile Tab */}
                  {activeTab === 'general' && (
                    <Profile />
                  )}
                  
                  {/* Security Tab */}
                  {activeTab === 'security' && <Password />}

                  {/* Appearance Tab */}
                  {activeTab === 'appearance' && <Interface />}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                    Thông báo
                      </h2>
                      
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="divide-y divide-gray-200">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between py-4">
                              <div>
                          <h3 className="font-medium text-gray-900">
                            Thông báo email
                                </h3>
                          <p className="text-sm mt-1 text-gray-500">
                            Nhận thông báo qua email
                                </p>
                              </div>
                        <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                              checked={localSettings?.notifications?.email}
                              onChange={() => handleCheckboxChange('notifications', 'email')}
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
                          
                      {/* Push Notifications */}
                      <div className="flex items-center justify-between py-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Thông báo đẩy
                          </h3>
                          <p className="text-sm mt-1 text-gray-500">
                            Nhận thông báo trên thiết bị
                              </p>
                            </div>
                        <div className="ml-3">
                          <label className="relative inline-flex cursor-pointer">
                              <input
                              type="checkbox"
                              checked={localSettings?.notifications?.push}
                              onChange={() => handleCheckboxChange('notifications', 'push')}
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
                            
                      {/* Course Updates */}
                      <div className="flex items-center justify-between py-4">
                            <div>
                          <h3 className="font-medium text-gray-900">
                            Cập nhật khóa học
                          </h3>
                          <p className="text-sm mt-1 text-gray-500">
                            Thông báo khi khóa học có cập nhật mới
                              </p>
                            </div>
                        <div className="ml-3">
                          <label className="relative inline-flex cursor-pointer">
                              <input
                              type="checkbox"
                              checked={localSettings?.notifications?.courseUpdates}
                              onChange={() => handleCheckboxChange('notifications', 'courseUpdates')}
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
                            
                    <div className="pt-6">
                              <button
                                type="submit"
                                disabled={loading}
                        className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                              >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                              </button>
                            </div>
                          </form>
                    </div>
                  )}
                  
                  {/* Accessibility Tab */}
                  {activeTab === 'accessibility' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                        Trợ năng
                      </h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Screen Reader */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Hỗ trợ trình đọc màn hình</h3>
                        </div>
                          <div className="p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Cải thiện trình đọc màn hình</h4>
                                <p className="text-sm text-gray-500">Tối ưu hóa trang web cho người dùng trình đọc màn hình</p>
                      </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.screenReader === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'screenReader')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Mô tả hình ảnh</h4>
                                <p className="text-sm text-gray-500">Hiển thị mô tả chi tiết cho hình ảnh</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.imageDescriptions === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'imageDescriptions')}
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

                        {/* Keyboard Navigation */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Điều hướng bàn phím</h3>
                          </div>
                          <div className="p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Chỉ báo tiêu điểm</h4>
                                <p className="text-sm text-gray-500">Hiển thị đường viền rõ ràng xung quanh phần tử đang được chọn</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.focusIndicator !== false}
                                  onChange={() => handleCheckboxChange('accessibility', 'focusIndicator')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Độ trễ phím (ms)
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="1000"
                                  step="50"
                                  value={localSettings?.accessibility?.keyboardDelay || 0}
                                  onChange={(e) => handleSettingChange('accessibility', 'keyboardDelay', parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 w-12 text-center">
                                  {localSettings?.accessibility?.keyboardDelay || 0}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Điều chỉnh độ trễ khi nhấn và giữ phím
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Motion & Animations */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Chuyển động & Hiệu ứng</h3>
                          </div>
                          <div className="p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Giảm chuyển động</h4>
                                <p className="text-sm text-gray-500">Giảm thiểu hoặc loại bỏ các hiệu ứng chuyển động</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.reducedMotion === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'reducedMotion')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Bỏ qua hiệu ứng</h4>
                                <p className="text-sm text-gray-500">Tắt các hiệu ứng đặc biệt như lấp lánh và hiệu ứng hover</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.disableEffects === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'disableEffects')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tốc độ hiệu ứng
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="50"
                                  max="200"
                                  step="10"
                                  value={localSettings?.accessibility?.animationSpeed || 100}
                                  onChange={(e) => handleSettingChange('accessibility', 'animationSpeed', parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 w-12 text-center">
                                  {localSettings?.accessibility?.animationSpeed || 100}%
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Điều chỉnh tốc độ hiệu ứng chuyển động (100% là bình thường)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Visual Adjustments */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Điều chỉnh hiển thị</h3>
                          </div>
                          <div className="p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Chế độ tương phản cao</h4>
                                <p className="text-sm text-gray-500">Tăng cường tương phản giữa văn bản và nền</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.highContrast === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'highContrast')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Khoảng cách chữ
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={localSettings?.accessibility?.letterSpacing || 0}
                                  onChange={(e) => handleSettingChange('accessibility', 'letterSpacing', parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 w-12 text-center">
                                  {localSettings?.accessibility?.letterSpacing || 0}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Điều chỉnh khoảng cách giữa các chữ cái
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Khoảng cách dòng
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="100"
                                  max="200"
                                  step="10"
                                  value={localSettings?.accessibility?.lineHeight || 150}
                                  onChange={(e) => handleSettingChange('accessibility', 'lineHeight', parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 w-12 text-center">
                                  {localSettings?.accessibility?.lineHeight || 150}%
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Điều chỉnh khoảng cách giữa các dòng chữ
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content Preferences */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Tùy chọn nội dung</h3>
                          </div>
                          <div className="p-5 space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Hiển thị phụ đề</h4>
                                <p className="text-sm text-gray-500">Tự động hiển thị phụ đề cho video và âm thanh</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.alwaysShowCaptions === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'alwaysShowCaptions')}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                    peer-focus:ring-4 peer-focus:ring-blue-300
                                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-5 after:w-5
                                    after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Tự động phát</h4>
                                <p className="text-sm text-gray-500">Ngăn tự động phát nội dung âm thanh và video</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.accessibility?.preventAutoplay === true}
                                  onChange={() => handleCheckboxChange('accessibility', 'preventAutoplay')}
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

                        <div className="pt-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;