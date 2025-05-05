import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userServices } from '@/services/api';
import settingsServices from '@/api/settings';

// Get user settings
export const getUserSettings = createAsyncThunk(
  'user/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsServices.getUserSettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update user settings
export const updateUserSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await settingsServices.updateSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userServices.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Upload profile picture
export const uploadProfilePicture = createAsyncThunk(
  'user/uploadProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await settingsServices.uploadProfilePicture(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'user/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await settingsServices.changePassword(currentPassword, newPassword);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete account 
export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async ({ password, reason }, { rejectWithValue }) => {
    try {
      const response = await settingsServices.deleteAccount(password, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    settings: null,
    profileInfo: null,
    loading: false,
    error: null,
    success: false,
    message: null
  },
  reducers: {
    clearUserState: (state) => {
      state.error = null;
      state.success = false;
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get settings
      .addCase(getUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload.settings;
        state.profileInfo = action.payload.profileInfo;
        state.success = true;
      })
      .addCase(getUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể lấy cài đặt người dùng';
      })
      
      // Update settings
      .addCase(updateUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload.settings;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể cập nhật cài đặt';
        state.success = false;
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileInfo = {
          ...state.profileInfo,
          fullName: action.payload.FullName,
          username: action.payload.Username
        };
        state.success = true;
        state.message = 'Hồ sơ đã được cập nhật thành công';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể cập nhật hồ sơ';
        state.success = false;
      })
      
      // Upload profile picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profileInfo) {
          state.profileInfo.profileImage = action.payload.profileImage;
        }
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể tải lên ảnh đại diện';
        state.success = false;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể thay đổi mật khẩu';
        state.success = false;
      })
      
      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Không thể xóa tài khoản';
        state.success = false;
      });
  }
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer; 