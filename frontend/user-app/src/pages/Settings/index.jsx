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
import PaymentSettings from './payment';
import LoginSession from './Loginsession';
import Email from './Email';

// Import Privacy and SSH components
import Privacy from './privacy';
import Ssh from './Ssh';

// Import Archive, Codespace, and Package components
import Archive from './archive';
import Codespace from './codespace';
import Package from './package';

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

                  {/* Other tabs remain the same */}
                  {/* General/Public Profile Tab */}
                  {activeTab === 'general' && (
                    <Profile />
                  )}
                  
                  {/* Security Tab */}
                  {activeTab === 'security' && (
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
                          
                    {/* 2FA Authentication */}
                    <div className="mt-10 pt-10 border-t border-gray-200">
                      <h3 className="text-lg font-medium mb-5 text-gray-800">
                        Xác thực hai lớp (2FA)
                              </h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                            <h4 className="font-medium text-gray-900">
                              Bảo vệ tài khoản của bạn
                            </h4>
                            <p className="text-sm mt-1 text-gray-600">
                              Thêm lớp bảo mật bổ sung để ngăn chặn truy cập trái phép vào tài khoản của bạn
                              </p>
                            </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                              checked={localSettings?.security?.twoFactorAuth}
                              onChange={() => handleCheckboxChange('security', 'twoFactorAuth')}
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
                        </div>
                    </div>
                  )}
                  
                  {/* Privacy Tab */}
                  {activeTab === 'privacy' && (
                    <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                        Quyền riêng tư
                      </h2>
                      
                  <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Visibility */}
                    <div className="space-y-2">
                      <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700">
                            Hiển thị hồ sơ
                          </label>
                      <div className="relative">
                              <select
                          id="profileVisibility"
                          value={localSettings?.privacy?.profileVisibility}
                                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="public">Công khai</option>
                          <option value="friends">Chỉ bạn bè</option>
                                <option value="private">Riêng tư</option>
                              </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </div>
                            </div>
                      <p className="text-xs text-gray-500">
                              Ai có thể xem thông tin hồ sơ của bạn
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Online Status */}
                      <div className="rounded-lg p-4 border border-gray-200 bg-white shadow-sm">
                        <div className="flex justify-between mb-3">
                          <h3 className="font-medium text-gray-900">
                                Hiển thị trạng thái trực tuyến
                              </h3>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                              name="showOnlineStatus"
                              checked={localSettings?.privacy?.showOnlineStatus}
                                  onChange={() => handleCheckboxChange('privacy', 'showOnlineStatus')}
                                  className="sr-only peer"
                                />
                            <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-5 after:w-5
                                 after:transition-all peer-checked:after:translate-x-5"></div>
                              </label>
                            </div>
                        <p className="text-sm text-gray-500">
                              Hiển thị khi bạn đang hoạt động trên hệ thống
                            </p>
                          </div>
                          
                          {/* Message Privacy */}
                      <div className="rounded-lg p-4 border border-gray-200 bg-white shadow-sm">
                        <h3 className="font-medium mb-3 text-gray-900">
                              Quyền nhắn tin
                            </h3>
                            
                            <div className="space-y-2">
                          <label className="flex items-center text-gray-900">
                                <input
                                  type="radio"
                                  name="allowMessages"
                              checked={localSettings?.privacy?.allowMessages === 'all'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'all')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Tất cả mọi người</span>
                              </label>
                              
                          <label className="flex items-center text-gray-900">
                                <input
                                  type="radio"
                                  name="allowMessages"
                              checked={localSettings?.privacy?.allowMessages === 'friends'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'friends')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Chỉ bạn bè</span>
                              </label>
                              
                          <label className="flex items-center text-gray-900">
                                <input
                                  type="radio"
                                  name="allowMessages"
                              checked={localSettings?.privacy?.allowMessages === 'none'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'none')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Không ai</span>
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
                  
                  {/* Account Tab */}
                  {activeTab === 'account' && (
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
                                  {profileInfo.username || 'username'}
                            </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email
                                </label>
                              <div className="flex items-center">
                                  <div className="text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 flex-1 mr-2">
                                    {profileInfo.email || 'email@example.com'}
                                  </div>
                                  {profileInfo.emailVerified ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Đã xác thực
                                  </span>
                                ) : (
                                    <button className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                      Xác thực ngay
                                    </button>
                                )}
                              </div>
                            </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày tham gia
                              </label>
                              <div className="text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                                {new Date().toLocaleDateString('vi-VN', {
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
                  )}

                  {/* Appearance Tab */}
                  {activeTab === 'appearance' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                        Giao diện
                      </h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Theme Selection */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Chủ đề</h3>
                          </div>
                          <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div 
                                onClick={() => handleSettingChange('preferences', 'theme', 'light')}
                                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                  localSettings?.preferences?.theme === 'light' 
                                    ? 'border-blue-500 bg-blue-50 bg-opacity-50' 
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="h-24 bg-white rounded-lg shadow-inner flex items-center justify-center mb-3">
                                  <div className="w-3/4 h-4 bg-blue-500 rounded-md"></div>
                                </div>
                                <h3 className="font-medium text-gray-900">Sáng</h3>
                                <p className="text-sm text-gray-500">
                                  Giao diện nền sáng
                                </p>
                                {localSettings?.preferences?.theme === 'light' && (
                                  <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <div 
                                onClick={() => handleSettingChange('preferences', 'theme', 'dark')}
                                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                  localSettings?.preferences?.theme === 'dark' 
                                    ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="h-24 bg-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                                  <div className="w-3/4 h-4 bg-blue-400 rounded-md"></div>
                                </div>
                                <h3 className="font-medium text-gray-900">Tối</h3>
                                <p className="text-sm text-gray-500">
                                  Giao diện nền tối
                                </p>
                                {localSettings?.preferences?.theme === 'dark' && (
                                  <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <div 
                                onClick={() => handleSettingChange('preferences', 'theme', 'system')}
                                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                  localSettings?.preferences?.theme === 'system' 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 bg-opacity-50 dark:bg-opacity-20' 
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="h-24 bg-gradient-to-r from-white to-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                                  <div className="w-3/4 h-4 bg-purple-500 rounded-md"></div>
                                </div>
                                <h3 className="font-medium text-gray-900">Hệ thống</h3>
                                <p className="text-sm text-gray-500">
                                  Tự động theo hệ thống
                                </p>
                                {localSettings?.preferences?.theme === 'system' && (
                                  <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Font Size */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Cỡ chữ</h3>
                          </div>
                          <div className="p-5">
                            <div className="max-w-md">
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange('preferences', 'fontSize', 'small')}
                                    className={`
                                    px-4 py-2 rounded-lg font-medium text-sm focus:outline-none border-2
                                    ${localSettings?.preferences?.fontSize === 'small' ? 
                                      'border-blue-500 bg-blue-50 text-blue-700' : 
                                      'border-gray-200 bg-white text-gray-700'}
                                    transition-colors
                                  `}
                                >
                                  Nhỏ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange('preferences', 'fontSize', 'medium')}
                                  className={`
                                    px-4 py-2 rounded-lg font-medium text-base focus:outline-none border-2
                                    ${localSettings?.preferences?.fontSize === 'medium' ? 
                                      'border-blue-500 bg-blue-50 text-blue-700' : 
                                      'border-gray-200 bg-white text-gray-700'}
                                    transition-colors
                                  `}
                                >
                                  Vừa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange('preferences', 'fontSize', 'large')}
                                  className={`
                                    px-4 py-2 rounded-lg font-medium text-lg focus:outline-none border-2
                                    ${localSettings?.preferences?.fontSize === 'large' ? 
                                      'border-blue-500 bg-blue-50 text-blue-700' : 
                                      'border-gray-200 bg-white text-gray-700'}
                                    transition-colors
                                  `}
                                >
                                  Lớn
                                </button>
                              </div>
                              <p className="mt-3 text-sm text-gray-500">
                                Điều chỉnh kích thước chữ cho toàn bộ ứng dụng
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Color Customization */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Màu sắc</h3>
                          </div>
                          <div className="p-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Màu chủ đạo
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                              {['blue', 'red', 'green', 'purple', 'orange'].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => handleSettingChange('preferences', 'accentColor', color)}
                                  className={`
                                    w-10 h-10 rounded-full focus:outline-none border-2
                                    ${localSettings?.preferences?.accentColor === color ? 'border-gray-600' : 'border-transparent'}
                                    transition-colors
                                  `}
                                  style={{
                                    backgroundColor: {
                                      blue: '#3b82f6',
                                      red: '#ef4444',
                                      green: '#10b981',
                                      purple: '#8b5cf6',
                                      orange: '#f97316'
                                    }[color]
                                  }}
                                  aria-label={`Màu ${color}`}
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              Thay đổi màu chủ đạo của giao diện người dùng
                            </p>
                          </div>
                        </div>

                        {/* Layout Options */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Bố cục</h3>
                          </div>
                          <div className="p-5 space-y-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hiển thị thanh bên
                              </label>
                              <div className="relative">
                                <select
                                  value={localSettings?.preferences?.sidebarPosition || 'left'}
                                  onChange={(e) => handleSettingChange('preferences', 'sidebarPosition', e.target.value)}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="left">Bên trái</option>
                                  <option value="right">Bên phải</option>
                                  <option value="hidden">Ẩn</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Vị trí hiển thị của thanh điều hướng bên
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Hiệu ứng chuyển động</h4>
                                <p className="text-sm text-gray-500">Bật/tắt hiệu ứng chuyển động trong giao diện người dùng</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.preferences?.animations !== false}
                                  onChange={() => handleCheckboxChange('preferences', 'animations')}
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
                                <h4 className="font-medium text-gray-900">Chế độ tiết kiệm dữ liệu</h4>
                                <p className="text-sm text-gray-500">Giảm tải hình ảnh và hiệu ứng để tiết kiệm dữ liệu</p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings?.preferences?.dataSaver === true}
                                  onChange={() => handleCheckboxChange('preferences', 'dataSaver')}
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

                        {/* Custom CSS */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">CSS tùy chỉnh</h3>
                          </div>
                          <div className="p-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã CSS tùy chỉnh
                              </label>
                              <textarea
                                rows="5"
                                placeholder="/* Nhập mã CSS tùy chỉnh của bạn tại đây */"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                              ></textarea>
                              <p className="mt-2 text-sm text-gray-500">
                                Thêm mã CSS tùy chỉnh để điều chỉnh giao diện người dùng. Cài đặt này chỉ áp dụng cho tài khoản của bạn.
                              </p>
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