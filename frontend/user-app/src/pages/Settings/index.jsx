import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, LockClosedIcon, BellIcon, ShieldCheckIcon, 
  Cog6ToothIcon, EyeIcon, ArrowLeftOnRectangleIcon, TrashIcon,
  ArrowPathIcon, PhotoIcon, XMarkIcon
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
    { id: 'general', label: 'Chung', icon: Cog6ToothIcon },
    { id: 'notifications', label: 'Thông báo', icon: BellIcon },
    { id: 'privacy', label: 'Quyền riêng tư', icon: EyeIcon },
    { id: 'security', label: 'Bảo mật', icon: ShieldCheckIcon },
    { id: 'account', label: 'Tài khoản', icon: UserIcon }
  ];

  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ToastContainer position="top-right" autoClose={5000} theme={darkMode ? 'dark' : 'light'} />
      
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quản lý tài khoản và cài đặt của bạn</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile Card & Sidebar */}
        <div className="lg:w-1/4">
          <div className={`mb-6 rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 text-center ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="relative inline-block">
                <div 
                  onClick={handleProfilePictureClick}
                  className="w-24 h-24 mx-auto rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-md relative group"
                >
                  {profileInfo.profileImage ? (
                    <img 
                      src={profileInfo.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <span className="text-3xl font-bold">
                        {profileInfo.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PhotoIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleProfilePictureChange}
                  accept="image/*" 
                />
              </div>
              <h2 className={`mt-4 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {profileInfo.fullName || 'Người dùng'}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                @{profileInfo.username || 'username'}
              </p>
              <div className="flex items-center justify-center mt-2">
                <div className={`h-2 w-2 rounded-full ${profileInfo.onlineStatus === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {profileInfo.onlineStatus === 'ONLINE' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? `${darkMode ? 'bg-blue-900' : 'bg-blue-50'} text-blue-600 font-medium` 
                      : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                  }`}
                >
                  <tab.icon className={`h-5 w-5 mr-3 ${
                    activeTab === tab.id ? 'text-blue-500' : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-3 mb-1 rounded-lg transition-all ${
              darkMode 
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } shadow-md`}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
        
        {/* Settings Content */}
        <div className="lg:w-3/4">
          <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* General Settings Tab */}
                  {activeTab === 'general' && (
                    <div>
                      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Cài đặt chung
                      </h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Theme Setting */}
                        <div className="space-y-4">
                          <label className={`block text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Giao diện
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div 
                              onClick={() => handleSettingChange('preferences', 'theme', 'light')}
                              className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                localSettings.preferences.theme === 'light' 
                                  ? 'border-blue-500 bg-blue-50 bg-opacity-50' 
                                  : darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="h-24 bg-white rounded-lg shadow-inner flex items-center justify-center mb-3">
                                <div className="w-3/4 h-4 bg-blue-500 rounded-md"></div>
                              </div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sáng</h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Giao diện nền sáng
                              </p>
                              {localSettings.preferences.theme === 'light' && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            
                            <div 
                              onClick={() => handleSettingChange('preferences', 'theme', 'dark')}
                              className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                localSettings.preferences.theme === 'dark' 
                                  ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                                  : darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="h-24 bg-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                                <div className="w-3/4 h-4 bg-blue-400 rounded-md"></div>
                              </div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tối</h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Giao diện nền tối
                              </p>
                              {localSettings.preferences.theme === 'dark' && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            
                            <div 
                              onClick={() => handleSettingChange('preferences', 'theme', 'system')}
                              className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                                localSettings.preferences.theme === 'system' 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 bg-opacity-50 dark:bg-opacity-20' 
                                  : darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="h-24 bg-gradient-to-r from-white to-gray-900 rounded-lg shadow-inner flex items-center justify-center mb-3">
                                <div className="w-3/4 h-4 bg-purple-500 rounded-md"></div>
                              </div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Hệ thống</h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Tự động theo hệ thống
                              </p>
                              {localSettings.preferences.theme === 'system' && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Language Setting */}
                        <div className="space-y-4">
                          <label className={`block text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Ngôn ngữ
                          </label>
                          <div className="max-w-md">
                            <div className={`
                              relative rounded-lg overflow-hidden 
                              ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} 
                              border shadow-sm
                            `}>
                              <select
                                value={localSettings.preferences.language}
                                onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                                className={`
                                  block w-full px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                  ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}
                                `}
                              >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <svg className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Font Size Setting */}
                        <div className="space-y-4">
                          <label className={`block text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Cỡ chữ
                          </label>
                          <div className="max-w-md">
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => handleSettingChange('preferences', 'fontSize', 'small')}
                                className={`
                                  px-4 py-2 rounded-lg font-medium text-sm focus:outline-none border-2
                                  ${localSettings.preferences.fontSize === 'small' ? 
                                    'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-400' : 
                                    darkMode ? 'border-gray-700 bg-gray-700 text-gray-300' : 'border-gray-200 bg-white text-gray-700'}
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
                                  ${localSettings.preferences.fontSize === 'medium' ? 
                                    'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-400' : 
                                    darkMode ? 'border-gray-700 bg-gray-700 text-gray-300' : 'border-gray-200 bg-white text-gray-700'}
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
                                  ${localSettings.preferences.fontSize === 'large' ? 
                                    'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-400' : 
                                    darkMode ? 'border-gray-700 bg-gray-700 text-gray-300' : 'border-gray-200 bg-white text-gray-700'}
                                  transition-colors
                                `}
                              >
                                Lớn
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`
                              px-6 py-3 rounded-lg text-white transition-all
                              ${loading ? 
                                'bg-blue-400 cursor-not-allowed' : 
                                'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                              flex items-center space-x-2
                            `}
                          >
                            {loading ? (
                              <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                <span>Đang lưu...</span>
                              </>
                            ) : (
                              <span>Lưu thay đổi</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Cài đặt thông báo
                      </h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {/* Email Notifications */}
                          <div className="flex items-center justify-between py-5">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Thông báo email
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Nhận thông báo qua email
                              </p>
                            </div>
                            <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.notifications.email}
                                  onChange={() => handleCheckboxChange('notifications', 'email')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-700 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                          </div>
                          
                          {/* Push Notifications */}
                          <div className="flex items-center justify-between py-5">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Thông báo đẩy
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Nhận thông báo trên thiết bị
                              </p>
                            </div>
                            <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.notifications.push}
                                  onChange={() => handleCheckboxChange('notifications', 'push')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-700 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                          </div>
                          
                          {/* Course Updates */}
                          <div className="flex items-center justify-between py-5">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Cập nhật khóa học
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Thông báo khi khóa học có cập nhật mới
                              </p>
                            </div>
                            <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.notifications.courseUpdates}
                                  onChange={() => handleCheckboxChange('notifications', 'courseUpdates')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-700 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                          </div>
                          
                          {/* Exam Reminders */}
                          <div className="flex items-center justify-between py-5">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Nhắc nhở kỳ thi
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Thông báo sắp đến kỳ thi
                              </p>
                            </div>
                            <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.notifications.examReminders}
                                  onChange={() => handleCheckboxChange('notifications', 'examReminders')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-700 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                          </div>
                          
                          {/* Messages */}
                          <div className="flex items-center justify-between py-5">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Tin nhắn
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Thông báo khi có tin nhắn mới
                              </p>
                            </div>
                            <div className="ml-3">
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.notifications.messages}
                                  onChange={() => handleCheckboxChange('notifications', 'messages')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-700 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`
                              px-6 py-3 rounded-lg text-white transition-all
                              ${loading ? 
                                'bg-blue-400 cursor-not-allowed' : 
                                'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                              flex items-center space-x-2
                            `}
                          >
                            {loading ? (
                              <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                <span>Đang lưu...</span>
                              </>
                            ) : (
                              <span>Lưu thay đổi</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Privacy Tab */}
                  {activeTab === 'privacy' && (
                    <div>
                      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Quyền riêng tư
                      </h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Profile Visibility */}
                        <div className="space-y-4">
                          <label className={`block text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Hiển thị hồ sơ
                          </label>
                          <div className="max-w-md">
                            <div className={`
                              relative rounded-lg overflow-hidden 
                              ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} 
                              border shadow-sm
                            `}>
                              <select
                                value={localSettings.privacy.profileVisibility}
                                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                                className={`
                                  block w-full px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                  ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}
                                `}
                              >
                                <option value="public">Công khai</option>
                                <option value="friends">Bạn bè</option>
                                <option value="private">Riêng tư</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <svg className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Ai có thể xem thông tin hồ sơ của bạn
                            </p>
                          </div>
                        </div>
                        
                        {/* Privacy Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Online Status */}
                          <div className={`
                            rounded-xl p-5 border
                            ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                            shadow-sm
                          `}>
                            <div className="flex justify-between mb-4">
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Hiển thị trạng thái trực tuyến
                              </h3>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.privacy.showOnlineStatus}
                                  onChange={() => handleCheckboxChange('privacy', 'showOnlineStatus')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-11 h-6 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-5 after:w-5
                                  after:transition-all peer-checked:after:translate-x-5
                                  ${darkMode ? 
                                    'peer bg-gray-600 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Hiển thị khi bạn đang hoạt động trên hệ thống
                            </p>
                            
                            <div className={`
                              mt-4 p-3 rounded-lg text-sm
                              ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}
                            `}>
                              <div className="flex items-center">
                                <div className={`
                                  h-2 w-2 rounded-full 
                                  ${localSettings.privacy.showOnlineStatus ? 'bg-green-500' : 'bg-gray-400'}
                                  mr-2
                                `}></div>
                                <span>
                                  {localSettings.privacy.showOnlineStatus ? 'Đang hoạt động' : 'Ẩn'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Message Privacy */}
                          <div className={`
                            rounded-xl p-5 border
                            ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                            shadow-sm
                          `}>
                            <h3 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Quyền nhắn tin
                            </h3>
                            
                            <div className="space-y-2">
                              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                <input
                                  type="radio"
                                  name="allowMessages"
                                  checked={localSettings.privacy.allowMessages === 'all'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'all')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Tất cả mọi người</span>
                              </label>
                              
                              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                <input
                                  type="radio"
                                  name="allowMessages"
                                  checked={localSettings.privacy.allowMessages === 'friends'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'friends')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Chỉ bạn bè</span>
                              </label>
                              
                              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                <input
                                  type="radio"
                                  name="allowMessages"
                                  checked={localSettings.privacy.allowMessages === 'none'}
                                  onChange={() => handleSettingChange('privacy', 'allowMessages', 'none')}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 block">Không ai</span>
                              </label>
                            </div>
                            
                            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Ai có thể gửi tin nhắn cho bạn
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className={`
                              px-6 py-3 rounded-lg text-white transition-all
                              ${loading ? 
                                'bg-blue-400 cursor-not-allowed' : 
                                'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                              flex items-center space-x-2
                            `}
                          >
                            {loading ? (
                              <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                <span>Đang lưu...</span>
                              </>
                            ) : (
                              <span>Lưu thay đổi</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div>
                      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Bảo mật
                      </h2>
                      
                      <div className="space-y-8">
                        {/* Security settings form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                          {/* 2FA */}
                          <div className={`
                            rounded-xl p-5 border
                            ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                            shadow-sm
                          `}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Xác thực hai lớp (2FA)
                                </h3>
                                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Tăng cường bảo mật cho tài khoản của bạn
                                </p>
                              </div>
                              <label className="relative inline-flex cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={localSettings.security.twoFactorAuth}
                                  onChange={() => handleCheckboxChange('security', 'twoFactorAuth')}
                                  className="sr-only peer"
                                />
                                <div className={`
                                  w-14 h-7 rounded-full
                                  peer-focus:ring-4 peer-focus:ring-blue-300
                                  after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                  after:bg-white after:rounded-full after:h-6 after:w-6
                                  after:transition-all peer-checked:after:translate-x-7
                                  ${darkMode ? 
                                    'peer bg-gray-600 peer-checked:bg-blue-600' : 
                                    'peer bg-gray-200 peer-checked:bg-blue-600'}
                                `}></div>
                              </label>
                            </div>
                            
                            {localSettings.security.twoFactorAuth && (
                              <div className={`
                                mt-4 p-4 rounded-lg 
                                ${darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}
                                border ${darkMode ? 'border-blue-800' : 'border-blue-200'}
                              `}>
                                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                  Khi bật xác thực hai lớp, bạn sẽ được yêu cầu nhập mã xác thực từ ứng dụng xác thực của bạn mỗi khi đăng nhập.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Session Timeout */}
                          <div className="space-y-4">
                            <label className={`block text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              Thời gian hết phiên
                            </label>
                            <div className="max-w-md">
                              <div className={`
                                relative rounded-lg overflow-hidden 
                                ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} 
                                border shadow-sm
                              `}>
                                <select
                                  value={localSettings.security.sessionTimeout}
                                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                                  className={`
                                    block w-full px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                    ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}
                                  `}
                                >
                                  <option value="15">15 phút</option>
                                  <option value="30">30 phút</option>
                                  <option value="60">1 giờ</option>
                                  <option value="120">2 giờ</option>
                                  <option value="240">4 giờ</option>
                                  <option value="480">8 giờ</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                  <svg className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Thời gian không hoạt động trước khi đăng xuất tự động
                              </p>
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <button
                              type="submit"
                              disabled={loading}
                              className={`
                                px-6 py-3 rounded-lg text-white transition-all
                                ${loading ? 
                                  'bg-blue-400 cursor-not-allowed' : 
                                  'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                                flex items-center space-x-2
                              `}
                            >
                              {loading ? (
                                <>
                                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <span>Lưu thay đổi</span>
                              )}
                            </button>
                          </div>
                        </form>
                        
                        {/* Password Change Section */}
                        <div className={`
                          mt-8 pt-8 border-t
                          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                        `}>
                          <h3 className={`text-xl font-medium mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Thay đổi mật khẩu
                          </h3>
                          
                          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Mật khẩu hiện tại
                              </label>
                              <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                className={`
                                  w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  ${darkMode ? 
                                    'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                    'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                `}
                                placeholder="Nhập mật khẩu hiện tại"
                              />
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Mật khẩu mới
                              </label>
                              <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={8}
                                className={`
                                  w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  ${darkMode ? 
                                    'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                    'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                `}
                                placeholder="Tối thiểu 8 ký tự"
                              />
                              <p className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Mật khẩu phải có ít nhất 8 ký tự.
                              </p>
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Xác nhận mật khẩu mới
                              </label>
                              <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                className={`
                                  w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  ${darkMode ? 
                                    'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                    'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                `}
                                placeholder="Nhập lại mật khẩu mới"
                              />
                            </div>
                            
                            <div className="pt-2">
                              <button
                                type="submit"
                                disabled={loading}
                                className={`
                                  w-full px-6 py-3 rounded-lg text-white font-medium transition-all
                                  ${loading ? 
                                    'bg-blue-400 cursor-not-allowed' : 
                                    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                                  flex items-center justify-center space-x-2
                                `}
                              >
                                {loading ? (
                                  <>
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    <span>Đang cập nhật...</span>
                                  </>
                                ) : (
                                  <span>Cập nhật mật khẩu</span>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Account Tab */}
                  {activeTab === 'account' && (
                    <div>
                      <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Quản lý tài khoản
                      </h2>
                      
                      <div className="space-y-8">
                        {/* Account info card */}
                        <div className={`
                          rounded-xl p-5 border
                          ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                          shadow-sm
                        `}>
                          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Thông tin tài khoản
                          </h3>
                          
                          <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Tên người dùng:</span>
                              <span className="font-medium">{profileInfo.username || 'username'}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Tên hiển thị:</span>
                              <span className="font-medium">{profileInfo.fullName || 'Chưa cập nhật'}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Email:</span>
                              <div className="flex items-center">
                                <span className="font-medium mr-2">{profileInfo.Email || profileInfo.email || 'Chưa cập nhật'}</span>
                                {(profileInfo.EmailVerified === true || profileInfo.emailVerified === true) ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Đã xác thực
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Chưa xác thực
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Trạng thái:</span>
                              <div className="flex items-center">
                                <div className={`
                                  h-2 w-2 rounded-full mr-2
                                  ${profileInfo.onlineStatus === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'}
                                `}></div>
                                <span className="font-medium">
                                  {profileInfo.onlineStatus === 'ONLINE' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Logout Section */}
                        <div className={`
                          rounded-xl p-5 border
                          ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                          shadow-sm
                        `}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Đăng xuất
                              </h3>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Đăng xuất khỏi tài khoản của bạn trên thiết bị này
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                              Đăng xuất
                            </button>
                          </div>
                        </div>
                        
                        {/* Danger Zone */}
                        <div className={`
                          mt-8 pt-8 border-t
                          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                        `}>
                          <div className="flex items-center mb-6">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                              <TrashIcon className="h-4 w-4 text-red-600" />
                            </div>
                            <h3 className="text-xl font-medium text-red-600">
                              Vùng nguy hiểm
                            </h3>
                          </div>
                          
                          {!showDeleteConfirm ? (
                            <div className={`
                              rounded-xl p-5 border border-red-200
                              ${darkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'}
                              shadow-sm
                            `}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="mb-4 sm:mb-0">
                                  <h3 className={`text-lg font-medium text-red-600 ${darkMode && 'text-red-400'}`}>
                                    Xóa tài khoản
                                  </h3>
                                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn
                                  </p>
                                  <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                                    Hành động này không thể hoàn tác!
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className={`
                                    inline-flex items-center justify-center px-5 py-2.5 rounded-lg 
                                    ${darkMode ? 
                                      'bg-red-900 bg-opacity-40 text-red-300 border border-red-800 hover:bg-opacity-60' : 
                                      'bg-white text-red-600 border border-red-300 hover:bg-red-50'}
                                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                                  `}
                                >
                                  <TrashIcon className="mr-2 h-5 w-5" />
                                  Xóa tài khoản
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`
                              rounded-xl p-6 border border-red-300
                              ${darkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'}
                              shadow-sm
                            `}>
                              <div className="flex items-center mb-4">
                                <XMarkIcon 
                                  className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-500"
                                  onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteAccountData({
                                      password: '',
                                      reason: '',
                                      confirmation: ''
                                    });
                                  }}
                                />
                                <h3 className={`text-lg font-medium ml-2 text-red-600 ${darkMode && 'text-red-400'}`}>
                                  Xác nhận xóa tài khoản
                                </h3>
                              </div>
                              
                              <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Hành động này sẽ xóa vĩnh viễn tài khoản của bạn và tất cả dữ liệu liên quan. Bạn sẽ không thể khôi phục lại tài khoản sau khi xóa.
                              </p>
                              
                              <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Mật khẩu
                                  </label>
                                  <input
                                    type="password"
                                    name="password"
                                    value={deleteAccountData.password}
                                    onChange={handleDeleteAccountChange}
                                    required
                                    className={`
                                      w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500
                                      ${darkMode ? 
                                        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                        'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                    `}
                                    placeholder="Nhập mật khẩu để xác nhận"
                                  />
                                </div>
                                
                                <div>
                                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Lý do xóa tài khoản (tùy chọn)
                                  </label>
                                  <textarea
                                    name="reason"
                                    value={deleteAccountData.reason}
                                    onChange={handleDeleteAccountChange}
                                    rows={3}
                                    className={`
                                      w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500
                                      ${darkMode ? 
                                        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                        'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                    `}
                                    placeholder="Hãy cho chúng tôi biết lý do bạn muốn xóa tài khoản"
                                  ></textarea>
                                </div>
                                
                                <div>
                                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Xác nhận xóa tài khoản
                                  </label>
                                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Nhập "XÓA" để xác nhận rằng bạn muốn xóa tài khoản
                                  </p>
                                  <input
                                    type="text"
                                    name="confirmation"
                                    value={deleteAccountData.confirmation}
                                    onChange={handleDeleteAccountChange}
                                    required
                                    className={`
                                      w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500
                                      ${darkMode ? 
                                        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
                                        'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                    `}
                                  />
                                </div>
                                
                                <div className="flex space-x-4 pt-2">
                                  <button
                                    type="submit"
                                    disabled={loading}
                                    className={`
                                      px-5 py-2 rounded-lg text-white transition-all flex-1
                                      ${loading ? 
                                        'bg-red-400 cursor-not-allowed' : 
                                        'bg-red-600 hover:bg-red-700 active:bg-red-800'}
                                      flex items-center justify-center space-x-2
                                    `}
                                  >
                                    {loading ? (
                                      <>
                                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                        <span>Đang xử lý...</span>
                                      </>
                                    ) : (
                                      <>
                                        <TrashIcon className="h-5 w-5 mr-2" />
                                        <span>Xác nhận xóa tài khoản</span>
                                      </>
                                    )}
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
                                    className={`
                                      px-5 py-2 rounded-lg flex-1
                                      ${darkMode ? 
                                        'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600' : 
                                        'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                      flex items-center justify-center
                                    `}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;