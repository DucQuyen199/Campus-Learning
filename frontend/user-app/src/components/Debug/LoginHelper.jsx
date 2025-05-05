import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authServices } from '../../services/api';
// Assuming you have a login action in authSlice
// If not, you can modify this to work with your auth system
import { login } from '../../store/slices/authSlice';

const LoginHelper = () => {
  const [username, setUsername] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const [localStorageItems, setLocalStorageItems] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Get auth state from Redux if available
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Update localStorage display
  useEffect(() => {
    const updateLocalStorage = () => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        let value = localStorage.getItem(key);
        
        // Truncate long values
        if (value && value.length > 50) {
          value = value.substring(0, 50) + '...';
        }
        
        items[key] = value;
      }
      setLocalStorageItems(items);
    };
    
    updateLocalStorage();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', updateLocalStorage);
    return () => window.removeEventListener('storage', updateLocalStorage);
  }, []);

  const handleLogin = async () => {
    try {
      setMessage('Logging in...');
      
      // Call the login API
      const response = await authServices.login(username, password);
      
      // Extract token and user data
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update Redux state if applicable
      dispatch(login({ token, user }));
      
      setMessage(`Login successful! Token: ${token.substring(0, 10)}...`);
      console.log('Full authentication response:', response.data);
      
      // Refresh localStorage display
      setTimeout(() => {
        setLocalStorageItems({...localStorageItems});
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      setMessage(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setMessage('Cleared all authentication tokens');
    
    // Refresh localStorage display
    setTimeout(() => {
      setLocalStorageItems({...localStorageItems});
    }, 500);
  };

  return (
    <div style={{ 
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Debug Login Helper</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{ padding: '8px', marginRight: '8px', width: '200px' }}
        />
        
        <div style={{ display: 'flex', marginTop: '8px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: '8px', marginRight: '8px', width: '200px' }}
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            style={{ 
              padding: '4px 8px',
              backgroundColor: '#eee',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={handleLogin}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        
        <button 
          onClick={clearTokens}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Tokens
        </button>
      </div>
      
      {message && (
        <div style={{ 
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: message.includes('failed') ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px',
          color: message.includes('failed') ? '#c62828' : '#2e7d32'
        }}>
          {message}
        </div>
      )}
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>Redux Auth State</h4>
        <pre style={{ 
          backgroundColor: '#f5f5f5',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#555' }}>localStorage Items</h4>
        <pre style={{ 
          backgroundColor: '#f5f5f5',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          {JSON.stringify(localStorageItems, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default LoginHelper;