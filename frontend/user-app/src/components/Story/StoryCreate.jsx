import React, { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon, VideoCameraIcon, PencilIcon } from '@heroicons/react/24/outline';

const StoryCreate = ({ onStoryCreated, onClose }) => {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1d4ed8'); // Default blue
  const [fontStyle, setFontStyle] = useState('font-sans');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const backgroundColors = [
    '#1d4ed8', // blue
    '#047857', // green
    '#7c3aed', // purple
    '#dc2626', // red
    '#ea580c', // orange
    '#4338ca', // indigo
  ];

  const fontStyles = [
    { name: 'Sans', value: 'font-sans' },
    { name: 'Serif', value: 'font-serif' },
    { name: 'Mono', value: 'font-mono' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      alert('Chỉ chấp nhận file ảnh hoặc video');
      return;
    }

    setMediaType(fileType);
    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      formData.append('mediaType', mediaType);
      formData.append('textContent', textContent);
      formData.append('backgroundColor', backgroundColor);
      formData.append('fontStyle', fontStyle);

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Không thể tạo story');
      }

      const data = await response.json();
      onStoryCreated(data.story);
      onClose();
    } catch (error) {
      console.error('Create story error:', error);
      alert('Không thể tạo story. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tạo Story mới</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          {/* Preview Area */}
          <div 
            className="relative w-full h-96 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: mediaType === 'text' ? backgroundColor : 'black' }}
          >
            {mediaType === 'text' ? (
              <p className={`text-white text-xl p-6 text-center ${fontStyle}`}>
                {textContent || 'Nhập nội dung của bạn...'}
              </p>
            ) : preview ? (
              mediaType === 'image' ? (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <video src={preview} className="w-full h-full object-contain" controls />
              )
            ) : (
              <div className="text-center text-gray-400">
                <p>Chưa có media được chọn</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMediaType('text')}
              className={`p-2 rounded-lg ${mediaType === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('image');
                fileInputRef.current?.click();
              }}
              className={`p-2 rounded-lg ${mediaType === 'image' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('video');
                fileInputRef.current?.click();
              }}
              className={`p-2 rounded-lg ${mediaType === 'video' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <VideoCameraIcon className="w-5 h-5" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
            className="hidden"
          />

          {mediaType === 'text' && (
            <>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Nhập nội dung của bạn..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />

              {/* Background Color Selection */}
              <div className="flex items-center gap-2">
                {backgroundColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBackgroundColor(color)}
                    className={`w-8 h-8 rounded-full ${backgroundColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Font Style Selection */}
              <div className="flex items-center gap-2">
                {fontStyles.map(style => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setFontStyle(style.value)}
                    className={`px-3 py-1 rounded ${
                      fontStyle === style.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (!textContent && !mediaFile)}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              loading || (!textContent && !mediaFile)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang tạo...' : 'Đăng story'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryCreate; 