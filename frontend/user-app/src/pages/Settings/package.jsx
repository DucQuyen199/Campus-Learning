import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  ArchiveBoxIcon, 
  CubeIcon, 
  DocumentTextIcon,
  TagIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const Package = () => {
  const dispatch = useDispatch();
  
  // Mock package data
  const [packages, setPackages] = useState([
    {
      id: 'pkg-1',
      name: '@CampusLearning/ui-components',
      description: 'UI components for CampusLearning applications',
      version: '1.2.3',
      registry: 'npm',
      visibility: 'public',
      downloads: 1245,
      lastPublished: new Date(2023, 9, 15),
      tags: ['ui', 'react', 'components']
    },
    {
      id: 'pkg-2',
      name: '@CampusLearning/utils',
      description: 'Utility functions for CampusLearning applications',
      version: '0.8.5',
      registry: 'npm',
      visibility: 'public',
      downloads: 876,
      lastPublished: new Date(2023, 10, 5),
      tags: ['utils', 'helpers']
    },
    {
      id: 'pkg-3',
      name: 'CampusLearning-server',
      description: 'Docker image for CampusLearning server',
      version: '2.1.0',
      registry: 'docker',
      visibility: 'private',
      downloads: 53,
      lastPublished: new Date(2023, 8, 20),
      tags: ['server', 'docker', 'backend']
    }
  ]);
  
  // Filter state
  const [activeRegistry, setActiveRegistry] = useState('all');
  
  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Get registry icon
  const getRegistryIcon = (registry) => {
    switch (registry) {
      case 'npm':
        return (
          <div className="bg-red-100 p-1 rounded">
            <span className="text-red-600 font-semibold text-xs">npm</span>
          </div>
        );
      case 'docker':
        return (
          <div className="bg-blue-100 p-1 rounded">
            <span className="text-blue-600 font-semibold text-xs">docker</span>
          </div>
        );
      case 'maven':
        return (
          <div className="bg-green-100 p-1 rounded">
            <span className="text-green-600 font-semibold text-xs">maven</span>
          </div>
        );
      case 'nuget':
        return (
          <div className="bg-purple-100 p-1 rounded">
            <span className="text-purple-600 font-semibold text-xs">nuget</span>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-1 rounded">
            <span className="text-gray-600 font-semibold text-xs">{registry}</span>
          </div>
        );
    }
  };
  
  // Handle delete package
  const handleDeletePackage = (packageId) => {
    // Filter out the deleted package
    const updatedPackages = packages.filter(pkg => pkg.id !== packageId);
    setPackages(updatedPackages);
    
    // Show success message
    toast.success('Gói đã được xóa thành công');
  };
  
  // Filter packages by registry
  const filteredPackages = activeRegistry === 'all' 
    ? packages 
    : packages.filter(pkg => pkg.registry === activeRegistry);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Quản lý gói
      </h2>
      
      <div className="space-y-8">
        {/* Package Registry Introduction */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
          <div className="flex items-start">
            <CubeIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Về gói phần mềm</h4>
              <p className="mt-2 text-sm text-blue-700">
                Gói phần mềm là một cách để phân phối mã, thư viện hoặc ứng dụng của bạn cho người khác sử dụng.
                Bạn có thể xuất bản gói đến các registry khác nhau như npm, Docker Hub, Maven Central, NuGet, và nhiều nơi khác.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                  Tìm hiểu thêm về cách xuất bản gói
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Registry Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bộ lọc registry</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveRegistry('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeRegistry === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActiveRegistry('npm')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeRegistry === 'npm'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                npm
              </button>
              <button
                onClick={() => setActiveRegistry('docker')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeRegistry === 'docker'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Docker
              </button>
              <button
                onClick={() => setActiveRegistry('maven')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeRegistry === 'maven'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Maven
              </button>
              <button
                onClick={() => setActiveRegistry('nuget')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeRegistry === 'nuget'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                NuGet
              </button>
            </div>
          </div>
        </div>
        
        {/* Packages List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Gói của bạn</h3>
            <button
              className="px-3 py-1.5 bg-green-50 border border-green-300 rounded text-sm text-green-700 hover:bg-green-100 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <span>Xuất bản gói mới</span>
            </button>
          </div>
          
          {filteredPackages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                        <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          v{pkg.version}
                        </span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          pkg.visibility === 'public' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pkg.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                        </span>
                        <div className="ml-2">
                          {getRegistryIcon(pkg.registry)}
                        </div>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-500">
                        {pkg.description}
                      </p>
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <div className="flex items-center mr-4">
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          <span>{pkg.downloads.toLocaleString()} lượt tải</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          <span>Cập nhật: {formatDate(pkg.lastPublished)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pkg.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        className="text-gray-400 hover:text-blue-600"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Xóa gói"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có gói nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeRegistry === 'all' 
                  ? 'Bạn chưa xuất bản gói nào. Hãy bắt đầu bằng cách xuất bản gói đầu tiên của bạn.'
                  : `Bạn chưa xuất bản gói nào trên registry ${activeRegistry}.`
                }
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Xuất bản gói mới
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Package Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cài đặt gói</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tự động xuất bản</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Tự động xuất bản gói khi có thẻ mới được tạo
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
                <h4 className="font-medium text-gray-900">Thông báo về phiên bản mới</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Nhận thông báo khi có phiên bản mới của gói bạn sử dụng
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
                <h4 className="font-medium text-gray-900">Gói mặc định là riêng tư</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Đặt gói mới là riêng tư theo mặc định
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
        
        {/* Access Tokens */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Token truy cập</h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">
              Token truy cập cho phép bạn xác thực với các registry khác nhau để xuất bản và tải gói.
            </p>
            
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Tạo token truy cập
              </button>
            </div>
            
            <div className="mt-6 text-center text-gray-500 text-sm">
              Bạn chưa có token truy cập nào. Tạo token để bắt đầu xuất bản gói.
            </div>
          </div>
        </div>
        
        {/* Documentation Link */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-2" />
            <p className="text-sm text-gray-600">
              Để tìm hiểu thêm về cách xuất bản và quản lý gói, vui lòng xem 
              <a href="#" className="text-blue-600 hover:text-blue-800 mx-1">tài liệu hướng dẫn</a> 
              của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Package;
