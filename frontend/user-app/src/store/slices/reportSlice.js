/*-----------------------------------------------------------------
* File: reportSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userApi from '../../api/config';

export const createReport = createAsyncThunk(
  'reports/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await userApi.post('/reports', reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchUserReports = createAsyncThunk(
  'reports/fetchUserReports',
  async () => {
    const response = await userApi.get('/reports/user');
    return response.data;
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    reports: [],
    loading: false,
    error: null
  },
  reducers: {
    updateReportStatus: (state, action) => {
      const { reportId, status } = action.payload;
      const report = state.reports.find(r => r.id === reportId);
      if (report) {
        report.status = status;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.push(action.payload);
        state.error = null;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default reportSlice.reducer; 
