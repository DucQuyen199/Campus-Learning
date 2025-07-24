/*-----------------------------------------------------------------
* File: notificationSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationServices } from '../../services/api';

// Async thunk actions
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationServices.getAllNotifications();
      // Return the notifications array from the response
      return response.data.notifications || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Không thể tải thông báo');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationServices.getUnreadCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Không thể tải số thông báo chưa đọc');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  },
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure notifications is always an array
        state.notifications = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Initialize empty array on error to prevent map errors
        state.notifications = [];
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  }
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
