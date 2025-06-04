import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
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

const Privacy = () => {
  const dispatch = useDispatch();
  const { profileInfo } = useSelector(state => state.user);
  
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
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, we would dispatch an action to update privacy settings
    toast.success('Cài đặt quyền riêng tư đã được cập nhật');
  };
  
  // Handle data export
  const handleDataExport = () => {
    toast.info('Yêu cầu xuất dữ liệu đã được gửi. Bạn sẽ nhận được email khi dữ liệu sẵn sàng để tải xuống.');
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
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                <span>Xuất dữ liệu</span>
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
