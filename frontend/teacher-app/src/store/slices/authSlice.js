/*-----------------------------------------------------------------
* File: authSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice } from '@reduxjs/toolkit';
import jwtDecode from 'jwt-decode';

const initialState = {
  user: null,
  token: localStorage.getItem('teacherToken') || null,
  isAuthenticated: false,
};

// If token exists, validate and decode it
if (initialState.token) {
  try {
    const decoded = jwtDecode(initialState.token);
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      initialState.token = null;
      localStorage.removeItem('teacherToken');
    } else {
      initialState.user = decoded;
      initialState.isAuthenticated = true;
    }
  } catch (error) {
    initialState.token = null;
    localStorage.removeItem('teacherToken');
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      const { user, token } = payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('teacherToken', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('teacherToken');
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated; 
