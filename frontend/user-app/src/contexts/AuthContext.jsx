import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Initial auth check - run only once at component mount
  useEffect(() => {
    if (initialAuthCheckDone) return;

    // Check for saved user and token on component mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        // Validate token format
        if (token.length < 10) {
          console.error('Invalid token format found in localStorage');
          clearAuthData();
          setLoading(false);
          setInitialAuthCheckDone(true);
          return;
        }
        
        const parsedUser = JSON.parse(savedUser);
        // Ensure the user object includes the token and id
        const userWithToken = {
          ...parsedUser,
          token: token,
          id: parsedUser.id || parsedUser.UserID || parsedUser.userId
        };
        
        if (!userWithToken.id) {
          console.error('User object does not contain ID information');
          clearAuthData();
          setLoading(false);
          setInitialAuthCheckDone(true);
          return;
        }
        
        setCurrentUser(userWithToken);
        setIsAuthenticated(true);
        
        // Optional: Check auth status in the background, but don't block UI rendering
        checkAuth().catch(err => console.error('Background auth check failed:', err));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        clearAuthData();
      }
    }
    
    setLoading(false);
    setInitialAuthCheckDone(true);
  }, [initialAuthCheckDone]);

  // Helper function to clear all auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });
      
      if (response.data && response.data.token) {
        const token = response.data.token;
        
        // Validate token
        if (token.length < 10) {
          throw new Error('Invalid token received from server');
        }
        
        localStorage.setItem('token', token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        const userData = response.data.user || {};
        
        // Ensure we have a user ID
        if (!userData.id && !userData.UserID && !userData.userId) {
          throw new Error('User data does not contain an ID field');
        }
        
        // Create a complete user object with token and normalize ID fields
        const userWithToken = {
          ...userData,
          token: token,
          // Ensure all ID fields are set for compatibility
          id: userData.id || userData.UserID || userData.userId,
          UserID: userData.id || userData.UserID || userData.userId,
          userId: userData.id || userData.UserID || userData.userId
        };
        
        // Save complete user data
        localStorage.setItem('user', JSON.stringify(userWithToken));
        
        setCurrentUser(userWithToken);
        setIsAuthenticated(true);
        
        return { success: true, user: userWithToken };
      } else {
        throw new Error('Login response did not contain token');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/register', userData);
      
      if (response.data && response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function - using clearAuthData helper
  const logout = async () => {
    try {
      // Call logout API if needed
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:5001/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.log('Logout API error:', err));
      }
    } finally {
      // Clear all auth data
      clearAuthData();
      // Redirect to login page will be handled by the components using this method
    }
  };

  // Check authentication status without redirecting - optimized to reduce unnecessary calls
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return false;
      }
      
      // Validate token
      if (token.length < 10) {
        console.error('Invalid token format in checkAuth');
        clearAuthData();
        return false;
      }
      
      const response = await axios.get('http://localhost:5001/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        // If we have updated user data, update the currentUser
        if (response.data.user) {
          // Normalize user ID fields
          const userId = 
            response.data.user.id || 
            response.data.user.UserID || 
            response.data.user.userId;
            
          if (!userId) {
            console.error('User data from auth check does not contain ID');
            return false;
          }
          
          const updatedUser = {
            ...response.data.user,
            token: token,
            // Normalize all ID fields for compatibility
            id: userId,
            UserID: userId,
            userId: userId
          };
          
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setIsAuthenticated(true);
        return true;
      }
      
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.warn('Auth check failed:', error);
      
      // Don't clear tokens or set authenticated to false on network errors
      if (error.response) {
        // If we receive a 401/403, clear user data
        if (error.response.status === 401 || error.response.status === 403) {
          clearAuthData();
        }
        return false;
      }
      
      // For network errors, assume user is still authenticated to prevent logout
      return true;
    }
  }, [clearAuthData]);

  // Refresh token function that can be called from outside
  const refreshUserToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      const token = localStorage.getItem('token');
      
      // If we have a token but no refresh token, we should still consider this valid
      // This prevents refreshing issues when an old session only had a token and no refresh token
      if (token && !refreshTokenValue) {
        console.log('No refresh token available but valid token exists');
        return true;
      }
      
      if (!refreshTokenValue) {
        console.log('No refresh token available for refresh');
        return false;
      }
      
      const response = await axios.post('http://localhost:5001/api/auth/refresh-token', {
        refreshToken: refreshTokenValue
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.log('Token refresh failed:', error.message);
      // Only clear on specific errors, not on network errors
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      return false;
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    authError,
    login,
    register,
    logout,
    checkAuth,
    refreshUserToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 