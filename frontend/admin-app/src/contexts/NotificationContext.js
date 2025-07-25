/*-----------------------------------------------------------------
* File: NotificationContext.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { createContext, useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = (message, type = 'info', autoClose = true) => {
    const id = uuidv4();
    const newNotification = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      createdAt: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto close after 5 seconds if autoClose is true
    if (autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }

    return id;
  };

  // Alias for addNotification to maintain backward compatibility
  const showNotification = addNotification;

  // Remove a notification by id
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Convenience methods for different notification types
  const success = (message, autoClose = true) => {
    return addNotification(message, 'success', autoClose);
  };

  const error = (message, autoClose = true) => {
    return addNotification(message, 'error', autoClose);
  };

  const info = (message, autoClose = true) => {
    return addNotification(message, 'info', autoClose);
  };

  const warning = (message, autoClose = true) => {
    return addNotification(message, 'warning', autoClose);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    addNotification,
    showNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
    clearAll,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 
