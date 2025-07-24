/*-----------------------------------------------------------------
* File: NotificationsPanel.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Dummy notifications data - in a real app this would come from an API
const dummyNotifications = [
  {
    id: 1,
    type: 'user',
    message: 'New user registration: John Smith',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
  },
  {
    id: 2,
    type: 'course',
    message: 'Course "Web Development Fundamentals" has been published',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
  },
  {
    id: 3,
    type: 'report',
    message: 'New content report submitted for review',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
  },
  {
    id: 4,
    type: 'system',
    message: 'System update completed successfully',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  },
  {
    id: 5,
    type: 'user',
    message: 'User Maria Johnson updated their profile',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
  }
];

const getIconForType = (type) => {
  switch (type) {
    case 'user':
      return <PersonIcon />;
    case 'course':
      return <SchoolIcon />;
    case 'report':
      return <WarningIcon color="error" />;
    case 'system':
      return <CheckCircleIcon color="success" />;
    default:
      return <NotificationsIcon />;
  }
};

const getTimeString = (timestamp) => {
  const now = new Date();
  const diffInHours = (now - timestamp) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return format(timestamp, 'h:mm a');
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return format(timestamp, 'MMM d');
  }
};

const formatNotificationDate = (date) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true,
    locale: vi 
  });
};

const NotificationsPanel = ({ open, onClose }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: 320,
          padding: 0
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 2, 
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Typography variant="h6">
          Notifications
        </Typography>
        <Box>
          <Tooltip title="Mark all as read">
            <IconButton size="small" sx={{ mr: 1 }}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <List sx={{ 
        padding: 0, 
        overflowY: 'auto', 
        maxHeight: 'calc(100vh - 130px)'
      }}>
        {dummyNotifications.length > 0 ? (
          dummyNotifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{ 
                  backgroundColor: notification.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {getIconForType(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{ 
                        fontWeight: notification.read ? 'normal' : 'bold',
                        display: 'block' 
                      }}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {getTimeString(notification.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}
      </List>
      
      <Box sx={{ 
        padding: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center' 
      }}>
        <Button variant="text" fullWidth>
          View all notifications
        </Button>
      </Box>
    </Drawer>
  );
};

export default NotificationsPanel; 
