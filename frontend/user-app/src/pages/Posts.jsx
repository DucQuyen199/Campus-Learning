import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CreatePost from '../components/Post/CreatePost';
import PostList from '../components/Post/PostList';
import StoryList from '../components/Story/StoryList';
import SharePostModal from '../components/Post/SharePostModal';
import { FunnelIcon, ClockIcon, FireIcon, SparklesIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon, ChatBubbleLeftIcon, ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as ThumbUpSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { useNavigate, useLocation } from 'react-router-dom';
import courseApi from '../api/courseApi';
import { Avatar } from '../components/index';

// Custom styles for Markdown elements
const markdownStyles = {
  table: 'min-w-full border border-gray-300 border-collapse my-4',
  thead: 'bg-gray-50',
  th: 'border border-gray-300 px-4 py-2 font-semibold text-left',
  td: 'border border-gray-300 px-4 py-2',
  ul: 'list-disc pl-6 space-y-1 my-4',
  ol: 'list-decimal pl-6 space-y-1 my-4',
  li: 'pl-1',
};

// Components mapping for ReactMarkdown
const markdownComponents = {
  table: ({node, ...props}) => <table className={markdownStyles.table} {...props} />,
  thead: ({node, ...props}) => <thead className={markdownStyles.thead} {...props} />,
  th: ({node, ...props}) => <th className={markdownStyles.th} {...props} />,
  td: ({node, ...props}) => <td className={markdownStyles.td} {...props} />,
  ul: ({node, ...props}) => <ul className={markdownStyles.ul} {...props} />,
  ol: ({node, ...props}) => <ol className={markdownStyles.ol} {...props} />,
  li: ({node, ...props}) => <li className={markdownStyles.li} {...props} />,
};

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
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Report dialog state
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportCategory, setReportCategory] = useState('CONTENT');
  const [reportTargetId, setReportTargetId] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  
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

  // Calculate post score for sorting algorithm
  const calculatePostScore = (post) => {
    // Get current date and post date in milliseconds for age calculation
    const now = new Date().getTime();
    const postDate = new Date(post.CreatedAt).getTime();
    const postAgeInDays = (now - postDate) / (1000 * 60 * 60 * 24);
    
    // Base weight factors - can be adjusted for different importance
    const likeWeight = 1;
    const commentWeight = 1.5;
    const bookmarkWeight = 2;
    const shareWeight = 1.2;
    
    // Time decay factor (older posts get lower scores)
    // Logarithmic decay to keep older but highly engaged posts relevant
    const timeDecayFactor = 1 / (Math.log(postAgeInDays + 2));
    
    // Engagement score combines different interactions with their weights
    const engagementScore = 
      (post.LikesCount || 0) * likeWeight +
      (post.CommentsCount || 0) * commentWeight +
      (post.BookmarksCount || 0) * bookmarkWeight +
      (post.SharesCount || 0) * shareWeight;
    
    // Add a small random factor (±10% variation) for diversity
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    // Final score combining engagement, time decay and randomness
    return engagementScore * timeDecayFactor * randomFactor;
  };

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
        // Enhanced trending algorithm that considers likes, comments, bookmarks, and recency
        sortedPosts.forEach(post => post._score = calculatePostScore(post));
        sortedPosts.sort((a, b) => b._score - a._score);
      } else if (activeFilter === 'latest') {
        // Sort by date but add a small random factor for posts from the same day
        sortedPosts.sort((a, b) => {
          const dateA = new Date(a.CreatedAt).setHours(0, 0, 0, 0);
          const dateB = new Date(b.CreatedAt).setHours(0, 0, 0, 0);
          
          if (dateA === dateB) {
            // For posts from the same day, use engagement score with randomization
            return calculatePostScore(b) - calculatePostScore(a);
          }
          // Different days - newest first
          return new Date(b.CreatedAt) - new Date(a.CreatedAt);
        });
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

      // Set the first post as selected for main view if none is selected
      if (!selectedVideo && sortedPosts.length > 0) {
        setSelectedVideo(sortedPosts[0]);
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

  const handleVideoSelect = (post) => {
    setSelectedVideo(post);
    // Update the URL to include the selected post ID
    navigate(`/posts?postId=${post.PostID}`);
  };

  // New function to handle bookmarking
  const handleBookmark = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to bookmark post');
      }
      
      // Update bookmarked status in state
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            IsBookmarked: !post.IsBookmarked
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  // Function to fetch comments for the selected post
  const fetchComments = async (postId) => {
    if (!postId) return;
    
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Could not load comments');
      }
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentError('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Load comments when selected video changes
  useEffect(() => {
    if (selectedVideo) {
      fetchComments(selectedVideo.PostID);
    }
  }, [selectedVideo]);

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !selectedVideo) return;
    
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${selectedVideo.PostID}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
      
      // Update comment count
      handleComment(selectedVideo.PostID);
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('Failed to post your comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle comment like
  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to like comment');
      }
      
      // Update comment in state
      setComments(comments.map(comment => 
        comment.CommentID === commentId 
          ? { 
              ...comment, 
              LikesCount: comment.IsLiked ? comment.LikesCount - 1 : comment.LikesCount + 1,
              IsLiked: !comment.IsLiked 
            } 
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      // Remove comment from state
      setComments(comments.filter(comment => comment.CommentID !== commentId));
      
      // Update comment count in the post
      if (selectedVideo) {
        handleComment(selectedVideo.PostID, -1);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Handle report post
  const handleReportPost = async (postId, reportData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId: postId,
          ...reportData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to report post');
      }
      
      // Show success message
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
      return true;
    } catch (error) {
      console.error('Error reporting post:', error);
      return false;
    }
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

      {/* Report Success Banner */}
      {reportSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50 flex items-center justify-between">
          <span>Báo cáo đã được gửi thành công!</span>
          <button onClick={() => setReportSuccess(false)} className="ml-4 text-yellow-700">
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
        {/* Filter tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Main YouTube-like layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Main video/post display */}
          <div className="lg:w-2/3">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedVideo ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Video/Media display */}
                {selectedVideo.media && selectedVideo.media.length > 0 && (
                  <div className="w-full bg-black flex items-center justify-center">
                    {selectedVideo.media[0].MediaType === 'video' ? (
                      <video 
                        className="w-full max-h-[500px] object-contain"
                        src={selectedVideo.media[0].MediaUrl.startsWith('http') 
                          ? selectedVideo.media[0].MediaUrl 
                          : `/uploads/${selectedVideo.media[0].MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '')}`
                        }
                        controls
                        autoPlay
                      />
                    ) : (
                      <img 
                        className="w-full max-h-[500px] object-contain"
                        src={selectedVideo.media[0].MediaUrl.startsWith('http') 
                          ? selectedVideo.media[0].MediaUrl 
                          : `/uploads/${selectedVideo.media[0].MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '')}`
                        }
                        alt={selectedVideo.Title || "Post media"}
                      />
                    )}
                  </div>
                )}
                
                {/* Post details */}
                <div className="p-4">                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={selectedVideo.UserImage}
                        name={selectedVideo.FullName}
                        alt={selectedVideo.FullName || "User"}
                        size="small"
                      />
                      <div>
                        <p className="font-medium">{selectedVideo.FullName || "Unknown User"}</p>
                        <p className="text-sm text-gray-500">{selectedVideo.CreatedAt && formatDate(selectedVideo.CreatedAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleLike(selectedVideo.PostID)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
                          selectedVideo.IsLiked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={selectedVideo.IsLiked ? "Bỏ thích" : "Thích"}
                      >
                        {selectedVideo.IsLiked ? (
                          <ThumbUpSolid className="h-5 w-5" />
                        ) : (
                          <HandThumbUpIcon className="h-5 w-5" />
                        )}
                        <span>{selectedVideo.LikesCount || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleShare(selectedVideo.PostID)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                        title="Chia sẻ"
                      >
                        <ShareIcon className="h-5 w-5" />
                        <span>Chia sẻ</span>
                      </button>
                      
                      <button
                        onClick={() => handleBookmark(selectedVideo.PostID)}
                        className={`flex items-center justify-center p-2 rounded-full ${
                          selectedVideo.IsBookmarked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={selectedVideo.IsBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
                      >
                        {selectedVideo.IsBookmarked ? (
                          <BookmarkSolid className="h-5 w-5" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5" />
                        )}
                      </button>
                      
                      {/* Report Button - Only show for posts not owned by the current user */}
                      {(() => {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const isOwner = currentUser.UserID === selectedVideo.UserID || currentUser.id === selectedVideo.UserID;
                        
                        return !isOwner && (
                          <button
                            onClick={() => handleReportPost(selectedVideo.PostID, {
                              title: 'Báo cáo bài viết vi phạm',
                              content: 'Bài viết này có nội dung vi phạm tiêu chuẩn cộng đồng',
                              category: 'CONTENT',
                              targetType: 'POST'
                            })}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-gray-100 text-yellow-600 hover:bg-gray-200"
                            title="Báo cáo bài viết"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 p-4">
                  <div className="prose prose-sm max-w-none overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {selectedVideo.Content || ''}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Comments section */}
                <div className="border-t border-gray-100 p-4">
                  <h3 className="font-medium mb-4">{selectedVideo.CommentsCount || 0} bình luận</h3>
                  
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mb-6">
                    <Avatar
                      src={JSON.parse(localStorage.getItem('user') || '{}').ProfileImage || JSON.parse(localStorage.getItem('user') || '{}').avatar}
                      name={JSON.parse(localStorage.getItem('user') || '{}').FullName}
                      alt="Your profile"
                      size="small"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={submittingComment}
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-gray-400"
                        disabled={submittingComment || !newComment.trim()}
                      >
                        {submittingComment ? (
                          <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  {/* Comments List */}
                  {isLoadingComments ? (
                    <div className="flex justify-center py-4">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  ) : commentError ? (
                    <div className="text-center py-4 text-red-500 text-sm">{commentError}</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {comments.map((comment) => (
                        <div key={comment.CommentID} className="flex space-x-2">
                          <Avatar
                            src={comment.UserImage}
                            name={comment.FullName}
                            alt={comment.FullName}
                            size="small"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg px-3 py-2">
                              <div className="font-medium text-sm">{comment.FullName}</div>
                              <div className="text-sm prose prose-sm max-w-none overflow-x-auto">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={markdownComponents}
                                >
                                  {comment.Content}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500 space-x-3">
                              <span>{formatDate(comment.CreatedAt)}</span>
                              <button 
                                className={`font-medium ${comment.IsLiked ? 'text-blue-500' : ''}`}
                                onClick={() => handleLikeComment(comment.CommentID)}
                              >
                                Thích ({comment.LikesCount || 0})
                              </button>
                              {comment.UserID === JSON.parse(localStorage.getItem('user') || '{}').UserID && (
                                <button 
                                  className="font-medium text-red-500"
                                  onClick={() => handleDeleteComment(comment.CommentID)}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500">Không có bài viết nào được chọn</p>
              </div>
            )}
          </div>
          
          {/* Right side - Related/playlist videos */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Bài viết gợi ý</h2>
                  <div className="flex gap-2">
                    <button 
                      className={`px-3 py-1 rounded ${activeFilter === 'latest' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      onClick={() => setActiveFilter('latest')}
                    >
                      Mới nhất
                    </button>
                    <button 
                      className={`px-3 py-1 rounded ${activeFilter === 'trending' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      onClick={() => setActiveFilter('trending')}
                    >
                      Phổ biến
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[600px]">
                {filteredPosts.map(post => (
                  <div 
                    key={post.PostID} 
                    className={`p-3 flex gap-3 cursor-pointer hover:bg-gray-50 ${selectedVideo?.PostID === post.PostID ? 'bg-blue-50' : ''}`}
                    onClick={() => handleVideoSelect(post)}
                  >
                    <div className="w-1/3">
                      {post.media && post.media.length > 0 ? (
                        <div className="relative pb-[56.25%] h-0">
                          {post.media[0].MediaType === 'video' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                              <img 
                                src={post.media[0].MediaUrl.startsWith('http') 
                                  ? post.media[0].MediaUrl 
                                  : `/uploads/${post.media[0].MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '')}`
                                }
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/100x100?text=Video";
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img 
                              src={post.media[0].MediaUrl.startsWith('http') 
                                ? post.media[0].MediaUrl 
                                : `/uploads/${post.media[0].MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '')}`
                              }
                              alt="Post media"
                              className="absolute inset-0 w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/100x100?text=Image";
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-200 rounded-lg w-full pb-[56.25%] relative">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            Không có ảnh
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-2/3">
                      <p className="text-xs text-gray-500">{post.FullName || "Unknown User"}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{post.LikesCount || 0} lượt thích</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(post.CreatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posts; 