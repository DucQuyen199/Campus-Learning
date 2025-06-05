import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  EnvelopeIcon, 
  ShieldCheckIcon, 
  PlusCircleIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { userServices } from '@/services/api';

const Email = () => {
  const dispatch = useDispatch();
  const { profileInfo } = useSelector(state => state.user);
  
  const [emails, setEmails] = useState([]);
  
  const [newEmail, setNewEmail] = useState('');
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [emailPrivacy, setEmailPrivacy] = useState(true);
  
  useEffect(() => {
    userServices.getEmails()
      .then(response => {
        setEmails(response.data.emails);
      })
      .catch(error => {
        console.error('Error fetching emails:', error);
        toast.error('Không thể tải danh sách email');
      });
  }, []);
  
  // Handle add new email
  const handleAddEmail = (e) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Vui lòng nhập một địa chỉ email hợp lệ');
      return;
    }
    
    // Call API to add email
    userServices.addEmail(newEmail)
      .then(() => {
        toast.success('Email đã được thêm. Vui lòng kiểm tra hộp thư để xác thực.');
        setNewEmail('');
        setShowAddEmail(false);
        // Refresh list
        return userServices.getEmails();
      })
      .then(res => setEmails(res.data.emails))
      .catch(error => {
        console.error('Error adding email:', error);
        toast.error('Có lỗi khi thêm email');
      });
  };
  
  // Handle make email primary
  const handleMakePrimary = (emailId) => {
    userServices.setPrimaryEmail(emailId)
      .then(() => {
        toast.success('Đã đặt email chính thành công');
        return userServices.getEmails();
      })
      .then(res => setEmails(res.data.emails))
      .catch(error => {
        console.error('Error setting primary email:', error);
        toast.error('Có lỗi khi đặt email chính');
      });
  };
  
  // Handle delete email
  const handleDeleteEmail = (emailId) => {
    userServices.deleteEmail(emailId)
      .then(() => {
        toast.success('Email đã được xóa');
        return userServices.getEmails();
      })
      .then(res => setEmails(res.data.emails))
      .catch(error => {
        console.error('Error deleting email:', error);
        toast.error(error.response?.data?.message || 'Có lỗi khi xóa email');
      });
  };
  
  // Handle resend verification
  const handleResendVerification = (emailId) => {
    userServices.resendVerificationEmail(emailId)
      .then(() => toast.info('Đã gửi lại email xác thực'))
      .catch(error => {
        console.error('Error resending verification:', error);
        toast.error('Có lỗi khi gửi lại email xác thực');
      });
  };
  
  // Handle email privacy toggle
  const handlePrivacyToggle = () => {
    setEmailPrivacy(!emailPrivacy);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Cài đặt Email
      </h2>
      
      <div className="space-y-8">
        {/* Email Privacy */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quyền riêng tư Email</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Giữ địa chỉ email riêng tư</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Chúng tôi sẽ tạo một địa chỉ chuyển tiếp để bảo vệ địa chỉ email thật của bạn
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailPrivacy}
                  onChange={handlePrivacyToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full peer bg-gray-200 peer-checked:bg-blue-600
                    peer-focus:ring-4 peer-focus:ring-blue-300
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
            
            {emailPrivacy && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <p className="text-sm text-blue-700">
                    Khi bạn thực hiện các thao tác dựa trên web, chúng tôi sẽ sử dụng 
                    <span className="font-mono mx-1">{profileInfo?.id || '12345'}+{profileInfo?.username || 'username'}@users.noreply.example.com</span> 
                    thay vì địa chỉ email thật của bạn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Email Addresses */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Địa chỉ Email</h3>
          </div>
          <div className="p-5">
            <div className="space-y-5">
              {emails.map((item) => (
                <div key={item.EmailID} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{item.Email}</span>
                        {item.IsPrimary && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Chính
                          </span>
                        )}
                        {item.IsVerified ? (
                          <span className="ml-2 inline-flex items-center text-green-600">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs">Đã xác thực</span>
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center text-yellow-600">
                            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs">Chưa xác thực</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Quyền riêng tư: {item.Visibility === 'private' ? 'Riêng tư' : 'Công khai'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!item.IsVerified && (
                      <button 
                        onClick={() => handleResendVerification(item.EmailID)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Gửi lại xác thực
                      </button>
                    )}
                    {!item.IsPrimary && item.IsVerified && (
                      <button 
                        onClick={() => handleMakePrimary(item.EmailID)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                      >
                        Đặt làm chính
                      </button>
                    )}
                    {!item.IsPrimary && (
                      <button 
                        onClick={() => handleDeleteEmail(item.EmailID)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {showAddEmail ? (
              <div className="mt-6">
                <form onSubmit={handleAddEmail} className="space-y-4">
                  <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Thêm địa chỉ email mới
                    </label>
                    <input
                      type="email"
                      id="newEmail"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Thêm email
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEmail(false)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddEmail(true)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-1" />
                  <span>Thêm địa chỉ email</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tùy chọn thông báo email</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Thông báo hoạt động</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Nhận email khi có hoạt động liên quan đến bạn
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
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
                <h4 className="font-medium text-gray-900">Cập nhật khóa học</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Nhận email khi khóa học của bạn có nội dung mới
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={true}
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
                <h4 className="font-medium text-gray-900">Tin tức và khuyến mãi</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Nhận thông tin về tính năng mới và ưu đãi đặc biệt
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={false}
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
        
        {/* Email Frequency */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tần suất email</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="emailFrequency"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 block text-gray-900">
                  Ngay lập tức
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="emailFrequency"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 block text-gray-900">
                  Hàng ngày
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="emailFrequency"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 block text-gray-900">
                  Hàng tuần
                </span>
              </label>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Tần suất bạn muốn nhận email thông báo (không áp dụng cho email xác thực và bảo mật)
            </p>
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
      </div>
    </div>
  );
};

export default Email;
