import React, { useState } from 'react';
import { useSendNotificationMutation } from '../../api/studentsApi';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NotificationForm = ({ selectedStudents, courseId = null, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo');
      return;
    }
    
    try {
      const response = await sendNotification({
        studentIds: selectedStudents.map(student => student.UserID),
        title,
        content,
        courseId: courseId || undefined
      }).unwrap();
      
      toast.success(response.message || 'Đã gửi thông báo thành công');
      setTitle('');
      setContent('');
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.data?.message || 'Không thể gửi thông báo');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gửi thông báo</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Gửi thông báo đến {selectedStudents.length} học viên đã chọn
        </p>
        <div className="max-h-24 overflow-y-auto text-xs bg-gray-50 p-2 rounded">
          {selectedStudents.map(student => (
            <div key={student.UserID} className="mb-1">
              {student.FullName} ({student.Email})
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề
          </label>
          <input
            id="notification-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Nhập tiêu đề thông báo"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="notification-content" className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung
          </label>
          <textarea
            id="notification-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Nhập nội dung thông báo"
            rows={4}
            required
          />
        </div>
        
        <div className="flex justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline mr-2"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationForm; 