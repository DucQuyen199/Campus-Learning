import React, { useState, useRef, useEffect } from 'react';
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
import securityKeyService from '../../services/securityKeyService';

const Ssh = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const titleInputRef = useRef(null);
  
  // State for SSH and GPG keys
  const [sshKeys, setSshKeys] = useState([]);
  const [gpgKeys, setGpgKeys] = useState([]);
  const [loading, setLoading] = useState({ ssh: false, gpg: false });
  
  // New SSH key form state
  const [showAddSSHForm, setShowAddSSHForm] = useState(false);
  const [newSSHKey, setNewSSHKey] = useState({
    title: '',
    key: ''
  });
  
  // New GPG key form state
  const [showAddGPGForm, setShowAddGPGForm] = useState(false);
  const [newGPGKey, setNewGPGKey] = useState({
    title: '',
    key: ''
  });
  
  // Fetch SSH and GPG keys on component mount
  useEffect(() => {
    fetchSSHKeys();
    fetchGPGKeys();
  }, []);
  
  // Fetch SSH keys from API
  const fetchSSHKeys = async () => {
    if (!token) return;
    
    setLoading(prev => ({ ...prev, ssh: true }));
    
    try {
      const response = await securityKeyService.getSSHKeys(token);
      
      if (response.success) {
        setSshKeys(response.keys || []);
      } else {
        toast.error('Không thể tải khóa SSH');
      }
    } catch (error) {
      console.error('Error fetching SSH keys:', error);
      toast.error('Đã xảy ra lỗi khi tải khóa SSH');
    } finally {
      setLoading(prev => ({ ...prev, ssh: false }));
    }
  };
  
  // Fetch GPG keys from API
  const fetchGPGKeys = async () => {
    if (!token) return;
    
    setLoading(prev => ({ ...prev, gpg: true }));
    
    try {
      const response = await securityKeyService.getGPGKeys(token);
      
      if (response.success) {
        setGpgKeys(response.keys || []);
      } else {
        toast.error('Không thể tải khóa GPG');
      }
    } catch (error) {
      console.error('Error fetching GPG keys:', error);
      toast.error('Đã xảy ra lỗi khi tải khóa GPG');
    } finally {
      setLoading(prev => ({ ...prev, gpg: false }));
    }
  };
  
  // Handle SSH key form input changes
  const handleSSHInputChange = (e) => {
    setNewSSHKey({
      ...newSSHKey,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle GPG key form input changes
  const handleGPGInputChange = (e) => {
    setNewGPGKey({
      ...newGPGKey,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle add SSH key
  const handleAddSSHKey = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newSSHKey.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho khóa SSH');
      titleInputRef.current.focus();
      return;
    }
    
    if (!newSSHKey.key.trim()) {
      toast.error('Vui lòng nhập khóa SSH công khai');
      return;
    }
    
    // Validate SSH key format (basic check)
    if (!isValidSSHKey(newSSHKey.key)) {
      toast.error('Khóa SSH không hợp lệ. Vui lòng kiểm tra lại định dạng.');
      return;
    }
    
    try {
      const response = await securityKeyService.addSSHKey(token, {
        title: newSSHKey.title,
        key: newSSHKey.key
      });
      
      if (response.success) {
        // Refresh SSH keys list
        fetchSSHKeys();
        
        // Reset form
        setNewSSHKey({
          title: '',
          key: ''
        });
        setShowAddSSHForm(false);
        
        // Show success message
        toast.success('Đã thêm khóa SSH thành công');
      } else {
        toast.error(response.message || 'Không thể thêm khóa SSH');
      }
    } catch (error) {
      console.error('Error adding SSH key:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi thêm khóa SSH');
    }
  };
  
  // Handle add GPG key
  const handleAddGPGKey = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newGPGKey.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho khóa GPG');
      return;
    }
    
    if (!newGPGKey.key.trim()) {
      toast.error('Vui lòng nhập khóa GPG công khai');
      return;
    }
    
    try {
      const response = await securityKeyService.addGPGKey(token, {
        title: newGPGKey.title,
        key: newGPGKey.key
      });
      
      if (response.success) {
        // Refresh GPG keys list
        fetchGPGKeys();
        
        // Reset form
        setNewGPGKey({
          title: '',
          key: ''
        });
        setShowAddGPGForm(false);
        
        // Show success message
        toast.success('Đã thêm khóa GPG thành công');
      } else {
        toast.error(response.message || 'Không thể thêm khóa GPG');
      }
    } catch (error) {
      console.error('Error adding GPG key:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi thêm khóa GPG');
    }
  };
  
  // Handle delete SSH key
  const handleDeleteSSHKey = async (keyId) => {
    try {
      const response = await securityKeyService.deleteSSHKey(token, keyId);
      
      if (response.success) {
        // Refresh SSH keys list
        fetchSSHKeys();
        
        // Show success message
        toast.success('Đã xóa khóa SSH');
      } else {
        toast.error(response.message || 'Không thể xóa khóa SSH');
      }
    } catch (error) {
      console.error('Error deleting SSH key:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa khóa SSH');
    }
  };
  
  // Handle delete GPG key
  const handleDeleteGPGKey = async (keyId) => {
    try {
      const response = await securityKeyService.deleteGPGKey(token, keyId);
      
      if (response.success) {
        // Refresh GPG keys list
        fetchGPGKeys();
        
        // Show success message
        toast.success('Đã xóa khóa GPG');
      } else {
        toast.error(response.message || 'Không thể xóa khóa GPG');
      }
    } catch (error) {
      console.error('Error deleting GPG key:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa khóa GPG');
    }
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
    }).format(new Date(date));
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
  
  // Render methods for SSH key items
  const renderSSHKey = (sshKey) => {
    // Handle different property casing (KeyID or id, Title or title, etc.)
    const keyId = sshKey.KeyID || sshKey.keyID || sshKey.id;
    const title = sshKey.Title || sshKey.title;
    const fingerprint = sshKey.Fingerprint || sshKey.fingerprint;
    const createdAt = sshKey.CreatedAt || sshKey.createdAt;
    const lastUsedAt = sshKey.LastUsedAt || sshKey.lastUsedAt || sshKey.lastUsed;

    return (
      <div key={keyId} className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <KeyIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span className="font-mono">{fingerprint}</span>
                <button 
                  onClick={() => handleCopyFingerprint(fingerprint)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="Sao chép vân tay khóa"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Thêm vào ngày {formatDate(createdAt)} • 
                {lastUsedAt 
                  ? <span> Sử dụng lần cuối: {formatDate(lastUsedAt)}</span>
                  : <span> Chưa được sử dụng</span>
                }
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDeleteSSHKey(keyId)}
            className="text-gray-400 hover:text-red-600"
            title="Xóa khóa này"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render methods for GPG key items
  const renderGPGKey = (gpgKey) => {
    // Handle different property casing (KeyID or id, Title or title, etc.)
    const keyId = gpgKey.KeyID || gpgKey.keyID || gpgKey.id;
    const title = gpgKey.Title || gpgKey.title;
    const fingerprint = gpgKey.Fingerprint || gpgKey.fingerprint;
    const createdAt = gpgKey.CreatedAt || gpgKey.createdAt;
    const expiresAt = gpgKey.ExpiresAt || gpgKey.expiresAt;

    return (
      <div key={keyId} className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span className="font-mono">{fingerprint}</span>
                <button 
                  onClick={() => handleCopyFingerprint(fingerprint)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="Sao chép vân tay khóa"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Thêm vào ngày {formatDate(createdAt)}
                {expiresAt && <span> • Hết hạn vào: {formatDate(expiresAt)}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDeleteGPGKey(keyId)}
            className="text-gray-400 hover:text-red-600"
            title="Xóa khóa này"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
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
              onClick={() => setShowAddSSHForm(true)}
              className="px-3 py-1.5 bg-green-50 border border-green-300 rounded text-sm text-green-700 hover:bg-green-100 flex items-center"
              disabled={showAddSSHForm}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span>Thêm khóa SSH</span>
            </button>
          </div>
          
          {/* Add SSH Key Form */}
          {showAddSSHForm && (
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleAddSSHKey} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    ref={titleInputRef}
                    value={newSSHKey.title}
                    onChange={handleSSHInputChange}
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
                    value={newSSHKey.key}
                    onChange={handleSSHInputChange}
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
                      setShowAddSSHForm(false);
                      setNewSSHKey({ title: '', key: '' });
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
            {loading.ssh ? (
              <div className="p-5 text-center text-gray-500">
                Đang tải khóa SSH...
              </div>
            ) : sshKeys.length > 0 ? (
              sshKeys.map((sshKey) => renderSSHKey(sshKey))
            ) : (
              <div className="p-5 text-center text-gray-500">
                {showAddSSHForm 
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
              onClick={() => setShowAddGPGForm(true)}
              className="px-3 py-1.5 bg-green-50 border border-green-300 rounded text-sm text-green-700 hover:bg-green-100 flex items-center"
              disabled={showAddGPGForm}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span>Thêm khóa GPG</span>
            </button>
          </div>
          
          {/* Add GPG Key Form */}
          {showAddGPGForm && (
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleAddGPGKey} className="space-y-4">
                <div>
                  <label htmlFor="gpg-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="gpg-title"
                    name="title"
                    value={newGPGKey.title}
                    onChange={handleGPGInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ví dụ: GPG Key cho GitHub"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label htmlFor="gpg-key" className="block text-sm font-medium text-gray-700 mb-1">
                    Khóa
                  </label>
                  <textarea
                    id="gpg-key"
                    name="key"
                    value={newGPGKey.key}
                    onChange={handleGPGInputChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----..."
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    Dán khóa GPG công khai của bạn vào đây. Bắt đầu bằng "-----BEGIN PGP PUBLIC KEY BLOCK-----"
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Thêm khóa GPG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddGPGForm(false);
                      setNewGPGKey({ title: '', key: '' });
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* GPG Keys List */}
          <div className="divide-y divide-gray-100">
            {loading.gpg ? (
              <div className="p-5 text-center text-gray-500">
                Đang tải khóa GPG...
              </div>
            ) : gpgKeys.length > 0 ? (
              gpgKeys.map((gpgKey) => renderGPGKey(gpgKey))
            ) : (
              <div className="p-5">
                {showAddGPGForm ? (
                  <div className="text-center text-gray-500">
                    Điền thông tin để thêm khóa GPG đầu tiên của bạn
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start mb-4">
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
                    <div className="mt-3 text-center text-gray-500">
                      Bạn chưa thêm khóa GPG nào. Nhấn 'Thêm khóa GPG' để bắt đầu.
                    </div>
                  </div>
                )}
              </div>
            )}
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
