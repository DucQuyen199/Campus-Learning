import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Button, Modal, Typography, Box, CircularProgress } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ExamMonitor = ({ participantId, onCheatingDetected, onFullscreenChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement !== null);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const navigate = useNavigate();

  // Handle entering fullscreen
  const enterFullscreen = () => {
    const docElement = document.documentElement;
    if (docElement.requestFullscreen) {
      docElement.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          if (onFullscreenChange) onFullscreenChange(true);
          logFullscreenReturn();
        })
        .catch((error) => {
          console.error('Error attempting to enable fullscreen:', error);
          alert('Unable to enter fullscreen mode. Please ensure your browser allows fullscreen and try again.');
        });
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = document.fullscreenElement !== null;
      setIsFullscreen(fullscreenActive);
      
      // Inform parent component about fullscreen state change
      if (onFullscreenChange) {
        onFullscreenChange(fullscreenActive);
      }
      
      if (!fullscreenActive && isFullscreen) {
        // User exited fullscreen - this is now treated as cheating
        logFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Initial fullscreen check
    if (!isFullscreen) {
      enterFullscreen();
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, participantId, onFullscreenChange]);

  // Countdown timer for redirection
  useEffect(() => {
    let timer;
    if (cheatingDetected && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (cheatingDetected && redirectCountdown === 0) {
      // When countdown reaches 0, redirect to results
      navigate(`/exam-results/${participantId}`);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [cheatingDetected, redirectCountdown, navigate, participantId]);

  // Log fullscreen exit
  const logFullscreenExit = async () => {
    try {
      const response = await axios.post(`/api/exams/${participantId}/fullscreen-exit`);
      
      if (response.data.cheatingDetected) {
        // Set state to show cheating detected modal
        setCheatingDetected(true);
        
        // Notify parent component about cheating detection
        if (onCheatingDetected) {
          onCheatingDetected();
        }
        
        // Start countdown for automatic redirect
        setRedirectCountdown(5);
        
        // If redirectTo is provided, use it
        if (response.data.redirectTo) {
          setTimeout(() => {
            navigate(response.data.redirectTo);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error logging fullscreen exit:', error);
      // On error, still try to redirect to results page
      setCheatingDetected(true);
      if (onCheatingDetected) {
        onCheatingDetected();
      }
      setTimeout(() => {
        navigate(`/exam-results/${participantId}`);
      }, 5000);
    }
  };

  // Log fullscreen return
  const logFullscreenReturn = async () => {
    try {
      await axios.post(`/api/exams/${participantId}/fullscreen-return`);
      // No longer needed to check for penalties since exiting is immediate cheating
    } catch (error) {
      console.error('Error logging fullscreen return:', error);
    }
  };

  // Render cheating detected modal
  if (cheatingDetected) {
    return (
      <Modal open={true}>
        <Box sx={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #f44336',
          boxShadow: 24,
          p: 4,
          textAlign: 'center'
        }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" component="h2" color="error" gutterBottom>
            Cheating Detected
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Exiting fullscreen mode is not permitted during an exam.
            Your exam has been terminated and marked as invalid.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Redirecting to results page in {redirectCountdown} seconds...
          </Typography>
          <CircularProgress sx={{ mt: 2 }} />
        </Box>
      </Modal>
    );
  }

  return (
    <>
      {!isFullscreen && (
        <Alert 
          severity="error" 
          action={
            <Button 
              color="error" 
              size="small"
              variant="contained"
              startIcon={<FullscreenIcon />}
              onClick={enterFullscreen}
            >
              Enter Fullscreen Now
            </Button>
          }
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            WARNING: You must complete this exam in fullscreen mode!
          </Typography>
          <Typography variant="body2">
            Exiting fullscreen is considered cheating and will terminate your exam immediately.
          </Typography>
        </Alert>
      )}
    </>
  );
};

export default ExamMonitor; 