import adminApi from './config';

// Settings API endpoints
export const settingsAPI = {
  // Get system settings
  getSettings: async () => {
    try {
      const response = await adminApi.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { settings: {} };
    }
  },
  
  // Update system settings
  updateSettings: async (settingsData) => {
    try {
      const response = await adminApi.put('/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },
  
  // Get notification settings
  getNotificationSettings: async () => {
    try {
      const response = await adminApi.get('/settings/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return { notificationSettings: {} };
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (notificationData) => {
    try {
      const response = await adminApi.put('/settings/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },
  
  // Get system information
  getSystemInfo: async () => {
    try {
      const response = await adminApi.get('/settings/system-info');
      return response.data;
    } catch (error) {
      console.error('Error fetching system information:', error);
      return { systemInfo: {} };
    }
  },
  
  // Update admin password
  updatePassword: async (passwordData) => {
    try {
      const response = await adminApi.put('/settings/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};

export default settingsAPI;
