/*-----------------------------------------------------------------
* File: codespace.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  CodeBracketIcon, 
  ComputerDesktopIcon, 
  ServerIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const Codespace = () => {
  const dispatch = useDispatch();
  
  // Mock codespace data
  const [codespaces, setCodespaces] = useState([
    {
      id: 'cs-1',
      name: 'CampusLearning-web-dev',
      repository: 'CampusLearning/CampusLearning-web',
      branch: 'main',
      status: 'running',
      createdAt: new Date(2023, 10, 15),
      lastUsed: new Date(2023, 10, 25),
      machine: {
        cpu: 4,
        memory: 8,
        storage: 32
      },
      expiresAt: new Date(2023, 11, 15)
    },
    {
      id: 'cs-2',
      name: 'api-feature-auth',
      repository: 'CampusLearning/CampusLearning-api',
      branch: 'feature/auth',
      status: 'stopped',
      createdAt: new Date(2023, 9, 20),
      lastUsed: new Date(2023, 10, 10),
      machine: {
        cpu: 2,
        memory: 4,
        storage: 16
      },
      expiresAt: new Date(2023, 11, 20)
    },
    {
      id: 'cs-3',
      name: 'mobile-app-dev',
      repository: 'CampusLearning/CampusLearning-mobile',
      branch: 'develop',
      status: 'stopped',
      createdAt: new Date(2023, 10, 5),
      lastUsed: new Date(2023, 10, 18),
      machine: {
        cpu: 4,
        memory: 8,
        storage: 32
      },
      expiresAt: new Date(2023, 11, 5)
    }
  ]);
  
  // Machine presets
  const machinePresets = [
    { id: 'basic', name: 'Cơ bản', cpu: 2, memory: 4, storage: 16 },
    { id: 'standard', name: 'Tiêu chuẩn', cpu: 4, memory: 8, storage: 32 },
    { id: 'premium', name: 'Cao cấp', cpu: 8, memory: 16, storage: 64 }
  ];
  
  // New codespace form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCodespace, setNewCodespace] = useState({
    repository: '',
    branch: 'main',
    machinePreset: 'standard'
  });
  
  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Format relative time
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
  
  // Handle start codespace
  const handleStartCodespace = (codespaceId) => {
    // Update codespace status
    const updatedCodespaces = codespaces.map(cs => {
      if (cs.id === codespaceId) {
        return {
          ...cs,
          status: 'running',
          lastUsed: new Date()
        };
      }
      return cs;
    });
    
    setCodespaces(updatedCodespaces);
    
    // Show success message
    toast.success('Codespace đã được khởi động');
  };
  
  // Handle stop codespace
  const handleStopCodespace = (codespaceId) => {
    // Update codespace status
    const updatedCodespaces = codespaces.map(cs => {
      if (cs.id === codespaceId) {
        return {
          ...cs,
          status: 'stopped'
        };
      }
      return cs;
    });
    
    setCodespaces(updatedCodespaces);
    
    // Show success message
    toast.success('Codespace đã được dừng');
  };
  
  // Handle delete codespace
  const handleDeleteCodespace = (codespaceId) => {
    // Confirm before deletion
    if (window.confirm('Bạn có chắc chắn muốn xóa codespace này? Tất cả dữ liệu không được commit sẽ bị mất.')) {
      // Filter out the deleted codespace
      const updatedCodespaces = codespaces.filter(cs => cs.id !== codespaceId);
      setCodespaces(updatedCodespaces);
      
      // Show success message
      toast.success('Codespace đã được xóa');
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    setNewCodespace({
      ...newCodespace,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle create codespace
  const handleCreateCodespace = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newCodespace.repository.trim()) {
      toast.error('Vui lòng chọn một repository');
      return;
    }
    
    // Get selected machine preset
    const selectedPreset = machinePresets.find(preset => preset.id === newCodespace.machinePreset);
    
    // Generate a new codespace object
    const newCodespaceObj = {
      id: `cs-${Date.now()}`,
      name: newCodespace.repository.split('/').pop() + '-' + newCodespace.branch.replace('/', '-'),
      repository: newCodespace.repository,
      branch: newCodespace.branch,
      status: 'starting',
      createdAt: new Date(),
      lastUsed: new Date(),
      machine: {
        cpu: selectedPreset.cpu,
        memory: selectedPreset.memory,
        storage: selectedPreset.storage
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    
    // Add to state
    setCodespaces([newCodespaceObj, ...codespaces]);
    
    // Reset form
    setNewCodespace({
      repository: '',
      branch: 'main',
      machinePreset: 'standard'
    });
    setShowCreateForm(false);
    
    // Show success message
    toast.success('Codespace đang được tạo');
    
    // Simulate codespace starting
    setTimeout(() => {
      setCodespaces(prevCodespaces => 
        prevCodespaces.map(cs => {
          if (cs.id === newCodespaceObj.id) {
            return {
              ...cs,
              status: 'running'
            };
          }
          return cs;
        })
      );
      toast.success('Codespace đã sẵn sàng để sử dụng');
    }, 3000);
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
            Đang chạy
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-2 h-2 mr-1 bg-gray-500 rounded-full"></span>
            Đã dừng
          </span>
        );
      case 'starting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="w-2 h-2 mr-1 bg-blue-500 rounded-full animate-pulse"></span>
            Đang khởi động
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Codespaces
      </h2>
      
      <div className="space-y-8">
        {/* Codespace Introduction */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
          <div className="flex items-start">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Về Codespaces</h4>
              <p className="mt-2 text-sm text-blue-700">
                Codespaces là môi trường phát triển dựa trên đám mây, cho phép bạn phát triển hoàn toàn trong trình duyệt.
                Mỗi codespace bao gồm một máy ảo với các công cụ, thư viện và runtime bạn cần để phát triển.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                  Tìm hiểu thêm về Codespaces
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Create Codespace Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Tạo codespace mới
          </button>
        </div>
        
        {/* Create Codespace Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tạo codespace mới</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreateCodespace} className="space-y-4">
                <div>
                  <label htmlFor="repository" className="block text-sm font-medium text-gray-700 mb-1">
                    Repository
                  </label>
                  <select
                    id="repository"
                    name="repository"
                    value={newCodespace.repository}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn repository</option>
                    <option value="CampusLearning/CampusLearning-web">CampusLearning/CampusLearning-web</option>
                    <option value="CampusLearning/CampusLearning-api">CampusLearning/CampusLearning-api</option>
                    <option value="CampusLearning/CampusLearning-mobile">CampusLearning/CampusLearning-mobile</option>
                    <option value="CampusLearning/CampusLearning-docs">CampusLearning/CampusLearning-docs</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    id="branch"
                    name="branch"
                    value={newCodespace.branch}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="main"
                  />
                </div>
                
                <div>
                  <label htmlFor="machinePreset" className="block text-sm font-medium text-gray-700 mb-1">
                    Cấu hình máy
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {machinePresets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`border rounded-lg p-4 cursor-pointer ${
                          newCodespace.machinePreset === preset.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setNewCodespace({...newCodespace, machinePreset: preset.id})}
                      >
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CpuChipIcon className="h-4 w-4 mr-1" />
                            <span>{preset.cpu} CPU</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <ServerIcon className="h-4 w-4 mr-1" />
                            <span>{preset.memory} GB RAM</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                            <span>{preset.storage} GB Storage</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RocketLaunchIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Tạo codespace
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Codespaces List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Codespaces của bạn</h3>
          </div>
          
          {codespaces.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {codespaces.map((cs) => (
                <div key={cs.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="mr-3 text-gray-400">
                          <ComputerDesktopIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{cs.name}</h4>
                          <div className="flex items-center mt-1">
                            {getStatusBadge(cs.status)}
                            <span className="text-xs text-gray-500 ml-2">
                              {cs.repository} • {cs.branch}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 ml-9 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <CpuChipIcon className="h-3 w-3 mr-1" />
                          <span>{cs.machine.cpu} CPU • {cs.machine.memory} GB RAM • {cs.machine.storage} GB</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>Sử dụng lần cuối: {formatRelativeTime(cs.lastUsed)}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          <span>Hết hạn: {formatDate(cs.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {cs.status === 'running' ? (
                        <button
                          onClick={() => handleStopCodespace(cs.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Dừng codespace"
                        >
                          <StopIcon className="h-5 w-5" />
                        </button>
                      ) : cs.status === 'stopped' ? (
                        <button
                          onClick={() => handleStartCodespace(cs.id)}
                          className="text-gray-400 hover:text-green-600"
                          title="Khởi động codespace"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => handleDeleteCodespace(cs.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Xóa codespace"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {cs.status === 'running' && (
                    <div className="mt-4 ml-9">
                      <button
                        className="px-3 py-1.5 bg-blue-50 border border-blue-300 rounded text-sm text-blue-700 hover:bg-blue-100"
                      >
                        Mở trong trình duyệt
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <ComputerDesktopIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có codespace nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bạn chưa tạo codespace nào. Hãy bắt đầu bằng cách tạo codespace đầu tiên của bạn.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Tạo codespace mới
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Codespace Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cài đặt Codespace</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tự động dừng sau thời gian không hoạt động</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Tự động dừng codespace sau một khoảng thời gian không hoạt động để tiết kiệm tài nguyên
                </p>
              </div>
              <div className="w-32">
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="30">30 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="120">2 giờ</option>
                  <option value="never">Không bao giờ</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tự động lưu thay đổi</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Tự động lưu các thay đổi vào repository của bạn
                </p>
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
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tự động đồng bộ dotfiles</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Đồng bộ các tệp cấu hình cá nhân của bạn với codespace
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
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
        
        {/* Billing Information */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thông tin thanh toán</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Thời gian sử dụng trong tháng này</h4>
                <div className="mt-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <span className="font-medium text-gray-900 mr-1">15 giờ</span> sử dụng
                  </div>
                  <div className="flex items-center text-gray-500 mt-1">
                    <span className="font-medium text-gray-900 mr-1">60 giờ</span> còn lại trong gói miễn phí
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Xem chi tiết thanh toán
                </a>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '20%'}}></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Bạn đã sử dụng 20% thời gian miễn phí trong tháng này
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Codespace;

