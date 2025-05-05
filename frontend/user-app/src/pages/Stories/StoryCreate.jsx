import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  PaperClipIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const StoryCreate = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Tiêu đề không được để trống');
      return;
    }

    if (!content.trim() && media.length === 0) {
      toast.error('Nội dung không được để trống');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      media.forEach((file) => {
        formData.append('media', file);
      });

      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để tạo câu chuyện');
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        // Try to get more detailed error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tạo câu chuyện');
        } catch (jsonError) {
          throw new Error(`Lỗi ${response.status}: Không thể tạo câu chuyện`);
        }
      }

      const result = await response.json();
      
      toast.success('Câu chuyện đã được tạo thành công!');
      navigate('/stories');
    } catch (error) {
      console.error('Create story error:', error);
      setError(error.message || 'Có lỗi xảy ra khi tạo câu chuyện');
      toast.error(error.message || 'Có lỗi xảy ra khi tạo câu chuyện');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMedia([...media, ...files]);
    }
  };

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-2xl mx-auto mt-6">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-lg">Tạo câu chuyện mới</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-300 transition duration-200"
            placeholder="Nhập tiêu đề câu chuyện"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung
          </label>
          <div 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-300 transition duration-200"
          >
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full focus:outline-none bg-transparent resize-none"
              placeholder="Viết nội dung câu chuyện của bạn..."
            />
          </div>
        </div>

        {media.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-3">
              {media.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="h-32 w-32 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-0">
                          <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover relative z-10"
                          onLoad={(e) => {
                            // Remove spinner when image is loaded
                            const parent = e.target.parentNode;
                            const spinner = parent.querySelector('div.absolute');
                            if (spinner) spinner.remove();
                          }}
                        />
                      </>
                    ) : file.type.startsWith('video/') ? (
                      <div className="flex items-center justify-center h-full w-full bg-gray-800">
                        <VideoCameraIcon className="h-12 w-12 text-white opacity-70" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <PaperClipIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              <PhotoIcon className="h-5 w-5 text-green-500" />
              <span>Thêm ảnh/video</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !title.trim() && media.length === 0)}
            className={`px-6 py-2.5 rounded-lg font-medium ${
              loading || (!content.trim() && !title.trim() && media.length === 0)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang tạo...</span>
              </div>
            ) : (
              'Tạo câu chuyện'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryCreate;
