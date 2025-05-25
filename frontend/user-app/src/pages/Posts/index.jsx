import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import PostList from '../../components/Post/PostList';

const Posts = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let endpoint = `/api/posts?limit=20`;
      if (activeCategory !== 'all') {
        endpoint += `&category=${activeCategory}`;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Could not like post');
      }

      // Update like status in the UI
      setPosts(posts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            IsLiked: !post.IsLiked,
            LikesCount: post.IsLiked ? post.LikesCount - 1 : post.LikesCount + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, change = 1) => {
    // Update comment count in UI
    setPosts(posts.map(post => {
      if (post.PostID === postId) {
        return {
          ...post,
          CommentsCount: Math.max(0, post.CommentsCount + change)
        };
      }
      return post;
    }));
  };

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
      
      // Update bookmark status in UI
      setPosts(posts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            IsBookmarked: !post.IsBookmarked,
            BookmarksCount: post.IsBookmarked ? 
              Math.max(0, post.BookmarksCount - 1) : 
              (post.BookmarksCount || 0) + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'react', name: 'React' },
    { id: 'nodejs', name: 'Node.js' },
    { id: 'python', name: 'Python' },
    { id: 'devops', name: 'DevOps' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-4">Bài Viết</h1>
            <p className="text-blue-100">Chia sẻ kiến thức và kinh nghiệm</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200">
            Viết bài mới
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600">Không thể tải bài viết: {error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">Không có bài viết nào trong danh mục này.</p>
        </div>
      ) : (
        <PostList
          initialPosts={posts}
          onLike={handleLike}
          onComment={handleComment}
          onBookmark={handleBookmark}
          onShare={(postId) => console.log('Share:', postId)}
        />
      )}
    </div>
  );
};

export default Posts; 