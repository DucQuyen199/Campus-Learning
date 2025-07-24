/*-----------------------------------------------------------------
* File: rankingSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get the API URL from env or use a default
// Make sure it has the trailing slash removed
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

// Fetch all rankings with optional filters
export const fetchRankings = createAsyncThunk(
  'ranking/fetchRankings',
  async ({ timeRange = 'all', category = 'all' } = {}, { rejectWithValue }) => {
    try {
      console.log(`Fetching rankings from: ${API_BASE}/api/rankings with filters:`, { timeRange, category });
      
      const response = await axios.get(`${API_BASE}/api/rankings`, {
        params: { timeRange, category }
      });
      
      console.log('Rankings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch a specific user's ranking
export const fetchUserRanking = createAsyncThunk(
  'ranking/fetchUserRanking',
  async (userId, { rejectWithValue }) => {
    try {
      console.log(`Fetching user ranking from: ${API_BASE}/api/rankings/user/${userId}`);
      
      const response = await axios.get(`${API_BASE}/api/rankings/user/${userId}`);
      
      console.log('User ranking response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user ranking:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add points to a user
export const addRankingPoints = createAsyncThunk(
  'ranking/addPoints',
  async ({ userId, points, reason, type }, { rejectWithValue }) => {
    try {
      console.log(`Adding points to user ${userId} at: ${API_BASE}/api/rankings/user/${userId}/points`);
      
      const response = await axios.post(
        `${API_BASE}/api/rankings/user/${userId}/points`,
        { points, reason, type },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Add points response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add points:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const rankingSlice = createSlice({
  name: 'ranking',
  initialState: {
    rankings: [],
    userRanking: null,
    loading: false,
    error: null,
    timeRange: 'all',
    category: 'all'
  },
  reducers: {
    setTimeRange: (state, action) => {
      state.timeRange = action.payload;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch rankings cases
      .addCase(fetchRankings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRankings.fulfilled, (state, action) => {
        state.loading = false;
        state.rankings = action.payload || [];
      })
      .addCase(fetchRankings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      
      // Fetch user ranking cases
      .addCase(fetchUserRanking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRanking.fulfilled, (state, action) => {
        state.loading = false;
        state.userRanking = action.payload;
      })
      .addCase(fetchUserRanking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      
      // Add points cases
      .addCase(addRankingPoints.fulfilled, (state, action) => {
        // We'll refetch the user's ranking after adding points
      });
  }
});

export const { setTimeRange, setCategory } = rankingSlice.actions;
export default rankingSlice.reducer; 
