import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  ComputerDesktopIcon, 
  DeviceTabletIcon, 
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ClockIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const LoginSession = () => {
  const dispatch = useDispatch();
  
  // Mock data for sessions
  const [sessions, setSessions] = useState([
    {
      id: 'session-1',
      device: 'desktop',
      browser: 'Chrome',
      os: 'Windows 10',
      ip: '192.168.1.1',
      location: 'Hồ Chí Minh, Việt Nam',
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isCurrent: true
    },
    {
      id: 'session-2',
      device: 'mobile',
      browser: 'Safari',
      os: 'iOS 15',
      ip: '192.168.1.2',
      location: 'Hà Nội, Việt Nam',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isCurrent: false
    },
    {
      id: 'session-3',
      device: 'tablet',
      browser: 'Firefox',
      os: 'Android 12',
      ip: '192.168.1.3',
      location: 'Đà Nẵng, Việt Nam',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isCurrent: false
    }
  ]);
  
  // Format date to relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
  };
  
  // Get device icon based on device type
  const getDeviceIcon = (device) => {
    switch (device) {
      case 'desktop':
        return <ComputerDesktopIcon className="h-8 w-8 text-gray-500" />;
      case 'tablet':
        return <DeviceTabletIcon className="h-8 w-8 text-gray-500" />;
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-8 w-8 text-gray-500" />;
      default:
        return <GlobeAltIcon className="h-8 w-8 text-gray-500" />;
    }
  };
  
  // Handle terminate session
  const handleTerminateSession = (sessionId) => {
    // Filter out the terminated session
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    // Show success message
    toast.success('Phiên đăng nhập đã được kết thúc');
    
    // In a real app, we would dispatch an action to terminate the session
  };
  
  // Handle terminate all other sessions
  const handleTerminateAllOtherSessions = () => {
    // Keep only the current session
    const currentSession = sessions.find(session => session.isCurrent);
    setSessions(currentSession ? [currentSession] : []);
    
    // Show success message
    toast.success('Tất cả các phiên khác đã được kết thúc');
    
    // In a real app, we would dispatch an action to terminate all other sessions
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Phiên đăng nhập
      </h2>
      
      <div className="space-y-8">
        {/* Current Session */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Phiên đăng nhập hiện tại</h3>
          </div>
          <div className="p-5">
            {sessions.filter(session => session.isCurrent).map(session => (
              <div key={session.id} className="flex items-start">
                <div className="mr-4 mt-1">
                  {getDeviceIcon(session.device)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900">
                      {session.browser} trên {session.os}
                    </h4>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Hiện tại
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <GlobeAltIcon className="h-4 w-4 mr-1" />
                      <span>{session.location} ({session.ip})</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Hoạt động {formatRelativeTime(session.lastActive)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Other Active Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Phiên đăng nhập khác</h3>
            {sessions.some(session => !session.isCurrent) && (
              <button
                onClick={handleTerminateAllOtherSessions}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Kết thúc tất cả phiên khác
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {sessions.filter(session => !session.isCurrent).length > 0 ? (
              sessions.filter(session => !session.isCurrent).map(session => (
                <div key={session.id} className="p-5 flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="mr-4 mt-1">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {session.browser} trên {session.os}
                      </h4>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <GlobeAltIcon className="h-4 w-4 mr-1" />
                          <span>{session.location} ({session.ip})</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Hoạt động {formatRelativeTime(session.lastActive)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Kết thúc phiên này"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-gray-500">
                Không có phiên đăng nhập nào khác
              </div>
            )}
          </div>
        </div>
        
        {/* Security Tips */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Mẹo bảo mật</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-2">
                <li>• Đảm bảo đăng xuất trên các thiết bị công cộng</li>
                <li>• Kiểm tra thường xuyên các phiên đăng nhập của bạn</li>
                <li>• Bật xác thực hai lớp để tăng cường bảo mật</li>
                <li>• Thay đổi mật khẩu ngay lập tức nếu bạn thấy phiên đăng nhập lạ</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Session History */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lịch sử đăng nhập</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">
              Hiển thị lịch sử đăng nhập trong 30 ngày qua. Nếu bạn thấy hoạt động đáng ngờ, hãy thay đổi mật khẩu của bạn ngay lập tức.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thiết bị
                    </th>
                    <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí
                    </th>
                    <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      Chrome trên Windows 10
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      Hồ Chí Minh, Việt Nam
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      Hôm nay, 10:30
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Thành công
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      Safari trên iOS 15
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      Hà Nội, Việt Nam
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      Hôm qua, 15:45
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Thành công
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      Firefox trên Ubuntu
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      Đà Nẵng, Việt Nam
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      3 ngày trước, 09:12
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Thất bại
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSession;
