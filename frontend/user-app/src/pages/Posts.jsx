import React, { useState, useEffect } from 'react';
import CreatePost from '../components/Post/CreatePost';
import PostList from '../components/Post/PostList';
import StoryList from '../components/Story/StoryList';
import SharePostModal from '../components/Post/SharePostModal';
import { FunnelIcon, ClockIcon, FireIcon, SparklesIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import courseApi from '../api/courseApi';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const postId = queryParams.get('postId');
    const commentId = queryParams.get('commentId');
    
    if (postId) {
      setSelectedPost(postId);
      if (commentId) {
        setSelectedComment(commentId);
      }
    }
    
    fetchPosts();
  }, [activeFilter, location.search]);

  useEffect(() => {
    // Filter posts based on search query
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(post => {
        const content = post?.Content || '';
        const title = post?.Title || '';
        const authorName = post?.AuthorName || '';
        
        return content.toLowerCase().includes(query) ||
               title.toLowerCase().includes(query) ||
               authorName.toLowerCase().includes(query);
      });
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts from API server...');
      
      // Use the correct port (5001 instead of 5004)
      try {
        const pingResponse = await fetch('http://localhost:5001/api/posts', {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('API server ping response:', pingResponse.status);
      } catch (pingError) {
        console.warn('API server ping failed:', pingError);
      }
      
      const response = await fetch('http://localhost:5001/api/posts?limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error('Không thể tải bài viết');
      }

      const data = await response.json();
      console.log('Posts data received:', data);
      
      const postsWithFullMediaPaths = data.posts || [];
      
      // Sắp xếp bài viết theo filter đang chọn
      let sortedPosts = [...postsWithFullMediaPaths];
      if (activeFilter === 'trending') {
        sortedPosts.sort((a, b) => b.LikesCount - a.LikesCount);
      } else {
        sortedPosts.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
      }
      
      setPosts(sortedPosts);
      setFilteredPosts(sortedPosts);
      
      // If we have a selected post, fetch its details if not in the list
      if (selectedPost) {
        const postExists = postsWithFullMediaPaths.some(post => post.PostID.toString() === selectedPost.toString());
        
        if (!postExists) {
          fetchSinglePost(selectedPost);
        }
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSinglePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải bài viết');
      }
      
      const data = await response.json();
      
      if (data.post) {
        // Add this post to our posts list if it's not already there
        setPosts(prevPosts => {
          if (!prevPosts.some(p => p.PostID.toString() === postId.toString())) {
            return [data.post, ...prevPosts];
          }
          return prevPosts;
        });
      }
    } catch (error) {
      console.error('Fetch single post error:', error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
    // Show success message
    setShowSuccess(true);
    setShowCreateForm(false);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể thích bài viết');
      }

      fetchPosts();
    } catch (error) {
      console.error('Like post error:', error);
    }
  };

  const handleComment = async (postId, change = 1) => {
    try {
      // Update the UI immediately to reflect comment count change
      setPosts(posts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            CommentsCount: Math.max(0, post.CommentsCount + change)
          };
        }
        return post;
      }));
      
      // We're not actually making an API call here because the count 
      // has already been updated on the server by the comment endpoints
    } catch (error) {
      console.error('Comment update error:', error);
      // In case of error, refresh all posts to get accurate counts
      fetchPosts();
    }
  };
  
  // Clear selected post and comment and update URL
  const clearSelection = () => {
    setSelectedPost(null);
    setSelectedComment(null);
    navigate('/posts');
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const filters = [
    { id: 'latest', name: 'Mới nhất', icon: ClockIcon },
    { id: 'trending', name: 'Xu hướng', icon: FireIcon }
  ];

  const handleStoryClick = (index) => {
    setCurrentStoryIndex(index);
    setShowStoryModal(true);
  };

  const handleNextStory = () => {
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < posts.length) {
      setCurrentStoryIndex(nextIndex);
    } else {
      setShowStoryModal(false);
    }
  };

  const handlePrevStory = () => {
    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
    }
  };

  // Fetch featured courses
  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await courseApi.getAllCourses();
        if (response.data && response.data.success) {
          // Get up to 3 featured courses
          const courses = response.data.data || [];
          setFeaturedCourses(courses.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching featured courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchFeaturedCourses();
  }, []);

  // Format price function
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 0;
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? 0 : numericPrice;
  };

  // Navigate to course detail
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleShare = (postId) => {
    const post = posts.find(p => p.PostID === postId);
    if (post) {
      console.log('Setting post for share:', post);
      setSelectedPostForShare(post);
    } else {
      console.error('Post not found for sharing:', postId);
    }
  };

  const handleShareComplete = (postId) => {
    // Cập nhật số lượt chia sẻ trong state
    setPosts(posts.map(post => {
      if (post.PostID === postId) {
        return {
          ...post,
          SharesCount: (post.SharesCount || 0) + 1
        };
      }
      return post;
    }));
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Success Banner */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center justify-between">
          <span>Đăng bài thành công!</span>
          <button onClick={() => setShowSuccess(false)} className="ml-4 text-green-700">
            ×
          </button>
        </div>
      )}
      
      {/* Fixed Create Post Button */}
      <button 
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-30"
      >
        <PencilIcon className="h-6 w-6" />
      </button>
      
      {/* Create Post Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4 md:p-0">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button 
                onClick={() => setShowCreateForm(false)}
                className="absolute -top-4 -right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
              >
                ×
              </button>
              <CreatePost onPostCreated={handlePostCreated} />
            </div>
          </div>
        </div>
      )}
      
      {/* Story Modal */}
      {showStoryModal && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={(e) => {
            // Kiểm tra nếu click vào phần nền (không phải nội dung story)
            if (e.target === e.currentTarget) {
              setShowStoryModal(false);
            }
          }}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-white z-10"
            onClick={() => setShowStoryModal(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Navigation Buttons */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-10"
            onClick={handlePrevStory}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-10"
            onClick={handleNextStory}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Story Content */}
          <div 
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Ngăn chặn event bubbling
          >
            <div className="relative w-full max-w-2xl h-full">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${(currentStoryIndex + 1) * 100 / posts.length}%` }}
                />
              </div>

              {/* Story Media */}
              <img 
                src={posts[currentStoryIndex]?.media} 
                alt="Story" 
                className="w-full h-full object-contain"
              />

              {/* Story Info */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2">
                  <img 
                    src={posts[currentStoryIndex]?.avatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold">{posts[currentStoryIndex]?.username}</span>
                </div>
                <p className="mt-2">{posts[currentStoryIndex]?.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Post Modal */}
      {selectedPostForShare && (
        <SharePostModal
          post={selectedPostForShare}
          onClose={() => {
            console.log('Closing share modal');
            setSelectedPostForShare(null);
          }}
          onShare={handleShareComplete}
        />
      )}
      
      <div className="w-full mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bài viết cộng đồng</h1>
              <p className="opacity-90">Chia sẻ ý tưởng và nhận phản hồi từ cộng đồng sinh viên</p>
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-4 md:mt-0 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Viết bài mới
            </button>
          </div>
        </div>
        
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Posts */}
          <div className="lg:w-3/4">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Filters */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {filters.map(filter => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                          activeFilter === filter.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{filter.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Main Content - Posts */}
            <div className="w-full">
              {loading ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải bài viết...</p>
                </div>
              ) : (
                <>
                  {selectedPost && (
                    <div className="bg-blue-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                      <span className="text-blue-700">Đang xem bài viết được chọn</span>
                      <button 
                        onClick={clearSelection}
                        className="px-3 py-1 bg-white text-blue-600 rounded border border-blue-300 hover:bg-blue-100 transition-colors"
                      >
                        Xem tất cả bài viết
                      </button>
                    </div>
                  )}
                  
                  {searchQuery && filteredPosts.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                      <p className="text-gray-600">Không tìm thấy bài viết phù hợp với từ khóa "{searchQuery}"</p>
                    </div>
                  )}
                  
                  <PostList
                    initialPosts={selectedPost ? 
                      filteredPosts.filter(post => post.PostID.toString() === selectedPost.toString()) : 
                      filteredPosts}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    highlightedCommentId={selectedComment}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Right column - Stories */}
          <div className="lg:w-1/4 sticky top-24 self-start space-y-6">
            {/* Stories Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Stories</h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                    Xem tất cả
                  </button>
                </div>
              </div>
              
              <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-4 pl-8">
                    <StoryList 
                      orientation="vertical" 
                      showTimeline={true}
                      onStoryClick={handleStoryClick}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Tạo Story mới
                </button>
              </div>
            </div>

            {/* Featured Courses Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Khóa học nổi bật</h2>
              </div>
              
              <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-4">
                {coursesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : featuredCourses.length > 0 ? (
                  featuredCourses.map((course) => (
                    <div 
                      key={course.CourseID || course.id} 
                      className="group cursor-pointer"
                      onClick={() => handleCourseClick(course.CourseID || course.id)}
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img 
                          src={course.ImageUrl || course.thumbnail || "https://placehold.co/600x400?text=Course+Image"} 
                          alt={course.Title || course.title} 
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/600x400?text=Course+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="text-white font-semibold">{course.Title || course.title}</span>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400 text-sm">{course.Rating || '4.7'}</span>
                              <span className="text-white/80 text-sm">({course.RatingCount || '0'} đánh giá)</span>
                            </div>
                            {formatPrice(course.Price) === 0 ? (
                              <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">Miễn phí</span>
                            ) : (
                              <span className="text-white text-sm font-medium">{formatPrice(course.Price).toLocaleString()} VND</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Không tìm thấy khóa học nào.
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => navigate('/courses')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xem tất cả khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posts; 