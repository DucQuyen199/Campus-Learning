import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth headers
const getAuthConfig = () => {
  return {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  };
};

// Get all stories
export const getAllStories = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/stories`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw error;
  }
};

// Create a new story
export const createStory = async (storyData) => {
  try {
    const formData = new FormData();
    
    // Append all story data to form data
    if (storyData.mediaFile) {
      formData.append('media', storyData.mediaFile);
    }
    
    formData.append('mediaType', storyData.mediaType);
    
    if (storyData.textContent) {
      formData.append('textContent', storyData.textContent);
    }
    
    if (storyData.backgroundColor) {
      formData.append('backgroundColor', storyData.backgroundColor);
    }
    
    if (storyData.fontStyle) {
      formData.append('fontStyle', storyData.fontStyle);
    }
    
    const response = await axios.post(
      `${API_URL}/api/stories`, 
      formData,
      {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
};

// Mark a story as viewed
export const viewStory = async (storyId) => {
  try {
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found');
      return;
    }
    
    const response = await axios.post(
      `${API_URL}/api/stories/${storyId}/view`, 
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    throw error;
  }
};

// Get list of users who viewed a story
export const getStoryViewers = async (storyId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/stories/${storyId}/viewers`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error getting story viewers:', error);
    throw error;
  }
};

// Delete a story
export const deleteStory = async (storyId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/stories/${storyId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

// Get stories by user
export const getUserStories = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/stories/user/${userId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user stories:', error);
    throw error;
  }
};

// Like a story
export const likeStory = async (storyId) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/stories/${storyId}/like`,
      {},
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error liking story:', error);
    throw error;
  }
};

// Reply to a story
export const replyToStory = async (storyId, content) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/stories/${storyId}/reply`,
      { content },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error replying to story:', error);
    throw error;
  }
};

export default {
  getAllStories,
  createStory,
  viewStory,
  deleteStory,
  getUserStories,
  getStoryViewers,
  likeStory,
  replyToStory
}; 