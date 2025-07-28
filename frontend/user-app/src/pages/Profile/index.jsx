/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateProfileImage } from '../../store/slices/authSlice';
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
  XMarkIcon,
  CheckIcon,
  DocumentTextIcon,
  CameraIcon,
  PhotoIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  UserMinusIcon,
  ClockIcon,
  UserIcon,
  UserGroupIcon,
  BookmarkIcon,
  ShieldCheckIcon,
  CogIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import PostList from '../../components/Post/PostList';
import { Avatar } from '../../components';
import EmailVerification from './EmailVerification';
import { userServices } from '../../services/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useParams(); // Get userId from URL parameters
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Add state for education and work experience data
  const [educationData, setEducationData] = useState([]);
  const [workExperienceData, setWorkExperienceData] = useState([]);
  
  // Added state for bookmarked posts
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState(null);
  
  // Friend system states
  const [friendshipStatus, setFriendshipStatus] = useState(null); // null, 'pending', 'accepted', 'rejected', 'blocked'
  const [friendRequestSending, setFriendRequestSending] = useState(false);
  const [friendActionSuccess, setFriendActionSuccess] = useState(null);
  const [userFriends, setUserFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);

  // Tab state for posts - added 'saved'
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'image', 'video', 'saved'

  const [showEmailVerification, setShowEmailVerification] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        let endpoint;
        // If userId is provided, fetch that specific user's profile
        if (userId) {
          endpoint = `/api/users/${userId}`;
        } else {
          // Otherwise fetch the current logged in user's profile
          endpoint = '/api/auth/me';
          setIsOwnProfile(true);
        }

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { 
            state: { message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' }
          });
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tải thông tin người dùng');
        }

        const data = await response.json();
        
        // Format dates
        if (data.DateOfBirth) {
          data.DateOfBirth = new Date(data.DateOfBirth).toISOString();
        }
        if (data.CreatedAt) {
          data.CreatedAt = new Date(data.CreatedAt).toISOString();
        }
        if (data.LastLoginAt) {
          data.LastLoginAt = new Date(data.LastLoginAt).toISOString();
        }

        setUserData(data);

        // Get extended profile data with education and work experience
        try {
          const extendedProfileResponse = await userServices.getUserProfile(userId || data.UserID);
          const extendedData = extendedProfileResponse.data.profile;
          
          if (extendedData.Education) {
            setEducationData(extendedData.Education);
          }
          
          if (extendedData.WorkExperience) {
            setWorkExperienceData(extendedData.WorkExperience);
          }
        } catch (profileError) {
          console.error("Error fetching extended profile:", profileError);
        }

        // Check if this is the user's own profile
        if (!userId) {
          setIsOwnProfile(true);
        } else {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          setIsOwnProfile(currentUser.UserID === parseInt(userId) || currentUser.id === parseInt(userId));
          
          // If not own profile, check friendship status
          if (!(currentUser.UserID === parseInt(userId) || currentUser.id === parseInt(userId))) {
            fetchFriendshipStatus(userId);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, userId]);

  // Function to handle edit profile button click
  const handleEditProfile = () => {
    navigate('/settings', { state: { activeTab: 'general' } });
  };

  // Function to check friendship status
  const fetchFriendshipStatus = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/friendships/status/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No friendship exists
          setFriendshipStatus(null);
          return;
        }
        throw new Error('Could not fetch friendship status');
      }

      const data = await response.json();
      setFriendshipStatus(data.status);
    } catch (err) {
      console.error('Error fetching friendship status:', err);
      // Default to no friendship if error
      setFriendshipStatus(null);
    }
  };

  // Function to send a friend request
  const sendFriendRequest = async () => {
    try {
      setFriendRequestSending(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = userId || userData?.UserID;
      if (!targetUserId) return;

      const response = await fetch(`/api/friendships`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          friendId: targetUserId
        })
      });

      if (!response.ok) {
        throw new Error('Could not send friend request');
      }

      setFriendshipStatus('pending');
      setFriendActionSuccess('Đã gửi lời mời kết bạn');
      setTimeout(() => setFriendActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setUploadError('Không thể gửi lời mời kết bạn');
    } finally {
      setFriendRequestSending(false);
    }
  };

  // Function to accept a friend request
  const acceptFriendRequest = async () => {
    try {
      setFriendRequestSending(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = userId || userData?.UserID;
      if (!targetUserId) return;

      const response = await fetch(`/api/friendships/${targetUserId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not accept friend request');
      }

      setFriendshipStatus('accepted');
      setFriendActionSuccess('Đã chấp nhận lời mời kết bạn');
      setTimeout(() => setFriendActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setUploadError('Không thể chấp nhận lời mời kết bạn');
    } finally {
      setFriendRequestSending(false);
    }
  };

  // Function to reject a friend request
  const rejectFriendRequest = async () => {
    try {
      setFriendRequestSending(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = userId || userData?.UserID;
      if (!targetUserId) return;

      const response = await fetch(`/api/friendships/${targetUserId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not reject friend request');
      }

      setFriendshipStatus('rejected');
      setFriendActionSuccess('Đã từ chối lời mời kết bạn');
      setTimeout(() => setFriendActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      setUploadError('Không thể từ chối lời mời kết bạn');
    } finally {
      setFriendRequestSending(false);
    }
  };

  // Function to remove a friend
  const removeFriend = async () => {
    try {
      setFriendRequestSending(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = userId || userData?.UserID;
      if (!targetUserId) return;

      const response = await fetch(`/api/friendships/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not remove friend');
      }

      setFriendshipStatus(null);
      setFriendActionSuccess('Đã hủy kết bạn');
      setTimeout(() => setFriendActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error removing friend:', err);
      setUploadError('Không thể hủy kết bạn');
    } finally {
      setFriendRequestSending(false);
    }
  };

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setPostsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const targetUserId = userId || userData?.UserID;
        if (!targetUserId) return;

        const response = await fetch(`/api/posts/user/${targetUserId}?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Could not fetch user posts');
        }

        const data = await response.json();
        setUserPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setPostsError(err.message);
      } finally {
        setPostsLoading(false);
      }
    };

    if (userData || userId) {
      fetchUserPosts();
    }
  }, [userData, userId]);

  const handleEdit = () => {
    setEditedData({
      ...userData,
      DateOfBirth: userData.DateOfBirth ? userData.DateOfBirth.split('T')[0] : ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(null);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setError(null);
    setFieldErrors({});

    // Validate phone number
    const phoneRegex = /^[0-9]{10,11}$/;
    if (editedData.PhoneNumber && !phoneRegex.test(editedData.PhoneNumber)) {
      setFieldErrors(prev => ({
        ...prev,
        PhoneNumber: 'Số điện thoại không hợp lệ'
      }));
      return;
    }

    // Validate date of birth
    if (editedData.DateOfBirth) {
      const birthDate = new Date(editedData.DateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        setFieldErrors(prev => ({
          ...prev,
          DateOfBirth: 'Ngày sinh không hợp lệ'
        }));
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      
      // Chỉ gửi các trường được phép cập nhật
      const updateData = {
        PhoneNumber: editedData.PhoneNumber,
        DateOfBirth: editedData.DateOfBirth,
        School: editedData.School,
        Address: editedData.Address,
        City: editedData.City
      };

      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' }
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật thông tin');
      }

      const updatedUser = await response.json();

      // Format dates
      if (updatedUser.DateOfBirth) {
        updatedUser.DateOfBirth = new Date(updatedUser.DateOfBirth).toISOString();
      }
      if (updatedUser.CreatedAt) {
        updatedUser.CreatedAt = new Date(updatedUser.CreatedAt).toISOString();
      }
      if (updatedUser.LastLoginAt) {
        updatedUser.LastLoginAt = new Date(updatedUser.LastLoginAt).toISOString();
      }

      setUserData(updatedUser);
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
    }
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
        throw new Error('Could not like post');
      }

      // Update like status in the UI
      setUserPosts(userPosts.map(post => {
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
    try {
      // Update the UI immediately to reflect comment count change
      setUserPosts(userPosts.map(post => {
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
    }
  };

  const handleEditPost = async (postId, updatedContent) => {
    try {
      const token = localStorage.getItem('token');
      
      // First update the post content
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
        throw new Error('Could not update post');
      }

      // Update post in the UI
      setUserPosts(userPosts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            Content: updatedContent,
            IsEdited: true
          };
        }
        return post;
      }));
      
      return true;
    } catch (error) {
      console.error('Error editing post:', error);
      return false;
    }
  };

  // Function to refresh posts after media changes
  const refreshPostMedia = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Could not fetch updated post');
      }

      const updatedPost = await response.json();

      // Update the post in the UI with new media
      setUserPosts(userPosts.map(post => {
        if (post.PostID === postId) {
          return {
            ...post,
            media: updatedPost.media,
            IsEdited: true
          };
        }
        return post;
      }));
      
      return true;
    } catch (error) {
      console.error('Error refreshing post media:', error);
      return false;
    }
  };

  const handleProfilePictureClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePictureChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and GIF files are allowed');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploadingImage(true);
      setUploadError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      
      // Update user data with new profile image
      setUserData(prev => ({
        ...prev,
        Image: data.profileImage
      }));
      
      // Update user data in localStorage to sync across all pages
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.Image = data.profileImage;
        
        // Also update avatar field which might be used by other components
        if (currentUser.avatar) {
          currentUser.avatar = data.profileImage;
        }
        
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Update Redux store
        dispatch(updateProfileImage(data.profileImage));
        
        // Dispatch a custom event to notify other components about the profile update
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { profileImage: data.profileImage }
        }));
      } catch (storageError) {
        console.error('Error updating user in localStorage:', storageError);
      }
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setUploadError(err.message);
    } finally {
      setUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // New function to handle starting a chat with the profile user
  const handleStartChat = () => {
    try {
      // Make sure we have all the needed user data to start a chat
      if (!userData) {
        console.error('No user data available');
        // showToast('error', 'Không thể bắt đầu chat: Dữ liệu người dùng không có sẵn'); // Removed showToast as it's not defined
        return;
      }
      
      // Make sure we have at least the user ID
      const userId = userData.UserID || userData.id;
      if (!userId) {
        console.error('User ID is missing');
        // showToast('error', 'Không thể bắt đầu chat: ID người dùng bị thiếu'); // Removed showToast
        return;
      }
      
      // Prepare complete user data to pass to the chat page
      const userDataForChat = {
        UserID: userId,
        id: userId,
        FullName: userData.FullName || userData.Username,
        Username: userData.Username,
        Email: userData.Email,
        Image: userData.Image || userData.Avatar
      };
      
      console.log('Starting chat with user:', userDataForChat);
      
      // Store selected user in localStorage as backup in case state is lost
      localStorage.setItem('selectedUserFromProfile', JSON.stringify(userDataForChat));
      
      // Navigate to chat page with user data
      navigate(`/chat`, { 
        state: { 
          selectedUser: userDataForChat,
          source: 'profile'
        } 
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      // showToast('error', 'Đã xảy ra lỗi khi bắt đầu cuộc trò chuyện'); // Removed showToast
    }
  };

  // New function to fetch friends
  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = userId || userData?.UserID;
      if (!targetUserId) return;

      let endpoint = `/api/friendships/user/${targetUserId}`;
      if (!userId && isOwnProfile) {
        endpoint = '/api/friendships';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not fetch friends');
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        // Response for other user's friends
        setUserFriends(data);
      } else if (data.friends) {
        // Response for current user's friends
        setUserFriends(data.friends);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriendsError(err.message);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.UserID || userId) {
      fetchFriends();
    }
  }, [userData, userId, isOwnProfile]);

  // New function to fetch bookmarked posts
  const fetchBookmarkedPosts = async () => {
    if (!isOwnProfile) return; // Only fetch bookmarks for own profile
    
    try {
      setBookmarksLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/posts/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not fetch bookmarked posts');
      }

      const data = await response.json();
      setBookmarkedPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching bookmarked posts:', err);
      setBookmarksError(err.message);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Call fetchBookmarkedPosts when tab changes to 'saved'
  useEffect(() => {
    if (activeTab === 'saved' && isOwnProfile && bookmarkedPosts.length === 0 && !bookmarksLoading) {
      fetchBookmarkedPosts();
    }
  }, [activeTab, isOwnProfile]);

  // Add handling for bookmarks
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
        throw new Error('Failed to toggle bookmark');
      }
      
      // If on the saved posts tab, remove the post from the list
      if (activeTab === 'saved') {
        setBookmarkedPosts(prev => prev.filter(post => post.PostID !== postId));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Function to handle adding a new education item
  const handleAddEducation = () => {
    const newEducation = {
      id: Date.now(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    
    setEducationData(prev => [...prev, newEducation]);
  };

  // Function to update an education item
  const handleUpdateEducation = (id, field, value) => {
    setEducationData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Function to remove an education item
  const handleRemoveEducation = (id) => {
    setEducationData(prevData => prevData.filter(item => item.id !== id));
  };

  // Function to add a new work experience item
  const handleAddWorkExperience = () => {
    const newWorkExperience = {
      id: Date.now(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    
    setWorkExperienceData(prev => [...prev, newWorkExperience]);
  };

  // Function to update a work experience item
  const handleUpdateWorkExperience = (id, field, value) => {
    setWorkExperienceData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Function to remove a work experience item
  const handleRemoveWorkExperience = (id) => {
    setWorkExperienceData(prevData => prevData.filter(item => item.id !== id));
  };

  // Function to save education
  const handleSaveEducation = async () => {
    try {
      // setEducationLoading(true); // Removed as per new_code
      await userServices.updateEducation(educationData);
      // setEditingEducation(false); // Removed as per new_code
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      // Refresh profile data
      const response = await userServices.getUserProfile();
      if (response.data.profile.Education) {
        setEducationData(response.data.profile.Education);
      }
    } catch (error) {
      console.error('Error saving education:', error);
      setError('Không thể lưu thông tin học vấn');
    } finally {
      // setEducationLoading(false); // Removed as per new_code
    }
  };

  // Function to save work experience
  const handleSaveWorkExperience = async () => {
    try {
      // setWorkExpLoading(true); // Removed as per new_code
      await userServices.updateWorkExperience(workExperienceData);
      // setEditingWorkExperience(false); // Removed as per new_code
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      // Refresh profile data
      const response = await userServices.getUserProfile();
      if (response.data.profile.WorkExperience) {
        setWorkExperienceData(response.data.profile.WorkExperience);
      }
    } catch (error) {
      console.error('Error saving work experience:', error);
      setError('Không thể lưu thông tin kinh nghiệm làm việc');
    } finally {
      // setWorkExpLoading(false); // Removed as per new_code
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success notification */}
      {updateSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center justify-between">
          <div className="flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            <span>Cập nhật thông tin thành công!</span>
          </div>
          <button onClick={() => setUpdateSuccess(false)} className="ml-4 text-green-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Friend action success notification */}
      {friendActionSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center justify-between">
          <div className="flex items-center">
            <CheckIcon className="h-5 w-5 mr-2" />
            <span>{friendActionSuccess}</span>
          </div>
          <button onClick={() => setFriendActionSuccess(null)} className="ml-4 text-green-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Upload error notification */}
      {uploadError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50 flex items-center justify-between">
          <div className="flex items-center">
            <XMarkIcon className="h-5 w-5 mr-2" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="ml-4 text-red-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowEmailVerification(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                  onClick={() => setShowEmailVerification(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <EmailVerification onClose={(success) => {
                setShowEmailVerification(false);
                if (success) {
                  // Update user data after successful verification
                  setUserData(prev => ({
                    ...prev,
                    EmailVerified: true
                  }));
                }
              }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Main container with max width */}
      <div className="max-w-full mx-auto">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Sidebar - Profile Info */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-white border-r border-gray-200">
            <div className="p-6 h-full">
              {/* Profile Header */}
              <div className="mb-6">
                {/* Avatar and basic info */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className="relative mb-4">
                    {isOwnProfile && (
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        accept="image/*"
                      />
                    )}
                    
                    <div className="relative">
                      <Avatar 
                        src={userData?.Image}
                        name={userData?.FullName}
                        alt={userData?.FullName}
                        size="xl"
                        className="w-24 h-24 border-2 border-gray-200"
                        onClick={isOwnProfile ? handleProfilePictureClick : undefined}
                      />
                      
                      {isOwnProfile && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer" onClick={handleProfilePictureClick}>
                          {uploadingImage ? (
                            <ArrowPathIcon className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <CameraIcon className="h-6 w-6 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and username */}
                  <div className="text-center sm:text-left mb-4 w-full">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      {userData?.FullName}
                    </h1>
                    <p className="text-gray-600 text-sm mb-2">@{userData?.Username}</p>
                    <p className="text-gray-500 text-sm">
                      {userData?.Role === 'STUDENT' ? 'Học sinh' : userData?.Role === 'TEACHER' ? 'Giáo viên' : 'Quản trị viên'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 w-full mb-6">
                    {!isOwnProfile && (
                      <>
                        {/* Friend request button */}
                        {friendshipStatus === null && (
                          <button
                            onClick={sendFriendRequest}
                            disabled={friendRequestSending}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                          >
                            {friendRequestSending ? 
                              <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 
                              <UserPlusIcon className="h-4 w-4" />
                            }
                            <span>Kết bạn</span>
                          </button>
                        )}
                        
                        {friendshipStatus === 'pending' && (
                          <button
                            onClick={acceptFriendRequest}
                            disabled={friendRequestSending}
                            className="flex-1 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                          >
                            {friendRequestSending ? 
                              <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 
                              <ClockIcon className="h-4 w-4" />
                            }
                            <span>Chấp nhận</span>
                          </button>
                        )}
                        
                        {friendshipStatus === 'accepted' && (
                          <button
                            onClick={removeFriend}
                            disabled={friendRequestSending}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
                          >
                            {friendRequestSending ? 
                              <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 
                              <UserMinusIcon className="h-4 w-4" />
                            }
                            <span>Bạn bè</span>
                          </button>
                        )}

                        {/* Chat button */}
                        <button
                          onClick={handleStartChat}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          <span>Chat</span>
                        </button>
                      </>
                    )}
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => navigate('/settings', { state: { activeTab: 'general' } })}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        <CogIcon className="h-4 w-4" />
                        <span>Chỉnh sửa hồ sơ</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{userPosts.length}</div>
                    <div className="text-xs text-gray-500">Bài viết</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{userFriends.length}</div>
                    <div className="text-xs text-gray-500">Bạn bè</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {isOwnProfile ? bookmarkedPosts.length : 0}
                    </div>
                    <div className="text-xs text-gray-500">Đã lưu</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <div className="space-y-3">
                  {userData?.Email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="truncate">{userData.Email}</span>
                      {(userData?.EmailVerified === true || userData?.emailVerified === true) ? (
                        <ShieldCheckIcon className="h-4 w-4 ml-2 text-green-500" />
                      ) : (
                        <span className="ml-2 text-xs text-red-500">(Chưa xác thực)</span>
                      )}
                    </div>
                  )}
                  
                  {userData?.PhoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{userData.PhoneNumber}</span>
                    </div>
                  )}
                  
                  {userData?.School && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BuildingLibraryIcon className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="truncate">{userData.School}</span>
                    </div>
                  )}
                  
                  {userData?.Address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="truncate">{userData.Address}</span>
                    </div>
                  )}
                  
                  {userData?.DateOfBirth && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-3 text-gray-400" />
                      <span>Ngày sinh: {formatDate(userData.DateOfBirth)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Tham gia {formatDate(userData?.CreatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Education */}
              {educationData.length > 0 && (
                <div className="mb-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    Học vấn
                  </h3>
                  <div className="space-y-3">
                    {educationData.slice(0, 2).map((edu, index) => (
                      <div key={edu.id || index} className="text-sm">
                        <div className="font-medium text-gray-900">{edu.school}</div>
                        <div className="text-gray-600">
                          {edu.degree} {edu.field ? `- ${edu.field}` : ''}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {edu.startDate && format(new Date(edu.startDate), 'MM/yyyy', { locale: vi })} - {edu.current ? 'Hiện tại' : edu.endDate && format(new Date(edu.endDate), 'MM/yyyy', { locale: vi })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {workExperienceData.length > 0 && (
                <div className="mb-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-2" />
                    Kinh nghiệm
                  </h3>
                  <div className="space-y-3">
                    {workExperienceData.slice(0, 2).map((work, index) => (
                      <div key={work.id || index} className="text-sm">
                        <div className="font-medium text-gray-900">{work.company}</div>
                        <div className="text-gray-600">{work.position}</div>
                        <div className="text-gray-500 text-xs">
                          {work.startDate && format(new Date(work.startDate), 'MM/yyyy', { locale: vi })} - {work.current ? 'Hiện tại' : work.endDate && format(new Date(work.endDate), 'MM/yyyy', { locale: vi })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends Preview */}
              {userFriends.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Bạn bè ({userFriends.length})
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {userFriends.slice(0, 6).map(friend => (
                      <div 
                        key={friend.UserID || friend.FriendID}
                        className="cursor-pointer"
                        onClick={() => navigate(`/profile/${friend.UserID || friend.FriendID}`)}
                      >
                        <Avatar 
                          src={friend.Image || friend.FriendProfilePicture} 
                          name={friend.FullName || friend.FriendFullName}
                          size="sm"
                          className="w-8 h-8"
                        />
                      </div>
                    ))}
                  </div>
                  {userFriends.length > 6 && (
                    <button 
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      onClick={() => navigate(isOwnProfile ? '/friends' : `/friends?userId=${userId}`)}
                    >
                      Xem tất cả {userFriends.length} bạn bè
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Posts */}
          <div className="flex-1 min-w-0 bg-white">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'all' 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('all')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Bài viết</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {userPosts.length}
                    </span>
                  </div>
                </button>
                
                <button
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'image' 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('image')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <PhotoIcon className="h-4 w-4" />
                    <span>Ảnh</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {filteredPosts(userPosts, 'image').length}
                    </span>
                  </div>
                </button>
                
                <button
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'video' 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('video')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Video</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {filteredPosts(userPosts, 'video').length}
                    </span>
                  </div>
                </button>
                
                {isOwnProfile && (
                  <button
                    className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'saved' 
                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('saved')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BookmarkIcon className="h-4 w-4" />
                      <span>Đã lưu</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {bookmarkedPosts.length}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-screen">
              {/* Posts Content */}
              {activeTab === 'saved' ? (
                <div className="p-6">
                  {bookmarksLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Đang tải bài viết đã lưu...</p>
                    </div>
                  ) : bookmarksError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">Không thể tải bài viết đã lưu: {bookmarksError}</p>
                    </div>
                  ) : bookmarkedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <BookmarkIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bài viết đã lưu</h3>
                      <p className="text-gray-500 mb-4">Bài viết bạn lưu sẽ hiển thị tại đây.</p>
                      <button
                        onClick={() => navigate('/posts')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Khám phá bài viết
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <PostList 
                        initialPosts={bookmarkedPosts} 
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={(postId) => console.log('Share:', postId)}
                        onEdit={handleEditPost}
                        onRefreshMedia={refreshPostMedia}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  {postsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Đang tải bài viết...</p>
                    </div>
                  ) : postsError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">Không thể tải bài viết: {postsError}</p>
                    </div>
                  ) : filteredPosts(userPosts, activeTab).length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {activeTab === 'all' && 'Chưa có bài viết'}
                        {activeTab === 'image' && 'Chưa có bài viết với ảnh'}
                        {activeTab === 'video' && 'Chưa có bài viết với video'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {isOwnProfile 
                          ? 'Hãy chia sẻ điều gì đó với cộng đồng!' 
                          : `${userData?.FullName} chưa chia sẻ ${activeTab === 'all' ? 'bài viết' : activeTab === 'image' ? 'ảnh' : 'video'} nào.`
                        }
                      </p>
                      {isOwnProfile && (
                        <button
                          onClick={() => navigate('/posts')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Tạo bài viết đầu tiên
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <PostList 
                        initialPosts={filteredPosts(userPosts, activeTab)} 
                        onLike={handleLike}
                        onComment={handleComment}
                        onShare={(postId) => console.log('Share:', postId)}
                        onEdit={handleEditPost}
                        onRefreshMedia={refreshPostMedia}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to filter posts by tab
function filteredPosts(posts, tab) {
  if (!Array.isArray(posts)) return [];
  if (tab === 'all') return posts;
  if (tab === 'image') {
    return posts.filter(post => Array.isArray(post.media) && post.media.some(m => m.MediaType === 'image'));
  }
  if (tab === 'video') {
    return posts.filter(post => Array.isArray(post.media) && post.media.some(m => m.MediaType === 'video'));
  }
  return posts;
}

export default Profile;
