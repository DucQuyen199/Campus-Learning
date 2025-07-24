/*-----------------------------------------------------------------
* File: ExamTimer.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const ExamTimer = ({ duration, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    // Set the initial time left
    setTimeLeft(duration);
    
    // Set up interval to decrease time
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Call the expire callback
          onExpire && onExpire();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timer);
  }, [duration, onExpire]);
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Calculate progress percentage (inverted so it goes down)
  const progress = (timeLeft / duration) * 100;
  
  // Determine color based on time left
  const getTimerColor = () => {
    if (progress > 50) return 'success';
    if (progress > 20) return 'warning';
    return 'error';
  };
  
  const timerColor = getTimerColor();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minWidth: '150px',
      border: 1,
      borderColor: timerColor + '.main',
      borderRadius: 1,
      p: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <AccessTimeIcon color={timerColor} sx={{ mr: 1 }} />
        <Typography 
          variant="h6" 
          color={timerColor + '.main'} 
          fontWeight="bold"
        >
          {formatTime(timeLeft)}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        color={timerColor}
        sx={{ width: '100%', height: 8, borderRadius: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Time Remaining
      </Typography>
    </Box>
  );
};

export default ExamTimer; 
