import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  HandThumbUpIcon as ThumbUpOutline,
  ChatBubbleLeftIcon as ChatOutline,
  ShareIcon as ShareOutline,
  EllipsisHorizontalIcon,
  BookmarkIcon as BookmarkOutline,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  MapPinIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import {
  HandThumbUpIcon as ThumbUpSolid,
  ChatBubbleLeftIcon as ChatSolid,
  ShareIcon as ShareSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

import { Avatar } from '../index';

const PostList = ({ initialPosts, onLike, onComment, onShare, onEdit, onRefreshMedia }) => {
  const [posts, setPosts] = useState(initialPosts || []);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      // Remove post from state
      const updatedPosts = posts.filter(post => post.PostID !== postId);
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error deleting post:', error);
      // You might want to show an error message to the user here
    }
  };

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
      alert('Báo cáo đã được gửi thành công!');
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.');
    }
  };

  const handleSharePost = async (postId, shareData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shareData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to share post');
      }
      
      // Update post's share count in state
      const updatedPosts = posts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            SharesCount: (post.SharesCount || 0) + 1
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      
      return true;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  };

  const handleEditPost = async (postId, updatedContent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: updatedContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      // Update post in state
      const updatedPosts = posts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            Content: updatedContent,
            IsEdited: true
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      setEditingPost(null);
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Không có bài viết nào</h3>
        <p className="text-gray-500">Hãy là người đầu tiên chia sẻ bài viết với cộng đồng!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.PostID}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={handleSharePost}
          onDelete={handleDeletePost}
          onReport={handleReportPost}
          onEdit={handleEditPost}
          onRefreshMedia={onRefreshMedia}
          isEditing={editingPost === post.PostID}
          setEditing={(isEditing) => setEditingPost(isEditing ? post.PostID : null)}
        />
      ))}
    </div>
  );
};

const PostCard = ({ post, onLike, onComment, onShare, onDelete, onReport, onEdit, onRefreshMedia, isEditing, setEditing }) => {
  const [isLiked, setIsLiked] = useState(post.IsLiked === 1);
  const [showOptions, setShowOptions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editedContent, setEditedContent] = useState(post.Content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editMedia, setEditMedia] = useState(post.media || []);
  const [newMedia, setNewMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(post.PostID);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Could implement bookmark functionality
  };

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

  const getVisibilityIcon = () => {
    switch (post.Visibility) {
      case 'private':
        return <LockClosedIcon className="w-3.5 h-3.5 text-gray-500" />;
      case 'friends':
        return <UserGroupIcon className="w-3.5 h-3.5 text-gray-500" />;
      default:
        return <GlobeAltIcon className="w-3.5 h-3.5 text-gray-500" />;
    }
  }

  const handleCommentToggle = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post.PostID}/comments`, {
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

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post.PostID}/comments`, {
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
      if (onComment) {
        onComment(post.PostID);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('Failed to post your comment');
    } finally {
      setSubmittingComment(false);
    }
  };

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
      if (onComment) {
        onComment(post.PostID, -1);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editedContent.trim() && editMedia.length === 0 && newMedia.length === 0) return;
    
    setIsSubmittingEdit(true);
    try {
      // First update the post content
      await onEdit(post.PostID, editedContent);
      
      // Then handle any new media uploads
      if (newMedia.length > 0) {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        newMedia.forEach(file => {
          formData.append('media', file);
        });
        
        setUploadingMedia(true);
        const mediaResponse = await fetch(`/api/posts/${post.PostID}/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!mediaResponse.ok) {
          throw new Error('Failed to upload media');
        }
        
        // Refresh post data to get updated media list
        if (onRefreshMedia) {
          await onRefreshMedia(post.PostID);
        }
        
        setNewMedia([]);
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmittingEdit(false);
      setUploadingMedia(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(post.Content);
    setEditMedia(post.media || []);
    setNewMedia([]);
    setEditing(false);
  };
  
  const handleAddMedia = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewMedia([...newMedia, ...files]);
    }
  };
  
  const handleRemoveNewMedia = (index) => {
    setNewMedia(newMedia.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingMedia = async (mediaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post.PostID}/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete media');
      }
      
      // Remove from UI
      setEditMedia(editMedia.filter(media => media.MediaID !== mediaId));
      
      // Refresh post data to get updated media list
      if (onRefreshMedia) {
        await onRefreshMedia(post.PostID);
      }
    } catch (error) {
      console.error('Error removing media:', error);
      // Show error message
    }
  };

  // Parse location if it exists
  let location = null;
  if (post.Location) {
    if (typeof post.Location === 'string') {
      try {
        // Try to parse as JSON
        location = JSON.parse(post.Location);
      } catch (error) {
        // If it's not valid JSON, treat it as a plain string location name
        location = { displayName: post.Location };
      }
    } else {
      // If it's already an object, use it directly
      location = post.Location;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Post Header */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <Avatar
            src={post.UserImage}
            name={post.FullName}
            alt={post.FullName}
            size="small"
            className="mr-2"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{post.FullName}</h3>
              {getVisibilityIcon()}
              {post.IsEdited && <span className="text-xs text-gray-500">(đã chỉnh sửa)</span>}
            </div>
            <p className="text-sm text-gray-500">{formatDate(post.CreatedAt)}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              {(() => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isOwner = currentUser.UserID === post.UserID || currentUser.id === post.UserID;
                
                return isOwner ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Chỉnh sửa bài viết
                    </button>
                    <button
                      onClick={() => {
                        onDelete(post.PostID);
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Xóa bài viết
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onReport(post.PostID, { 
                        title: 'Báo cáo bài viết vi phạm',
                        content: 'Bài viết này có nội dung vi phạm tiêu chuẩn cộng đồng', 
                        category: 'CONTENT',
                        targetType: 'POST'
                      });
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                  >
                    Báo cáo bài viết
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Location Information */}
      {location && !isEditing && (
        <div className="px-4 pb-2 flex items-center text-sm text-blue-700">
          <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span className="truncate">{location.displayName}</span>
        </div>
      )}

      {/* Post Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="mb-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Viết nội dung bài viết..."
            />
            
            {/* Existing Media */}
            {editMedia.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Media hiện tại</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editMedia.map((media) => (
                    <div key={media.MediaID} className="relative group">
                      {media.MediaType === 'image' ? (
                        <img
                          src={media.MediaUrl.startsWith('http') ? media.MediaUrl : `/uploads/${media.MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '')}`}
                          alt="Media"
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingMedia(media.MediaID)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Media Preview */}
            {newMedia.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Media mới</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {newMedia.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : file.type.startsWith('video/') ? (
                        <div className="w-full h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Media Upload Button */}
            <div className="flex items-center mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Thêm ảnh/video
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleAddMedia}
              />
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isSubmittingEdit || uploadingMedia}
              >
                Hủy
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                disabled={isSubmittingEdit || uploadingMedia}
              >
                {isSubmittingEdit || uploadingMedia ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadingMedia ? 'Đang tải lên...' : 'Đang lưu...'}
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        ) : (
          post.Content && (
            <div className="prose max-w-none mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.Content}
              </ReactMarkdown>
            </div>
          )
        )}
      </div>

      {/* Post Media */}
      {!isEditing && post.media && post.media.length > 0 && (
        <div className={`${post.media.length === 1 ? '' : 'grid grid-cols-2 gap-1'} mb-2`}>
          {post.media.map((media, index) => {
            // Log đường dẫn gốc để debug
            console.log('Original MediaUrl:', media.MediaUrl);
            
            let mediaUrl = '';
            try {
              if (!media.MediaUrl) {
                console.error('MediaUrl is missing for media:', media);
                mediaUrl = '/placeholder-image.svg';
              } else if (media.MediaUrl.startsWith('http')) {
                // Đường dẫn tuyệt đối - giữ nguyên
                mediaUrl = media.MediaUrl;
              } else {
                // Đảm bảo đường dẫn bắt đầu bằng /uploads/
                // Xóa bỏ các tiền tố không cần thiết
                let cleanPath = media.MediaUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
                mediaUrl = `/uploads/${cleanPath}`;
              }
            } catch (error) {
              console.error('Error processing media URL:', error);
              mediaUrl = '/placeholder-image.svg';
            }
            
            console.log('Final media URL:', mediaUrl);
            
            return (
              <div 
                key={index} 
                className={`overflow-hidden ${post.media.length === 1 ? 'max-h-[500px]' : 'max-h-[300px]'}`}
              >
                {media.MediaType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt={`Hình ảnh ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image failed to load:', mediaUrl);
                      e.target.onerror = null; 
                      e.target.src = '/placeholder-image.svg';
                      e.target.classList.add('bg-gray-100');
                    }}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Video failed to load:', mediaUrl);
                      e.target.onerror = null;
                      e.target.classList.add('hidden');
                      e.target.parentNode.innerHTML += '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">Không thể tải video</div>';
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Engagement Stats */}
      {(post.LikesCount > 0 || post.CommentsCount > 0) && (
        <div className="px-4 py-2 flex justify-between text-sm text-gray-500 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbUpSolid className="w-3 h-3 text-white" />
            </div>
            <span>{post.LikesCount}</span>
          </div>
          
          {post.CommentsCount > 0 && (
            <button className="hover:underline">
              {post.CommentsCount} bình luận
            </button>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-gray-100 flex-1 ${
            isLiked ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {isLiked ? (
            <ThumbUpSolid className="w-5 h-5" />
          ) : (
            <ThumbUpOutline className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">Thích</span>
        </button>

        <button
          onClick={handleCommentToggle}
          className={`flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-gray-100 flex-1 ${
            showComments ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {showComments ? (
            <ChatSolid className="w-5 h-5" />
          ) : (
            <ChatOutline className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">Bình luận</span>
        </button>

        <button
          onClick={() => {
            console.log('Share button clicked for post:', post.PostID);
            if (onShare) {
              onShare(post.PostID);
            } else {
              console.error('onShare function is not provided');
            }
          }}
          className="flex items-center justify-center space-x-2 p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-1"
        >
          <ShareOutline className="w-5 h-5" />
          <span className="text-sm font-medium">Chia sẻ</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 ${
            isBookmarked ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {isBookmarked ? (
            <BookmarkSolid className="w-5 h-5" />
          ) : (
            <BookmarkOutline className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mb-4">
            <Avatar
              src={JSON.parse(localStorage.getItem('user') || '{}').ProfileImage}
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
            <div className="space-y-4">
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
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
                        Thích ({comment.LikesCount})
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
      )}
    </div>
  );
};

export default PostList; 