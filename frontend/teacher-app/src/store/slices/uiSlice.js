/*-----------------------------------------------------------------
* File: uiSlice.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { createSlice } from '@reduxjs/toolkit';

// Check if user has a preference for sidebar state
const getSidebarState = () => {
  const savedState = localStorage.getItem('sidebarOpen');
  if (savedState !== null) {
    return savedState === 'true';
  }
  return true; // Default to open
};

const initialState = {
  sidebarOpen: getSidebarState(),
  theme: localStorage.getItem('theme') || 'light',
  notifications: {
    unreadCount: 0,
    items: [],
  },
  loading: {
    global: false, 
    specific: {},
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      localStorage.setItem('sidebarOpen', state.sidebarOpen);
    },
    setSidebarOpen: (state, { payload }) => {
      state.sidebarOpen = payload;
      localStorage.setItem('sidebarOpen', payload);
    },
    setTheme: (state, { payload }) => {
      state.theme = payload;
      localStorage.setItem('theme', payload);
    },
    setNotifications: (state, { payload }) => {
      state.notifications.items = payload.notifications;
      state.notifications.unreadCount = payload.unreadCount;
    },
    setGlobalLoading: (state, { payload }) => {
      state.loading.global = payload;
    },
    setSpecificLoading: (state, { payload }) => {
      state.loading.specific[payload.key] = payload.value;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarOpen, 
  setTheme,
  setNotifications,
  setGlobalLoading,
  setSpecificLoading,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectTheme = (state) => state.ui.theme;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadCount = (state) => state.ui.notifications.unreadCount;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectSpecificLoading = (key) => (state) => state.ui.loading.specific[key] || false; 
