import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Synchronous init from localStorage to avoid flash before token load
  const initialUser = (() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token && token.length > 10) {
        const parsed = JSON.parse(savedUser);
        return { ...parsed, token, id: parsed.id || parsed.UserID || parsed.userId };
      }
    } catch {}
    return null;
  })();

  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialUser);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Initial auth check - run only once at component mount
  useEffect(() => {
    if (initialAuthCheckDone || initialUser) return;

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Optional: Check auth status in the background, but don't block UI rendering
        checkAuth().catch(err => console.error('Background auth check failed:', err));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        clearAuthData();
      }
    }
    
    setLoading(false);
    setInitialAuthCheckDone(true);
  }, [initialAuthCheckDone, initialUser]);

  // Helper function to clear all auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      
      // Handle 2FA challenge from server
      if (response.data.twoFaRequired) {
        setAuthError(null);
        return { success: true, twoFaRequired: true, tempToken: response.data.tempToken };
      }
      
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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

  // Add OAuth login functions
  const loginWithGoogle = async (token) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      console.log('Starting Google login process with token:', token ? 'Token provided' : 'No token');
      
      if (!token) {
        throw new Error('No Google authentication token provided');
      }
      
      // Get API URL from env or use default
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${API_BASE_URL}/api/auth/google`, { token });
      
      console.log('Google login response received:', response.status);
      
      if (response.data && response.data.token) {
        const token = response.data.token;
        
        // Validate token
        if (token.length < 10) {
          throw new Error('Invalid token received from server');
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token); // Add secondary token storage for compatibility
        
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
        
        console.log('Google login successful, user authenticated:', userWithToken.id);
        return { success: true, user: userWithToken };
      } else {
        throw new Error('Login response did not contain token');
      }
    } catch (error) {
      console.error('Google login error:', error);
      // More detailed error logging
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Google login failed';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (accessToken) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/facebook', { accessToken });
      
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
        
        return { success: true, user: userWithToken };
      } else {
        throw new Error('Login response did not contain token');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Facebook login failed';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // OAuth connection management
  const connectOAuthProvider = async (provider, token) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const endpoint = provider === 'google' ? 'connect/google' : 'connect/facebook';
      const payload = provider === 'google' ? { token } : { accessToken: token };
      
      const response = await axios.post(`http://localhost:5001/api/auth/oauth/${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (response.data && response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data?.message || `Failed to connect ${provider}`);
      }
    } catch (error) {
      console.error(`${provider} connection error:`, error);
      const errorMessage = error.response?.data?.message || error.message || `${provider} connection failed`;
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disconnectOAuthProvider = async (provider) => {
    try {
      setAuthError(null);
      setLoading(true);
      
      const response = await axios.delete(`http://localhost:5001/api/auth/oauth/disconnect/${provider}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (response.data && response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data?.message || `Failed to disconnect ${provider}`);
      }
    } catch (error) {
      console.error(`${provider} disconnection error:`, error);
      const errorMessage = error.response?.data?.message || error.message || `${provider} disconnection failed`;
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getOAuthConnections = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/auth/oauth/connections', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (response.data && response.data.success) {
        return { success: true, connections: response.data.connections };
      } else {
        throw new Error(response.data?.message || 'Failed to get OAuth connections');
      }
    } catch (error) {
      console.error('Get OAuth connections error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get OAuth connections';
      return { success: false, error: errorMessage };
    }
  };

  // Add login2Fa function for verifying 2FA OTP
  const login2Fa = async (tempToken, otp) => {
    try {
      setAuthError(null);
      setLoading(true);
      const response = await axios.post('http://localhost:5001/api/auth/login-2fa', { otp }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      
      if (response.data.token) {
        const token = response.data.token;
        // Persist tokens
        localStorage.setItem('token', token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        const userData = response.data.user || {};
        const id = userData.id || userData.UserID || userData.userId;
        const userWithToken = {
          ...userData,
          token,
          id,
          UserID: id,
          userId: id
        };
        
        localStorage.setItem('user', JSON.stringify(userWithToken));
        setCurrentUser(userWithToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
        
        return { success: true, user: userWithToken };
      } else {
        throw new Error(response.data?.message || '2FA login failed');
      }
    } catch (error) {
      console.error('2FA login error:', error);
      const errorMessage = error.response?.data?.message || error.message || '2FA login failed';
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
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
        delete axios.defaults.headers.common['Authorization'];
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
    login2Fa,
    loginWithGoogle,
    loginWithFacebook,
    connectOAuthProvider,
    disconnectOAuthProvider,
    getOAuthConnections,
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