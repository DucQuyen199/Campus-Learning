/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import CreatePost from '../../components/Post/CreatePost';
import PostCard from '../../components/Post/PostCard';
import { useAuth } from '../../contexts/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token } = useAuth();

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải bài viết');
      }

      const data = await response.json();
      
      if (page === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }

      setHasMore(data.length === 10); // Assuming limit is 10
    } catch (error) {
      console.error('Fetch posts error:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    fetchPosts();
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể thực hiện thao tác');
      }

      setPosts(prev => 
        prev.map(post => 
          post.PostID === postId 
            ? { 
                ...post, 
                IsLiked: !post.IsLiked,
                LikesCount: post.IsLiked ? post.LikesCount - 1 : post.LikesCount + 1
              }
            : post
        )
      );
    } catch (error) {
      console.error('Like post error:', error);
      // Show error notification
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 2 }}>
        <CreatePost onPostCreated={handlePostCreated} />

        {posts.map(post => (
          <PostCard
            key={post.PostID}
            post={post}
            onLike={handleLike}
          />
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Feed; 
