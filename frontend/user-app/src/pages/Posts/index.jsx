import React, { useState } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Posts = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const posts = [
    {
      id: 1,
      title: "Hướng dẫn sử dụng React Hooks",
      content: "React Hooks là một tính năng mới được giới thiệu từ phiên bản 16.8...",
      author: {
        name: "Nguyễn Văn A",
        avatar: "https://i.pravatar.cc/150?img=1"
      },
      publishDate: "2024-03-20",
      category: "React",
      likes: 150,
      comments: 25,
      bookmarks: 45,
      tags: ["React", "JavaScript", "Frontend"]
    },
    // ... thêm dữ liệu mẫu khác
  ];

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
          <div className="flex space-x-2">
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
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Author Info */}
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-medium">{post.author.name}</h3>
                  <p className="text-sm text-gray-500">{post.publishDate}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-gray-600">{post.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-4">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                      <HeartIcon className="w-5 h-5" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                      <BookmarkIcon className="w-5 h-5" />
                      <span>{post.bookmarks}</span>
                    </button>
                  </div>
                  <button className="text-gray-500 hover:text-blue-600">
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Posts; 