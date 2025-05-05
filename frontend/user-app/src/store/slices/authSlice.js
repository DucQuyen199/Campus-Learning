import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authServices } from '@/services/api';

// Async thunk cho đăng nhập
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authServices.login(credentials.username, credentials.password);
      
      // Store token consistently in both locations for compatibility
      const token = response.data.token || response.data.accessToken;
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token); // For compatibility
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(
        error.response?.data || { 
          message: 'Đăng nhập thất bại. Vui lòng thử lại sau.' 
        }
      );
    }
  }
);

// Async thunk cho đăng ký
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Sending registration request to:', '/api/auth/register');
      console.log('Registration data:', {
        ...userData,
        role: 'STUDENT',
        status: 'ONLINE',
        accountStatus: 'ACTIVE',
        provider: 'local',
        emailVerified: false
      });
      
      const response = await authServices.register({
        ...userData,
        role: 'STUDENT',
        status: 'ONLINE',
        accountStatus: 'ACTIVE',
        provider: 'local',
        emailVerified: false
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      if (error.response?.status === 403) {
        return rejectWithValue({
          message: 'Không có quyền đăng ký. Vui lòng liên hệ quản trị viên.'
        });
      }
      
      return rejectWithValue(
        error.response?.data || { 
          message: 'Đăng ký thất bại. Vui lòng thử lại sau.'
        }
      );
    }
  }
);

// Async thunk để lấy thông tin user
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authServices.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Không thể lấy thông tin người dùng' });
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProfileImage: (state, action) => {
      if (state.user) {
        state.user.Image = action.payload;
        // Also update avatar field if it exists
        if (state.user.avatar) {
          state.user.avatar = action.payload;
        }
      }
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Đăng nhập thất bại';
      })
      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Đăng ký thất bại';
      })
      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });
  }
});

export const { logout, clearError, updateProfileImage, setUser } = authSlice.actions;
export default authSlice.reducer; 