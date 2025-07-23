import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  ArchiveBoxIcon, 
  FolderIcon, 
  DocumentIcon,
  BookOpenIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const Archive = () => {
  const dispatch = useDispatch();
  
  // Mock archived items data
  const [archivedItems, setArchivedItems] = useState([
    {
      id: 'repo-1',
      name: 'CampusLearning-web',
      type: 'repository',
      description: 'Main web application for CampusLearning',
      archivedAt: new Date(2023, 8, 15),
      lastActive: new Date(2023, 7, 30),
      tags: ['react', 'javascript', 'web']
    },
    {
      id: 'project-1',
      name: 'Campus Redesign',
      type: 'project',
      description: 'Project for redesigning the campus website',
      archivedAt: new Date(2023, 9, 5),
      lastActive: new Date(2023, 8, 28),
      tags: ['design', 'ui/ux']
    },
    {
      id: 'course-1',
      name: 'Introduction to React',
      type: 'course',
      description: 'Beginner course for React development',
      archivedAt: new Date(2023, 7, 10),
      lastActive: new Date(2023, 6, 15),
      tags: ['react', 'tutorial']
    },
    {
      id: 'doc-1',
      name: 'API Documentation',
      type: 'document',
      description: 'Documentation for the CampusLearning API',
      archivedAt: new Date(2023, 10, 2),
      lastActive: new Date(2023, 9, 25),
      tags: ['api', 'documentation']
    }
  ]);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Get item type icon
  const getItemTypeIcon = (type, className = "h-5 w-5") => {
    switch (type) {
      case 'repository':
        return <FolderIcon className={className} />;
      case 'project':
        return <ArchiveBoxIcon className={className} />;
      case 'course':
        return <BookOpenIcon className={className} />;
      case 'document':
        return <DocumentIcon className={className} />;
      default:
        return <ArchiveBoxIcon className={className} />;
    }
  };
  
  // Handle restore item
  const handleRestoreItem = (itemId) => {
    // Filter out the restored item
    const updatedItems = archivedItems.filter(item => item.id !== itemId);
    setArchivedItems(updatedItems);
    
    // Show success message
    toast.success('Mục đã được khôi phục thành công');
  };
  
  // Handle delete item permanently
  const handleDeletePermanently = (itemId) => {
    // Confirm before deletion
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn mục này? Hành động này không thể hoàn tác.')) {
      // Filter out the deleted item
      const updatedItems = archivedItems.filter(item => item.id !== itemId);
      setArchivedItems(updatedItems);
      
      // Show success message
      toast.success('Mục đã được xóa vĩnh viễn');
    }
  };
  
  // Filter items by type and search query
  const filteredItems = archivedItems.filter(item => {
    const matchesType = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.archivedAt - a.archivedAt;
    } else if (sortOrder === 'oldest') {
      return a.archivedAt - b.archivedAt;
    } else if (sortOrder === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });
  
  // Get type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'repository': return 'Kho lưu trữ';
      case 'project': return 'Dự án';
      case 'course': return 'Khóa học';
      case 'document': return 'Tài liệu';
      default: return type;
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Kho lưu trữ
      </h2>
      
      <div className="space-y-8">
        {/* Archive Introduction */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
          <div className="flex items-start">
            <ArchiveBoxIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Về kho lưu trữ</h4>
              <p className="mt-2 text-sm text-blue-700">
                Kho lưu trữ chứa các mục đã được lưu trữ từ tài khoản của bạn. Các mục này không còn hiển thị trong danh sách chính
                nhưng vẫn có thể truy cập và khôi phục nếu cần.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                Các mục được lưu trữ sẽ tự động bị xóa sau 90 ngày trừ khi bạn khôi phục chúng.
              </p>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tìm kiếm và lọc</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Tìm kiếm</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Tìm kiếm theo tên hoặc mô tả"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative inline-block w-full md:w-auto">
                  <label htmlFor="type-filter" className="sr-only">Lọc theo loại</label>
                  <div className="flex">
                    <div className="relative flex items-center">
                      <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3" />
                      <select
                        id="type-filter"
                        name="type-filter"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10 py-2 text-base border-gray-300 rounded-md"
                      >
                        <option value="all">Tất cả loại</option>
                        <option value="repository">Kho lưu trữ</option>
                        <option value="project">Dự án</option>
                        <option value="course">Khóa học</option>
                        <option value="document">Tài liệu</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="relative inline-block w-full md:w-auto">
                  <label htmlFor="sort-order" className="sr-only">Sắp xếp theo</label>
                  <div className="flex">
                    <div className="relative flex items-center">
                      <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400 absolute left-3" />
                      <select
                        id="sort-order"
                        name="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 pl-10 pr-10 py-2 text-base border-gray-300 rounded-md"
                      >
                        <option value="newest">Mới nhất trước</option>
                        <option value="oldest">Cũ nhất trước</option>
                        <option value="name-asc">Tên (A-Z)</option>
                        <option value="name-desc">Tên (Z-A)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Archived Items List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Các mục đã lưu trữ</h3>
          </div>
          
          {sortedItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {sortedItems.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="mr-3 text-gray-400">
                          {getItemTypeIcon(item.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {getTypeLabel(item.type)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              Lưu trữ ngày {formatDate(item.archivedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-500 ml-8">
                        {item.description}
                      </p>
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500 ml-8">
                        <div className="flex items-center">
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          <span>Hoạt động cuối: {formatDate(item.lastActive)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1 ml-8">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                            #{tag}
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
                        onClick={() => handleRestoreItem(item.id)}
                        className="text-gray-400 hover:text-green-600"
                        title="Khôi phục mục này"
                      >
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePermanently(item.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Xóa vĩnh viễn"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có mục nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeFilter === 'all' && searchQuery === ''
                  ? 'Bạn chưa lưu trữ mục nào.'
                  : 'Không tìm thấy mục nào phù hợp với bộ lọc của bạn.'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Archive Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cài đặt lưu trữ</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Tự động xóa sau 90 ngày</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Tự động xóa các mục đã lưu trữ sau 90 ngày
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
                <h4 className="font-medium text-gray-900">Thông báo trước khi xóa</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Nhận thông báo trước khi các mục bị xóa tự động
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
            
            <div className="border-t border-gray-100 pt-5">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Xóa tất cả các mục đã lưu trữ
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Hành động này sẽ xóa vĩnh viễn tất cả các mục đã lưu trữ và không thể hoàn tác.
              </p>
            </div>
          </div>
        </div>
        
        {/* Archive Policy */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-start">
            <DocumentIcon className="h-6 w-6 text-gray-400 mt-0.5 mr-2" />
            <p className="text-sm text-gray-600">
              Theo chính sách lưu trữ của chúng tôi, các mục đã lưu trữ sẽ tự động bị xóa sau 90 ngày trừ khi được khôi phục.
              Để biết thêm chi tiết, vui lòng xem 
              <a href="#" className="text-blue-600 hover:text-blue-800 mx-1">chính sách lưu trữ</a> 
              của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
