import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Ssh = () => {
  const dispatch = useDispatch();
  const titleInputRef = useRef(null);
  
  // Mock SSH keys data
  const [sshKeys, setSshKeys] = useState([
    {
      id: 'key-1',
      title: 'MacBook Pro',
      key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC6eNtGpNGwstc...', // truncated for display
      fingerprint: 'SHA256:uNPywzm9am5uAU2QDAyAZI6q38QJD8NmUyGyzKQRO8',
      createdAt: new Date(2023, 5, 15),
      lastUsed: new Date(2023, 10, 20)
    },
    {
      id: 'key-2',
      title: 'Work Laptop',
      key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM9+ZHVL8bKP...', // truncated for display
      fingerprint: 'SHA256:ZECCdUoQIQKJEIK+JKjY9wOPr0L5YmhT/AaA5/+',
      createdAt: new Date(2023, 8, 3),
      lastUsed: new Date(2023, 10, 25)
    }
  ]);
  
  // New SSH key form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    title: '',
    key: ''
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    setNewKey({
      ...newKey,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle add SSH key
  const handleAddKey = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newKey.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho khóa SSH');
      titleInputRef.current.focus();
      return;
    }
    
    if (!newKey.key.trim()) {
      toast.error('Vui lòng nhập khóa SSH công khai');
      return;
    }
    
    // Validate SSH key format (basic check)
    if (!isValidSSHKey(newKey.key)) {
      toast.error('Khóa SSH không hợp lệ. Vui lòng kiểm tra lại định dạng.');
      return;
    }
    
    // Generate a new key object
    const newKeyObj = {
      id: `key-${Date.now()}`,
      title: newKey.title,
      key: newKey.key,
      fingerprint: generateMockFingerprint(),
      createdAt: new Date(),
      lastUsed: null
    };
    
    // Add to state
    setSshKeys([...sshKeys, newKeyObj]);
    
    // Reset form
    setNewKey({
      title: '',
      key: ''
    });
    setShowAddForm(false);
    
    // Show success message
    toast.success('Đã thêm khóa SSH thành công');
  };
  
  // Handle delete SSH key
  const handleDeleteKey = (keyId) => {
    // Filter out the key to delete
    const updatedKeys = sshKeys.filter(key => key.id !== keyId);
    setSshKeys(updatedKeys);
    
    // Show success message
    toast.success('Đã xóa khóa SSH');
  };
  
  // Copy fingerprint to clipboard
  const handleCopyFingerprint = (fingerprint) => {
    navigator.clipboard.writeText(fingerprint)
      .then(() => {
        toast.success('Đã sao chép vân tay khóa vào clipboard');
      })
      .catch(() => {
        toast.error('Không thể sao chép vào clipboard');
      });
  };
  
  // Format date to locale string
  const formatDate = (date) => {
    if (!date) return 'Chưa sử dụng';
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Basic SSH key validation
  const isValidSSHKey = (key) => {
    // This is a very basic check - in a real app you would want more robust validation
    const trimmedKey = key.trim();
    return (
      (trimmedKey.startsWith('ssh-rsa ') || 
       trimmedKey.startsWith('ssh-ed25519 ') || 
       trimmedKey.startsWith('ssh-dss ') ||
       trimmedKey.startsWith('ecdsa-sha2-nistp')) && 
      trimmedKey.length > 50
    );
  };
  
  // Generate a mock fingerprint for demo purposes
  const generateMockFingerprint = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = 'SHA256:';
    for (let i = 0; i < 40; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Khóa SSH và GPG
      </h2>
      
      <div className="space-y-8">
        {/* SSH Keys Introduction */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Về khóa SSH</h4>
              <p className="mt-2 text-sm text-blue-700">
                Khóa SSH cho phép bạn thiết lập kết nối an toàn giữa máy tính của bạn và máy chủ của chúng tôi.
                Bạn có thể sử dụng khóa SSH để xác thực thay vì sử dụng mật khẩu khi thực hiện các thao tác như đẩy mã hoặc kết nối với máy chủ.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                <a href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                  Tìm hiểu thêm về khóa SSH
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* SSH Keys List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Khóa SSH</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-green-50 border border-green-300 rounded text-sm text-green-700 hover:bg-green-100 flex items-center"
              disabled={showAddForm}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span>Thêm khóa SSH</span>
            </button>
          </div>
          
          {/* Add SSH Key Form */}
          {showAddForm && (
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleAddKey} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    ref={titleInputRef}
                    value={newKey.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ví dụ: MacBook Pro"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Đặt tên mô tả để dễ dàng nhận biết khóa này (ví dụ: "Laptop cá nhân")
                  </p>
                </div>
                
                <div>
                  <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                    Khóa
                  </label>
                  <textarea
                    id="key"
                    name="key"
                    value={newKey.key}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    Dán khóa SSH công khai của bạn vào đây. Bắt đầu bằng "ssh-rsa", "ssh-ed25519", "ssh-dss", "ecdsa-sha2-nistp"...
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Thêm khóa SSH
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewKey({ title: '', key: '' });
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* SSH Keys List */}
          <div className="divide-y divide-gray-100">
            {sshKeys.length > 0 ? (
              sshKeys.map((sshKey) => (
                <div key={sshKey.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <KeyIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{sshKey.title}</h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="font-mono">{sshKey.fingerprint}</span>
                          <button 
                            onClick={() => handleCopyFingerprint(sshKey.fingerprint)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Sao chép vân tay khóa"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Thêm vào ngày {formatDate(sshKey.createdAt)} • 
                          {sshKey.lastUsed 
                            ? <span> Sử dụng lần cuối: {formatDate(sshKey.lastUsed)}</span>
                            : <span> Chưa được sử dụng</span>
                          }
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKey(sshKey.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Xóa khóa này"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-gray-500">
                {showAddForm 
                  ? "Điền thông tin để thêm khóa SSH đầu tiên của bạn"
                  : "Bạn chưa thêm khóa SSH nào. Nhấn 'Thêm khóa SSH' để bắt đầu."
                }
              </div>
            )}
          </div>
        </div>
        
        {/* GPG Keys */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Khóa GPG</h3>
            <button
              className="px-3 py-1.5 bg-green-50 border border-green-300 rounded text-sm text-green-700 hover:bg-green-100 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span>Thêm khóa GPG</span>
            </button>
          </div>
          <div className="p-5">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-6 w-6 text-gray-400 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Ký xác minh commit của bạn</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Sử dụng khóa GPG để ký commit và thẻ của bạn để người khác có thể xác minh rằng chúng thực sự đến từ bạn.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  <a href="https://docs.github.com/en/authentication/managing-commit-signature-verification" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                    Tìm hiểu thêm về việc ký xác minh commit
                  </a>
                </p>
              </div>
            </div>
            
            <div className="mt-5 text-center text-gray-500">
              Bạn chưa thêm khóa GPG nào. Nhấn 'Thêm khóa GPG' để bắt đầu.
            </div>
          </div>
        </div>
        
        {/* Security Tips */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-100 p-5">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-900">Lưu ý bảo mật</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-2">
                <li>• Không bao giờ chia sẻ khóa riêng tư SSH của bạn với người khác</li>
                <li>• Chỉ thêm khóa công khai SSH vào tài khoản của bạn</li>
                <li>• Xem xét sử dụng khóa SSH với mật khẩu để tăng cường bảo mật</li>
                <li>• Xóa khóa SSH không còn sử dụng hoặc có thể đã bị xâm phạm</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ssh;
