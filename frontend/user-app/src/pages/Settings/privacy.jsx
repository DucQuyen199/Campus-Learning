import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import settingsServices from '@/api/settings';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  GlobeAltIcon, 
  UserGroupIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { getUserSettings, updateUserSettings } from '@/store/slices/userSlice';

const Privacy = () => {
  const dispatch = useDispatch();
  const { settings, profileInfo } = useSelector(state => state.user);
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    searchEngineIndex: true,
    activityVisibility: 'followers',
    showOnlineStatus: true,
    allowMessages: 'friends',
    dataCollection: {
      analytics: true,
      personalization: true,
      thirdParty: false
    },
    contentPreferences: {
      adultContent: false,
      sensitiveContent: false
    }
  });
  
  const [exporting, setExporting] = useState(false);
  
  // Fetch settings on mount if not already loaded
  useEffect(() => {
    if (!settings) {
      dispatch(getUserSettings());
    }
  }, [dispatch, settings]);
  
  // When settings arrive, populate local state
  useEffect(() => {
    if (settings && settings.privacy) {
      setPrivacySettings(prev => ({
        ...prev,
        ...settings.privacy,
        // Deep merge nested objects to keep defaults when backend missing keys
        dataCollection: {
          ...prev.dataCollection,
          ...settings.privacy.dataCollection
        },
        contentPreferences: {
          ...prev.contentPreferences,
          ...settings.privacy.contentPreferences
        }
      }));
    }
  }, [settings]);
  
  // Handle toggle changes
  const handleToggle = (key) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: !privacySettings[key]
    });
  };
  
  // Handle nested toggle changes
  const handleNestedToggle = (category, key) => {
    setPrivacySettings({
      ...privacySettings,
      [category]: {
        ...privacySettings[category],
        [key]: !privacySettings[category][key]
      }
    });
  };
  
  // Handle select changes
  const handleSelectChange = (key, value) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Compose new settings object preserving other sections (notifications, preferences, security)
      const updatedSettings = {
        ...settings,
        privacy: {
          ...settings?.privacy,
          ...privacySettings
        }
      };

      await dispatch(updateUserSettings(updatedSettings)).unwrap();
      toast.success('Cài đặt quyền riêng tư đã được cập nhật');
    } catch (error) {
      console.error('Update privacy settings error:', error);
      toast.error(error?.message || 'Không thể cập nhật cài đặt');
    }
  };
  
  // Handle data export
  const handleDataExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await settingsServices.exportData();
      
      // Check if we got a direct download response
      if (response.data instanceof Blob) {
        // Handle direct file download
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Dữ liệu đã được tải xuống thành công.');
      } else {
        // Handle email notification
        toast.success('Yêu cầu xuất dữ liệu đã được gửi. Vui lòng kiểm tra email của bạn.');
      }
    } catch (err) {
      console.error('Export data error:', err);
      
      // More specific error handling
      if (err.code === 'ERR_NETWORK') {
        toast.error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau.');
      } else if (err.response?.status === 500) {
        toast.error('Lỗi máy chủ. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
      } else if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error(err?.response?.data?.message || 'Không thể xuất dữ liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Cài đặt quyền riêng tư
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Visibility */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Hiển thị hồ sơ</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 mb-1">
                Ai có thể xem hồ sơ của bạn
              </label>
              <select
                id="profileVisibility"
                value={privacySettings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Công khai (Mọi người)</option>
                <option value="registered">Người dùng đã đăng ký</option>
                <option value="followers">Người theo dõi</option>
                <option value="friends">Chỉ bạn bè</option>
                <option value="private">Riêng tư (Chỉ mình tôi)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Điều này xác định ai có thể xem thông tin hồ sơ của bạn, bao gồm tên, tiểu sử và các thông tin khác.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Hiển thị trạng thái trực tuyến</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép người khác biết khi nào bạn đang hoạt động trên hệ thống
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showOnlineStatus}
                  onChange={() => handleToggle('showOnlineStatus')}
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
                <h4 className="font-medium text-gray-900">Hiển thị trong kết quả tìm kiếm</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép các công cụ tìm kiếm như Google lập chỉ mục hồ sơ của bạn
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.searchEngineIndex}
                  onChange={() => handleToggle('searchEngineIndex')}
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
        
        {/* Activity Privacy */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quyền riêng tư hoạt động</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label htmlFor="activityVisibility" className="block text-sm font-medium text-gray-700 mb-1">
                Ai có thể xem hoạt động của bạn
              </label>
              <select
                id="activityVisibility"
                value={privacySettings.activityVisibility}
                onChange={(e) => handleSelectChange('activityVisibility', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Công khai (Mọi người)</option>
                <option value="registered">Người dùng đã đăng ký</option>
                <option value="followers">Người theo dõi</option>
                <option value="friends">Chỉ bạn bè</option>
                <option value="private">Riêng tư (Chỉ mình tôi)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Điều này xác định ai có thể xem hoạt động của bạn như bình luận, theo dõi và đóng góp.
              </p>
            </div>
            
            <div>
              <label htmlFor="allowMessages" className="block text-sm font-medium text-gray-700 mb-1">
                Ai có thể gửi tin nhắn cho bạn
              </label>
              <select
                id="allowMessages"
                value={privacySettings.allowMessages}
                onChange={(e) => handleSelectChange('allowMessages', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả mọi người</option>
                <option value="registered">Người dùng đã đăng ký</option>
                <option value="followers">Người theo dõi</option>
                <option value="friends">Chỉ bạn bè</option>
                <option value="none">Không ai</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Điều này xác định ai có thể gửi tin nhắn trực tiếp cho bạn.
              </p>
            </div>
          </div>
        </div>
        
        {/* Data Collection */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thu thập dữ liệu và cá nhân hóa</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Phân tích sử dụng</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép thu thập dữ liệu về cách bạn sử dụng dịch vụ để cải thiện trải nghiệm
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.dataCollection.analytics}
                  onChange={() => handleNestedToggle('dataCollection', 'analytics')}
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
                <h4 className="font-medium text-gray-900">Cá nhân hóa nội dung</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép sử dụng dữ liệu của bạn để cá nhân hóa nội dung và đề xuất
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.dataCollection.personalization}
                  onChange={() => handleNestedToggle('dataCollection', 'personalization')}
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
                <h4 className="font-medium text-gray-900">Chia sẻ dữ liệu với bên thứ ba</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép chia sẻ dữ liệu của bạn với các đối tác tin cậy
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.dataCollection.thirdParty}
                  onChange={() => handleNestedToggle('dataCollection', 'thirdParty')}
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
        
        {/* Content Preferences */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tùy chọn nội dung</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Hiển thị nội dung người lớn</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép hiển thị nội dung dành cho người lớn (18+)
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.contentPreferences.adultContent}
                  onChange={() => handleNestedToggle('contentPreferences', 'adultContent')}
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
                <h4 className="font-medium text-gray-900">Hiển thị nội dung nhạy cảm</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Cho phép hiển thị nội dung có thể gây khó chịu hoặc tranh cãi
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.contentPreferences.sensitiveContent}
                  onChange={() => handleNestedToggle('contentPreferences', 'sensitiveContent')}
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
        
        {/* Data Management */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quản lý dữ liệu của bạn</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Xuất dữ liệu của bạn</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Tải xuống bản sao dữ liệu cá nhân của bạn
                </p>
              </div>
              <button
                type="button"
                onClick={handleDataExport}
                disabled={exporting}
                className={`px-4 py-2 border rounded-md flex items-center ${
                  exporting 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    <span>Xuất dữ liệu</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="border-t border-gray-100 pt-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Sao chép dữ liệu</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Yêu cầu bản sao dữ liệu theo Quy định bảo vệ dữ liệu
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 flex items-center"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                  <span>Yêu cầu bản sao</span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-red-600">Xóa dữ liệu của bạn</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Yêu cầu xóa tất cả dữ liệu cá nhân của bạn
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-50 border border-red-300 rounded-md text-red-700 hover:bg-red-100 flex items-center"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  <span>Yêu cầu xóa dữ liệu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
      
      {/* Privacy Policy Link */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-600">
          Để tìm hiểu thêm về cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn, vui lòng xem 
          <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 mx-1">Chính sách quyền riêng tư</a> 
          và 
          <a href="/terms-of-service" className="text-blue-600 hover:text-blue-800 mx-1">Điều khoản dịch vụ</a> 
          của chúng tôi.
        </p>
      </div>
    </div>
  );
};

export default Privacy;
