import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, PhotoIcon, VideoCameraIcon, PencilIcon, PlusIcon, ArrowUpTrayIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import StoryList from '../../components/Story/StoryList';
import Story from '../../components/Story/Story';
import { createStory, deleteStory } from '../../api/storyApi';
import { useSelector } from 'react-redux';

const StoriesPage = () => {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(null);
  const [viewingStories, setViewingStories] = useState(false);
  const [storyData, setStoryData] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  
  // Story creation states
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#f3f4f6');
  const [fontStyle, setFontStyle] = useState('font-sans');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Get current user from Redux store
  const currentUser = useSelector(state => state.auth.user);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Auto focus textarea when switching to text mode on mobile
  useEffect(() => {
    if (mediaType === 'text' && isMobile && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 300);
    }
  }, [mediaType, isMobile]);

  const backgroundColors = [
    '#ffffff', // white
    '#f3f4f6', // light gray
    '#dbeafe', // light blue
    '#f0fdf4', // light green
    '#fef3c7', // light yellow
    '#fae8ff', // light purple
  ];

  const fontStyles = [
    { name: 'Sans', value: 'font-sans' },
    { name: 'Serif', value: 'font-serif' },
    { name: 'Mono', value: 'font-mono' },
  ];

  const handleViewStory = (index, stories) => {
    setCurrentStoryIndex(index);
    setViewingStories(true);
    setStoryData(stories);
  };

  const handleCloseStory = () => {
    setViewingStories(false);
    setCurrentStoryIndex(null);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < storyData.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      handleCloseStory();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };
  
  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };
  
  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    document.body.style.overflow = ''; // Restore scrolling
    resetForm();
  };
  
  const resetForm = () => {
    // Reset form state
    setMediaFile(null);
    setMediaType('text');
    setTextContent('');
    setPreview(null);
    setSelectedFileName('');
    setBackgroundColor('#f3f4f6');
    setFontStyle('font-sans');
  };

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
    setSelectedFileName(file.name);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitStory = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      const storyData = {
        mediaFile,
        mediaType,
        textContent,
        backgroundColor,
        fontStyle
      };

      const response = await createStory(storyData);
      setShowCreateForm(false);
      document.body.style.overflow = ''; // Restore scrolling
      resetForm();
      
      // Show success message
      alert('Story đã được tạo thành công!');
      
      // Refresh the stories list
      window.location.reload();
    } catch (error) {
      console.error('Create story error:', error);
      alert('Không thể tạo story. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle story deletion
  const handleDeleteStory = async (storyId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa story này?')) return;
    
    try {
      await deleteStory(storyId);
      // Close story viewer if open
      if (viewingStories) {
        handleCloseStory();
      }
      // Refresh the page to update the story list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Không thể xóa story. Vui lòng thử lại sau.');
    }
  };
  
  // Check if the story belongs to the current user
  const isCurrentUserStory = (story) => {
    return currentUser && story && story.UserID === currentUser.UserID;
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Stories</h1>
        <button
          onClick={handleOpenCreateForm}
          className="px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Tạo Story mới</span>
          <span className="sm:hidden">Tạo mới</span>
        </button>
      </div>

      {/* Stories grid */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Khám phá Stories</h2>
        <StoryList
          orientation="vertical"
          onViewStory={handleViewStory}
        />
      </div>

      {/* Story viewer */}
      {viewingStories && currentStoryIndex !== null && storyData.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <Story
            story={storyData[currentStoryIndex]}
            onClose={handleCloseStory}
            onNext={handleNextStory}
            onPrevious={handlePrevStory}
            onDelete={isCurrentUserStory(storyData[currentStoryIndex]) ? () => handleDeleteStory(storyData[currentStoryIndex].StoryID) : null}
            viewCount={storyData[currentStoryIndex].ViewCount || 0}
          />
        </div>
      )}
      
      {/* Create Story Form Modal - Mobile Optimized */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden">
          <div className="bg-white h-full sm:h-auto sm:rounded-xl shadow-sm overflow-hidden w-full max-w-6xl mx-auto">
            {/* Fixed header for mobile */}
            <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-medium text-gray-700">Tạo Story mới</h3>
                <button
                  onClick={handleCloseCreateForm}
                  className="p-2 rounded-full hover:bg-gray-50"
                  aria-label="Đóng"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Media Type Tabs - Mobile view shows them in the header */}
              <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMediaType('text')}
                  className={`py-2 px-2 rounded-md flex flex-col items-center justify-center ${
                    mediaType === 'text' 
                      ? 'bg-gray-100 text-gray-800 font-medium' 
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <PencilIcon className="w-5 h-5" />
                  <span className="text-xs mt-1">Văn bản</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    fileInputRef.current?.click();
                  }}
                  className={`py-2 px-2 rounded-md flex flex-col items-center justify-center ${
                    mediaType === 'image' 
                      ? 'bg-gray-100 text-gray-800 font-medium' 
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <PhotoIcon className="w-5 h-5" />
                  <span className="text-xs mt-1">Hình ảnh</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    fileInputRef.current?.click();
                  }}
                  className={`py-2 px-2 rounded-md flex flex-col items-center justify-center ${
                    mediaType === 'video' 
                      ? 'bg-gray-100 text-gray-800 font-medium' 
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <VideoCameraIcon className="w-5 h-5" />
                  <span className="text-xs mt-1">Video</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitStory} className="h-[calc(100%-60px)] sm:h-auto overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
                {/* Preview Area */}
                <div 
                  className="relative w-full h-[30vh] sm:h-[40vh] lg:h-[50vh] rounded-lg overflow-hidden flex items-center justify-center touch-none"
                  style={{ backgroundColor: mediaType === 'text' ? backgroundColor : '#f9fafb' }}
                >
                  {mediaType === 'text' ? (
                    <p className={`text-gray-700 text-xl sm:text-2xl p-4 sm:p-8 text-center ${fontStyle}`}>
                      {textContent || 'Nhập nội dung của bạn...'}
                    </p>
                  ) : preview ? (
                    mediaType === 'image' ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <video src={preview} className="w-full h-full object-contain" controls />
                    )
                  ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                      <ArrowUpTrayIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                      <p className="text-sm sm:text-base">Chọn {mediaType === 'image' ? 'hình ảnh' : 'video'}</p>
                    </div>
                  )}
                </div>

                {/* Controls Column */}
                <div className="flex flex-col space-y-3 sm:space-y-6">
                  {/* Media Type Tabs - Desktop view only */}
                  <div className="hidden sm:flex sm:items-center sm:justify-center sm:space-x-4">
                    <button
                      type="button"
                      onClick={() => setMediaType('text')}
                      className={`flex-1 py-4 px-3 rounded-lg flex items-center justify-center ${
                        mediaType === 'text' 
                          ? 'bg-gray-100 text-gray-800 font-medium' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <PencilIcon className="w-5 h-5 mr-2" />
                      <span>Văn bản</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('image');
                        fileInputRef.current?.click();
                      }}
                      className={`flex-1 py-4 px-3 rounded-lg flex items-center justify-center ${
                        mediaType === 'image' 
                          ? 'bg-gray-100 text-gray-800 font-medium' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <PhotoIcon className="w-5 h-5 mr-2" />
                      <span>Hình ảnh</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('video');
                        fileInputRef.current?.click();
                      }}
                      className={`flex-1 py-4 px-3 rounded-lg flex items-center justify-center ${
                        mediaType === 'video' 
                          ? 'bg-gray-100 text-gray-800 font-medium' 
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <VideoCameraIcon className="w-5 h-5 mr-2" />
                      <span>Video</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    className="hidden"
                  />
                  
                  {/* Show file name if selected */}
                  {(mediaType === 'image' || mediaType === 'video') && selectedFileName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-600 truncate">Đã chọn: {selectedFileName}</p>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 text-xs mt-1 hover:underline"
                      >
                        Chọn file khác
                      </button>
                    </div>
                  )}

                  {mediaType === 'text' && (
                    <div className="flex-1 flex flex-col space-y-3 sm:space-y-6">
                      <div className="flex-1">
                        <textarea
                          ref={textareaRef}
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Nhập nội dung của bạn..."
                          className="w-full h-full min-h-[100px] sm:min-h-[200px] p-3 sm:p-6 border border-gray-200 rounded-lg focus:ring-gray-300 focus:border-gray-300 resize-none text-base sm:text-lg"
                        />
                      </div>

                      {/* Background Color Selection */}
                      <div>
                        <label className="block text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">Màu nền</label>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          {backgroundColors.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setBackgroundColor(color)}
                              aria-label={`Chọn màu nền ${color}`}
                              className={`w-10 h-10 rounded-full border ${backgroundColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : 'border-gray-200'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Font Style Selection */}
                      <div>
                        <label className="block text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">Phông chữ</label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {fontStyles.map(style => (
                            <button
                              key={style.value}
                              type="button"
                              onClick={() => setFontStyle(style.value)}
                              className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-center ${
                                fontStyle === style.value
                                  ? 'bg-gray-100 text-gray-800 border border-gray-300 font-medium'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fixed submit button at bottom */}
              <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading || (!textContent && !mediaFile)}
                  className={`w-full py-3 sm:py-4 px-6 rounded-lg text-center font-medium ${
                    loading || (!textContent && !mediaFile)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white active:bg-gray-900'
                  }`}
                >
                  {loading ? 'Đang tạo...' : 'Đăng story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage; 