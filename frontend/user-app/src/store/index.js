/*-----------------------------------------------------------------
* File: index.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import eventReducer from './slices/eventSlice';
import notificationReducer from './slices/notificationSlice';
import postReducer from './slices/postSlice';
import rankingReducer from './slices/rankingSlice';
import aiChatReducer from './slices/aiChatSlice';
import chatReducer from './slices/chatSlice';
import reportReducer from './slices/reportSlice';
import userReducer from './slices/userSlice';
import examReducer from './slices/examSlice';

// Enhanced store configuration with better error handling
const store = configureStore({
  reducer: {
    auth: authReducer,
    course: courseReducer,
    event: eventReducer,
    notification: notificationReducer,
    post: postReducer,
    ranking: rankingReducer,
    aiChat: aiChatReducer,
    chat: chatReducer,
    report: reportReducer,
    user: userReducer,
    exam: examReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      // Add extra logging in development
      ...(process.env.NODE_ENV === 'development' && {
        immutableCheck: { warnAfter: 300 },
        serializableCheck: { warnAfter: 300 }
      })
    }),
  // Enable Redux DevTools extension if available
  devTools: process.env.NODE_ENV !== 'production'
});

// Log initial state for debugging
console.log('Initial Redux State:', store.getState());

export default store;
